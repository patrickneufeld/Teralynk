# /Users/patrick/Projects/Teralynk/backend/src/api/logs_api.py

from fastapi import FastAPI
from pymongo import MongoClient
import json

app = FastAPI()

# MongoDB Connection
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
notifications_collection = db["ai_notifications"]

@app.get("/api/logs")
def get_logs():
    """
    Retrieve AI logs for the log page.
    """
    logs = list(notifications_collection.find().sort("timestamp", -1))
    for log in logs:
        log["_id"] = str(log["_id"])  # Convert ObjectId to string

    return {"logs": logs}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
