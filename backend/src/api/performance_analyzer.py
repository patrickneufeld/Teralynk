# /Users/patrick/Projects/Teralynk/backend/src/api/performance_analyzer.py

from pymongo import MongoClient
import numpy as np
import datetime

# MongoDB Connection
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
performance_logs = db["ai_performance_logs"]
suggestions_collection = db["ai_suggestions"]

def analyze_performance_trends():
    """
    Analyze historical AI performance trends and suggest improvements.
    """
    logs = list(performance_logs.find().sort("timestamp", -1).limit(50))

    if len(logs) < 10:
        return "Not enough data to generate AI suggestions."

    mse_values = np.array([log["mse"] for log in logs])
    mae_values = np.array([log["mae"] for log in logs])
    
    mse_trend = np.polyfit(range(len(mse_values)), mse_values, 1)[0]
    mae_trend = np.polyfit(range(len(mae_values)), mae_values, 1)[0]

    suggestion = "AI performance is stable. No major adjustments needed."
    
    if mse_trend > 0.01 or mae_trend > 0.01:
        suggestion = "Performance degradation detected. Recommend fine-tuning AI model weights."
    elif mse_trend < -0.01 or mae_trend < -0.01:
        suggestion = "Performance improving. Monitor for potential overfitting."
    
    suggestion_entry = {
        "timestamp": datetime.datetime.utcnow(),
        "suggestion": suggestion
    }
    suggestions_collection.insert_one(suggestion_entry)
    return suggestion

if __name__ == "__main__":
    print("AI Performance Suggestion:", analyze_performance_trends())
