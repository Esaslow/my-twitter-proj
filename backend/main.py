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
    print(f"[DEBUG] Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    return response

# Persistent storage file for process status
PROCESS_STATUS_FILE = "process_status.json"
process_lock = asyncio.Lock()
processes = {}

class ScrapeRequest(BaseModel):
    username: str
    tweet_count: int

async def save_process_status():
    """Save the process status dictionary to a file (WITHOUT LOCK)."""
    print(f"[DEBUG] Attempting to save process status...")
    try:
        async with aiofiles.open(PROCESS_STATUS_FILE, "w") as f:
            data = json.dumps(processes, indent=2)
            print(f"[DEBUG] Writing JSON data to {PROCESS_STATUS_FILE}: {data[:100]}...")  # First 100 chars
            await f.write(data)
        print("[DEBUG] Successfully saved process status.")
    except Exception as e:
        print(f"[ERROR] Failed to save process status: {str(e)}")


async def load_process_status():
    """Load process status from a file (persists across reboots)."""
    global processes
    try:
        async with aiofiles.open(PROCESS_STATUS_FILE, "r") as f:
            data = await f.read()
            processes = json.loads(data)
    except (FileNotFoundError, json.JSONDecodeError):
        processes = {}

# Load process status when FastAPI starts
@app.on_event("startup")
async def startup_event():
    await load_process_status()

async def run_scraping_task(process_id, username, tweet_count):
    print(f"[DEBUG] Entered run_scraping_task() for process_id={process_id}, username={username}, tweet_count={tweet_count}")

    async with process_lock:
        print(f"[DEBUG] Acquired process lock for process_id: {process_id}")
        processes[process_id] = {"status": "running", "tweets": []}
        await save_process_status()
        print(f"[DEBUG] Process status saved for process_id: {process_id}")

    try:
        print(f"[DEBUG] Running subprocess: node scrape_tweets.js {username} {tweet_count}")

        process = await asyncio.create_subprocess_exec(
            "node", "scrape_tweets.js", username, str(tweet_count),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE  # ✅ Set working directory to backend
        )

        print("[DEBUG] Subprocess started, waiting for output...")

        stdout, stderr = await process.communicate()
        print(f"[DEBUG] Process return code: {process.returncode}")
        print(f"[DEBUG] STDOUT: {stdout.decode().strip()}")
        print(f"[DEBUG] STDERR: {stderr.decode().strip()}")

        if process.returncode != 0:
            error_message = stderr.decode().strip()
            print(f"[ERROR] Process {process_id} failed: {error_message}")
            async with process_lock:
                processes[process_id]["status"] = "error"
                processes[process_id]["error"] = error_message
                await save_process_status()
            return

        try:
            tweets = json.loads(stdout.decode().strip())  # Strip whitespace
            print(f"[DEBUG] Process {process_id} completed successfully.")

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
    print(f"[DEBUG] Entered start_scraping() for user: {request.username}, tweet_count: {request.tweet_count}")

    process_id = str(uuid.uuid4())  # Generate unique process ID
    print(f"[DEBUG] Generated process_id: {process_id}")

    try:
        async with process_lock:
            print(f"[DEBUG] Acquired process lock for process_id: {process_id}")
            processes[process_id] = {"status": "queued", "tweets": []}
            print(f"[DEBUG] Added process_id {process_id} to processes dictionary")
            await save_process_status()
            print(f"[DEBUG] Saved process status for process_id: {process_id}")

        print(f"[DEBUG] Releasing lock for process_id: {process_id}")

    except Exception as e:
        print(f"[ERROR] Exception while acquiring process lock: {str(e)}")

    print(f"[DEBUG] Creating background task for process_id: {process_id}")
    task = asyncio.create_task(run_scraping_task(process_id, request.username, request.tweet_count))
    print(f"[DEBUG] Background task created: {task}")

    print(f"[DEBUG] Returning response to client for process_id: {process_id}")
    return {"process_id": process_id}



@app.get("/api/process-status/{process_id}")
async def get_process_status(process_id: str):
    async with process_lock:
        print(f"[DEBUG] Checking process ID: {process_id}")
        print(f"[DEBUG] Active processes: {list(processes.keys())}")

        if process_id in processes:
            return processes[process_id]

    print(f"[ERROR] Process ID {process_id} not found in stored processes.")
    raise HTTPException(status_code=404, detail=f"Process ID {process_id} not found")
