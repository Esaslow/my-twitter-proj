import subprocess
import json
import uuid
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import aiofiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for debugging)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"]  # Allow all headers
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log incoming requests."""
    print(f"[DEBUG] Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    return response

# Persistent storage file for process status
PROCESS_STATUS_FILE = "process_status.json"
LATEST_PROCESS_IDS_FILE = "latest_process_ids.json"

process_lock = asyncio.Lock()
processes = {}

class ScrapeRequest(BaseModel):
    username: str
    tweet_count: int

async def save_process_status():
    """Save the process status dictionary to a file."""
    try:
        async with aiofiles.open(PROCESS_STATUS_FILE, "w") as f:
            data = json.dumps(processes, indent=2)
            await f.write(data)
        print("[DEBUG] Process status successfully saved.")
    except Exception as e:
        print(f"[ERROR] Failed to save process status: {str(e)}")

async def load_process_status():
    """Load process status from a file (persists across reboots)."""
    global processes
    try:
        async with aiofiles.open(PROCESS_STATUS_FILE, "r") as f:
            data = await f.read()
            processes = json.loads(data)
        print("[DEBUG] Process status loaded from file.")
    except (FileNotFoundError, json.JSONDecodeError):
        processes = {}


async def save_latest_process_ids(process_id, username_count):
    """Save the last 20 process IDs with their username count to a file."""
    try:
        # Load existing process data
        if os.path.exists(LATEST_PROCESS_IDS_FILE):
            async with aiofiles.open(LATEST_PROCESS_IDS_FILE, "r") as f:
                content = await f.read()
                process_data = json.loads(content) if content else []
        else:
            process_data = []

        # Append new process ID with its username count
        process_data.append({"process_id": process_id, "username_count": username_count})
        process_data = process_data[-20:]  # Keep only the last 20 records 

        # ✅ Save updated list
        async with aiofiles.open(LATEST_PROCESS_IDS_FILE, "w") as f:
            await f.write(json.dumps(process_data, indent=2))

        print(f"\033[95m[DEBUG] Stored latest process data: {process_data}\033[0m")

    except Exception as e:
        print(f"\033[91m[ERROR] Failed to save latest process data: {str(e)}\033[0m")


async def load_latest_process_ids():
    """Load the last 5 process IDs from the file."""
    try:
        async with aiofiles.open(LATEST_PROCESS_IDS_FILE, "r") as f:
            content = await f.read()
            return json.loads(content) if content else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Load process status when FastAPI starts
@app.on_event("startup")
async def startup_event():
    await load_process_status()

async def run_scraping_task(process_id, username, tweet_count):
    """Run the tweet scraping process asynchronously."""
    print(f"[INFO] Starting scraping task for {username}, {tweet_count} tweets (Process ID: {process_id})")

    async with process_lock:
        processes[process_id] = {"status": "running", "tweets": []}
        await save_process_status()

    try:
        print(f"[INFO] Executing Node.js script: node scrape_tweets.js {username} {tweet_count}")

        process = await asyncio.create_subprocess_exec(
            "node", "scrape_tweets.js", username, str(tweet_count),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode().strip()
            print(f"[ERROR] Process {process_id} failed: {error_message}")
            async with process_lock:
                processes[process_id]["status"] = "error"
                processes[process_id]["error"] = error_message
                await save_process_status()
            return

        try:
            tweets = json.loads(stdout.decode().strip())  # Parse JSON response
            print(f"[INFO] Process {process_id} completed successfully. {len(tweets)} tweets scraped.")

            async with process_lock:
                processes[process_id]["status"] = "complete"
                processes[process_id]["tweets"] = tweets
                await save_process_status()

        except json.JSONDecodeError:
            print(f"[ERROR] JSON parse error for process {process_id}")
            async with process_lock:
                processes[process_id]["status"] = "error"
                processes[process_id]["error"] = "Failed to parse tweets"
                await save_process_status()

    except Exception as e:
        print(f"[ERROR] Unexpected error in process {process_id}: {str(e)}")
        async with process_lock:
            processes[process_id]["status"] = "error"
            processes[process_id]["error"] = str(e)
            await save_process_status()

@app.post("/api/start-process")
async def start_scraping(request: ScrapeRequest):
    """Endpoint to start a new scraping process."""
    process_id = str(uuid.uuid4())
    username_count = len(request.username.split(","))  # Count usernames
    print("\033[34m" + f"[INFO] Received request: username={request.username}, tweet_count={request.tweet_count} (Process ID: {process_id})" + "\033[0m")

    try:
        async with process_lock:
            processes[process_id] = {
                "status": "queued",
                "tweets": [],
                "username_count": username_count  # ✅ Store username count
            }
            await save_process_status()
        
        # ✅ Save the process ID to latest_process_ids.json
        await save_latest_process_ids(process_id,username_count)

        asyncio.create_task(run_scraping_task(process_id, request.username, request.tweet_count))
        print(f"[INFO] Scraping task started for process_id: {process_id}")

    except Exception as e:
        print(f"[ERROR] Exception while starting process: {str(e)}")

    return {"process_id": process_id}

@app.get("/api/process-status/{process_id}")
async def get_process_status(process_id: str):
    """Endpoint to check the status of a running or completed process."""
    async with process_lock:
        if process_id in processes:
            return processes[process_id]

    print(f"[ERROR] Process ID {process_id} not found.")
    raise HTTPException(status_code=404, detail=f"Process ID {process_id} not found")
