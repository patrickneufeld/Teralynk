# File: /Users/patrick/Projects/Teralynk/backend/src/ai/performance_tracker.py

import numpy as np
import datetime
import json
import os
from pymongo import MongoClient
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
        self.rollback_path = "/Users/patrick/Projects/Teralynk/backend/src/ai/ai_model_state.json"

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
        Check AI performance trends and trigger retraining if errors exceed threshold.
        """
        recent_logs = list(self.collection.find().sort("timestamp", -1).limit(10))
        errors = [log["mse"] for log in recent_logs if "mse" in log]

        if errors and np.mean(errors) > threshold:
            print("🚨 High AI error detected! Adjusting AI parameters & retraining...")
            self.optimize_ai_model()

    def optimize_ai_model(self):
        """
        Adjust AI parameters dynamically and retrain if necessary.
        """
        # Save the current AI state for rollback if needed
        self.save_ai_state()

        # Simulate optimization logic (could include learning rate tuning, weight updates, etc.)
        print("🔄 AI Model Optimization: Adjusting weights & learning patterns...")
        new_settings = {
            "learning_rate": 0.01,  # Example adjustment
            "error_threshold": 0.05
        }

        # Simulating an optimization update
        if np.random.rand() > 0.2:  # 80% chance optimization is successful
            print(f"✅ AI Model Updated Successfully: {new_settings}")
            self.store_ai_settings(new_settings)
        else:
            print("❌ AI Optimization Failed! Reverting to previous state...")
            self.restore_previous_state()

    def save_ai_state(self):
        """
        Save the AI's state before making changes to allow rollback.
        """
        ai_state = {
            "mse_history": self.mse_history,
            "mae_history": self.mae_history,
            "rse_history": self.rse_history
        }
        with open(self.rollback_path, "w") as f:
            json.dump(ai_state, f)
        print("💾 AI State Saved for Rollback.")

    def restore_previous_state(self):
        """
        Revert AI model to the last working state if an optimization fails.
        """
        if os.path.exists(self.rollback_path):
            with open(self.rollback_path, "r") as f:
                ai_state = json.load(f)
            self.mse_history = ai_state.get("mse_history", [])
            self.mae_history = ai_state.get("mae_history", [])
            self.rse_history = ai_state.get("rse_history", [])
            print("🔄 AI Model Reverted to Previous Stable State.")

    def store_ai_settings(self, settings):
        """
        Store updated AI model settings.
        """
        with open(self.rollback_path.replace("ai_model_state.json", "ai_settings.json"), "w") as f:
            json.dump(settings, f)
        print("⚙️ AI Settings Updated.")

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
