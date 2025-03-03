import json

# Load process_status.json
with open("process_status.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract process IDs and their statuses
filtered_data = {process_id: {"status": details.get("status", "unknown")} for process_id, details in data.items()}

# Print readable output
print(json.dumps(filtered_data, indent=2))
