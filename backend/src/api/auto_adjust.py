# /Users/patrick/Projects/Teralynk/backend/src/api/auto_adjust.py

from pymongo import MongoClient
import numpy as np
import datetime

# MongoDB Connection
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
performance_logs = db["ai_performance_logs"]
suggestions_collection = db["ai_suggestions"]
adjustments_collection = db["ai_adjustments"]

def analyze_and_adjust_ai():
    """
    Analyze AI performance trends and auto-adjust settings if necessary.
    """
    logs = list(performance_logs.find().sort("timestamp", -1).limit(50))

    if len(logs) < 10:
        return "Not enough data to auto-adjust AI."

    mse_values = np.array([log["mse"] for log in logs])
    mae_values = np.array([log["mae"] for log in logs])
    
    mse_trend = np.polyfit(range(len(mse_values)), mse_values, 1)[0]
    mae_trend = np.polyfit(range(len(mae_values)), mae_values, 1)[0]

    adjustment = "No adjustments needed."
    
    if mse_trend > 0.01 or mae_trend > 0.01:
        adjustment = "Reducing AI learning rate to improve accuracy."
        # Apply adjustment logic here

    adjustment_entry = {
        "timestamp": datetime.datetime.utcnow(),
        "adjustment": adjustment
    }
    adjustments_collection.insert_one(adjustment_entry)

    return adjustment

if __name__ == "__main__":
    print("AI Auto-Adjustment:", analyze_and_adjust_ai())
