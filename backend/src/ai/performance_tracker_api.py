from fastapi import FastAPI, HTTPException
import numpy as np
import datetime
import json
import os
from pymongo import MongoClient
from sklearn.metrics import mean_squared_error, mean_absolute_error

app = FastAPI()

class AIPerformanceTracker:
    def __init__(self, mongo_uri="mongodb://localhost:27017/", db_name="teralynk_ai"):
        """Initialize AI performance tracker with MongoDB connection."""
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db["ai_performance_logs"]
        self.mse_history = []
        self.mae_history = []
        self.rse_history = []
        self.rollback_path = "/Users/patrick/Projects/Teralynk/backend/src/ai/ai_model_state.json"

    def evaluate_predictions(self, y_true, y_pred):
        """Evaluate AI predictions using MSE, MAE, and RSE."""
        if not y_true or not y_pred or len(y_true) != len(y_pred):
            raise ValueError("Invalid input: y_true and y_pred must have the same non-empty length")

        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        n = len(y_true)
        p = 1  # One predictor variable
        rse = np.sqrt(mse * n / (n - p)) if n > 1 else 0  # Avoid division by zero

        self.mse_history.append(mse)
        self.mae_history.append(mae)
        self.rse_history.append(rse)

        # Log performance metrics in MongoDB
        self.log_performance(mse, mae, rse)

        return mse, mae, rse

    def log_performance(self, mse, mae, rse):
        """Store AI performance logs in MongoDB."""
        log_entry = {
            "timestamp": datetime.datetime.utcnow(),
            "mse": mse,
            "mae": mae,
            "rse": rse
        }
        self.collection.insert_one(log_entry)
        return log_entry

ai_tracker = AIPerformanceTracker()

@app.post("/evaluate")
def evaluate_performance(data: dict):
    """API Endpoint: Evaluate AI predictions"""
    try:
        y_true = data.get("y_true", [])
        y_pred = data.get("y_pred", [])
        mse, mae, rse = ai_tracker.evaluate_predictions(y_true, y_pred)
        return {"mse": mse, "mae": mae, "rse": rse}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/average-errors")
def get_avg_errors():
    """API Endpoint: Get rolling average of errors"""
    return ai_tracker.get_average_errors()

@app.get("/")
def home():
    return {"message": "AI Performance Tracker API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
