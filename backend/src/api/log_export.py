# /Users/patrick/Projects/Teralynk/backend/src/api/log_export.py

from fastapi import FastAPI, Response
from pymongo import MongoClient
import csv
import io

app = FastAPI()

# MongoDB Connection
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
notifications_collection = db["ai_notifications"]

@app.get("/api/export_logs")
def export_logs():
    """
    Export AI logs as a CSV file.
    """
    logs = list(notifications_collection.find().sort("timestamp", -1))
    
    output = io.StringIO()
    csv_writer = csv.writer(output)
    csv_writer.writerow(["Timestamp", "Type", "Details", "Status"])
    
    for log in logs:
        csv_writer.writerow([
            log["timestamp"],
            log["type"],
            log["update_details"],
            log["status"]
        ])

    response = Response(output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=ai_logs.csv"
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
