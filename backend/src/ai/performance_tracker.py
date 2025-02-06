# /Users/patrick/Projects/Teralynk/backend/src/ai/performance_tracker.py

import numpy as np
from pymongo import MongoClient
import datetime
from sklearn.metrics import mean_squared_error, mean_absolute_error

class AIPerformanceTracker:
    def __init__(self, mongo_uri="mongodb://localhost:27017/", db_name="teralynk_ai"):
        """
        Initialize AI performance tracker with MongoDB connection.
        """
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db["ai_performance_logs"]
        self.mse_history = []
        self.mae_history = []
        self.rse_history = []

    def evaluate_predictions(self, y_true, y_pred):
        """
        Evaluate AI predictions using MSE, MAE, and RSE.
        :param y_true: Actual user selections (list of floats or integers)
        :param y_pred: AI-predicted values (list of floats or integers)
        :return: MSE, MAE, RSE
        """
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
        """
        Store AI performance logs in MongoDB.
        """
        log_entry = {
            "timestamp": datetime.datetime.utcnow(),
            "mse": mse,
            "mae": mae,
            "rse": rse
        }
        self.collection.insert_one(log_entry)
        print(f"📊 AI Performance Logged: {log_entry}")

    def get_average_errors(self):
        """
        Retrieve the rolling average of error metrics.
        """
        return {
            "avg_mse": np.mean(self.mse_history) if self.mse_history else 0,
            "avg_mae": np.mean(self.mae_history) if self.mae_history else 0,
            "avg_rse": np.mean(self.rse_history) if self.rse_history else 0,
        }

    def check_performance_threshold(self, threshold=0.05):
        """
        Check AI performance trends and trigger retraining if errors are too high.
        """
        recent_logs = list(self.collection.find().sort("timestamp", -1).limit(10))
        errors = [log["mse"] for log in recent_logs if "mse" in log]

        if errors and np.mean(errors) > threshold:
            print("🚨 High AI error detected! Triggering AI model retraining...")
            self.retrain_ai_model()

    def retrain_ai_model(self):
        """
        Placeholder for AI model retraining logic.
        """
        print("🔄 AI Model Retraining Started... (Updating weights, learning from past errors, etc.)")
        # Future implementation: Fetch user behavior data, fine-tune AI weights, retrain model.

# Example Usage
if __name__ == "__main__":
    ai_tracker = AIPerformanceTracker()

    # Example: AI File Search - AI predicts relevance scores for files
    y_true = [1.0, 0.9, 0.8, 0.2, 0.1]  # Actual selections
    y_pred = [0.95, 0.85, 0.75, 0.4, 0.3]  # AI's predicted relevance

    mse, mae, rse = ai_tracker.evaluate_predictions(y_true, y_pred)
    print(f"MSE: {mse:.4f}, MAE: {mae:.4f}, RSE: {rse:.4f}")

    # Check if AI retraining is needed
    ai_tracker.check_performance_threshold()
