# /Users/patrick/Projects/Teralynk/backend/src/dashboard/performance_dashboard.py

import matplotlib.pyplot as plt
import numpy as np
from pymongo import MongoClient
import datetime

# Connect to MongoDB
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
performance_logs = db["ai_performance_logs"]

def fetch_ai_performance_data():
    """
    Retrieve AI performance logs from MongoDB.
    """
    logs = list(performance_logs.find().sort("timestamp", -1).limit(100))
    timestamps = [log["timestamp"] for log in logs]
    mse_values = [log["mse"] for log in logs]
    mae_values = [log["mae"] for log in logs]
    return timestamps, mse_values, mae_values

def plot_ai_performance():
    """
    Generate a visualization of AI performance trends.
    """
    timestamps, mse_values, mae_values = fetch_ai_performance_data()

    plt.figure(figsize=(10, 5))
    plt.plot(timestamps, mse_values, label="MSE", marker="o")
    plt.plot(timestamps, mae_values, label="MAE", marker="s")
    plt.xlabel("Timestamp")
    plt.ylabel("Error Value")
    plt.title("AI Performance Over Time")
    plt.legend()
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    plot_ai_performance()
