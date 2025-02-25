# /Users/patrick/Projects/Teralynk/backend/src/ai/unsupervised_ai.py

import numpy as np
import datetime
import openai
from pymongo import MongoClient
from sklearn.cluster import KMeans
from sklearn.metrics import mean_squared_error, mean_absolute_error
import random
import os

class UnsupervisedAI:
    def __init__(self, mongo_uri="mongodb://localhost:27017/", db_name="teralynk_ai"):
        """
        Initialize Unsupervised AI with MongoDB and API access for ChatGPT queries.
        """
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db["ai_performance_logs"]
        self.user_profiles = self.db["user_profiles"]
        self.global_optimizations = self.db["global_optimizations"]
        self.chatgpt_queries = self.db["chatgpt_queries"]
        self.mse_history = []
        self.mae_history = []
        self.code_version = "1.0"

        # Set OpenAI API Key (Replace with secure retrieval method)
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def evaluate_predictions(self, user_id, y_true, y_pred):
        """
        Compute AI error metrics (MSE, MAE) and log to database.
        """
        if not y_true or not y_pred or len(y_true) != len(y_pred):
            raise ValueError("Invalid input: y_true and y_pred must have the same non-empty length")

        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        self.mse_history.append(mse)
        self.mae_history.append(mae)

        log_entry = {
            "user_id": user_id,
            "timestamp": datetime.datetime.utcnow(),
            "mse": mse,
            "mae": mae,
            "code_version": self.code_version
        }
        self.collection.insert_one(log_entry)
        print(f"📊 AI Performance Logged: {log_entry}")

        self.analyze_user_behavior(user_id)
        self.self_optimize_code(user_id)

        return mse, mae

    def analyze_user_behavior(self, user_id):
        """
        Perform unsupervised clustering to detect behavior patterns.
        """
        user_logs = list(self.collection.find({"user_id": user_id}))
        if len(user_logs) < 5:
            return  # Not enough data for clustering

        errors = np.array([[log["mse"], log["mae"]] for log in user_logs])
        kmeans = KMeans(n_clusters=3, random_state=42).fit(errors)
        cluster_label = kmeans.predict([[errors[-1][0], errors[-1][1]]])[0]

        self.user_profiles.update_one(
            {"user_id": user_id},
            {"$set": {"behavior_cluster": cluster_label}},
            upsert=True
        )
        print(f"🔍 User {user_id} categorized in cluster {cluster_label}")

    def self_optimize_code(self, user_id):
        """
        AI dynamically generates and updates its own code for user-specific optimization.
        """
        recent_logs = list(self.collection.find({"user_id": user_id}).sort("timestamp", -1).limit(10))
        mse_values = [log["mse"] for log in recent_logs if "mse" in log]

        if np.mean(mse_values) > 0.05:
            print("🚨 High AI error detected! Generating optimized AI code...")

            new_code = self.generate_optimized_code()
            if self.apply_code_update(new_code):
                print(f"✅ AI successfully optimized its own code for user {user_id}!")

    def generate_optimized_code(self):
        """
        AI generates a self-optimized version of its code.
        """
        base_code = """
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import mean_squared_error, mean_absolute_error

class UnsupervisedAI:
    def __init__(self):
        self.mse_history = []
        self.mae_history = []

    def evaluate_predictions(self, y_true, y_pred):
        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        self.mse_history.append(mse)
        self.mae_history.append(mae)
        return mse, mae
"""
        optimizations = [
            'from sklearn.preprocessing import MinMaxScaler',
            'np.seterr(all="ignore")',  # Ignore warnings for better performance
            'from scipy.optimize import minimize'
        ]

        new_code = base_code + "\n" + random.choice(optimizations)
        return new_code

    def apply_code_update(self, new_code):
        """
        Apply AI-generated code updates.
        """
        try:
            with open(__file__, "w") as file:
                file.write(new_code)
            self.code_version = str(float(self.code_version) + 0.1)
            return True
        except Exception as e:
            print(f"❌ AI Code Update Failed: {e}")
            return False

    def evaluate_global_optimizations(self):
        """
        Check if a global optimization is necessary.
        If costs or fundamental app changes are detected, request approval.
        """
        recent_logs = list(self.collection.find().sort("timestamp", -1).limit(10))
        mse_values = [log["mse"] for log in recent_logs if "mse" in log]

        if np.mean(mse_values) > 0.05:
            print("🚨 Evaluating Global AI Optimization...")

            query = "How can I improve my AI model that predicts file relevance based on user interaction? The model currently has high MSE."
            suggested_update = self.query_chatgpt(query)

            if self.requires_approval(suggested_update):
                self.global_optimizations.insert_one({
                    "timestamp": datetime.datetime.utcnow(),
                    "suggested_update": suggested_update,
                    "status": "Pending Approval"
                })
                print("🛑 Approval required for global AI update.")
                self.notify_admins(suggested_update)
            else:
                print("✅ Automatically applying global optimization.")
                self.apply_code_update(suggested_update)
                self.notify_admins(suggested_update, approved=True)

    def requires_approval(self, update):
        """
        Determine if an AI-generated update requires approval based on its impact.
        """
        flagged_keywords = ["increase cost", "change database", "modify core logic"]
        return any(keyword in update.lower() for keyword in flagged_keywords)

    def query_chatgpt(self, query):
        """
        AI asks ChatGPT for suggestions on self-improvement and logs queries.
        """
        try:
            openai.api_key = self.openai_api_key
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": query}]
            )
            suggestion = response["choices"][0]["message"]["content"]

            log_entry = {
                "timestamp": datetime.datetime.utcnow(),
                "query": query,
                "response": suggestion
            }
            self.chatgpt_queries.insert_one(log_entry)
            print(f"🤖 ChatGPT Suggestion Logged: {log_entry}")

            return suggestion
        except Exception as e:
            print(f"❌ ChatGPT Query Failed: {e}")
            return "No suggestion available."

    def notify_admins(self, update, approved=False):
        """
        Notify admins of upcoming global optimizations and their impact.
        """
        status = "Approved & Applied" if approved else "Pending Approval"
        notification = {
            "timestamp": datetime.datetime.utcnow(),
            "status": status,
            "update_details": update
        }
        print(f"📢 Admin Notification: {notification}")
        self.global_optimizations.insert_one(notification)

# Example Usage
if __name__ == "__main__":
    ai = UnsupervisedAI()
    ai.evaluate_global_optimizations()
