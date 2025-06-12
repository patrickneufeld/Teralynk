# /Users/patrick/Projects/Teralynk/backend/src/api/websocket_server.py

from fastapi import FastAPI, WebSocket
from pymongo import MongoClient
import json
import asyncio

app = FastAPI()

# MongoDB Connection
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]

# Collections
performance_logs = db["ai_performance_logs"]
notifications_collection = db["ai_notifications"]

# WebSocket Connections
websocket_connections = {
    "performance": [],
    "notifications": []
}

@app.websocket("/ws/performance")
async def performance_websocket(websocket: WebSocket):
    """
    WebSocket connection for streaming AI performance metrics in real time.
    """
    await websocket.accept()
    websocket_connections["performance"].append(websocket)

    try:
        while True:
            logs = list(performance_logs.find().sort("timestamp", -1).limit(10))
            data = {
                "mse": [log["mse"] for log in logs],
                "mae": [log["mae"] for log in logs],
                "rse": [log["rse"] for log in logs],
                "timestamps": [str(log["timestamp"]) for log in logs]
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(5)  # Stream updates every 5 seconds
    except Exception as e:
        print(f"WebSocket Disconnected (Performance): {e}")
    finally:
        websocket_connections["performance"].remove(websocket)

@app.websocket("/ws/notifications")
async def notifications_websocket(websocket: WebSocket):
    """
    WebSocket connection for streaming AI notifications in real time.
    """
    await websocket.accept()
    websocket_connections["notifications"].append(websocket)

    try:
        while True:
            notifications = list(notifications_collection.find().sort("timestamp", -1).limit(10))
            data = {
                "notifications": [
                    {
                        "_id": str(n["_id"]),
                        "update_details": n["update_details"],
                        "status": n["status"],
                        "type": n["type"],
                        "timestamp": str(n["timestamp"])
                    }
                    for n in notifications
                ]
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(5)  # Stream updates every 5 seconds
    except Exception as e:
        print(f"WebSocket Disconnected (Notifications): {e}")
    finally:
        websocket_connections["notifications"].remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
