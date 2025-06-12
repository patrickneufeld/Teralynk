# /Users/patrick/Projects/Teralynk/backend/src/dashboard/admin_dashboard.py

from flask import Flask, jsonify, request
from pymongo import MongoClient
import datetime

app = Flask(__name__)

# Connect to MongoDB
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
optimizations_collection = db["global_optimizations"]

@app.route("/admin/optimizations", methods=["GET"])
def get_pending_optimizations():
    """
    Retrieve pending AI optimizations that require approval.
    """
    pending_optimizations = list(optimizations_collection.find({"status": "Pending Approval"}))
    for opt in pending_optimizations:
        opt["_id"] = str(opt["_id"])  # Convert ObjectId to string for JSON response

    return jsonify({"pending_optimizations": pending_optimizations})

@app.route("/admin/optimizations/approve", methods=["POST"])
def approve_optimization():
    """
    Approve an AI optimization and apply changes.
    """
    data = request.json
    optimization_id = data.get("optimization_id")

    if not optimization_id:
        return jsonify({"error": "Missing optimization_id"}), 400

    optimization = optimizations_collection.find_one({"_id": optimization_id})
    if not optimization:
        return jsonify({"error": "Optimization not found"}), 404

    # Apply the AI-generated update
    apply_ai_update(optimization["suggested_update"])

    # Update the status to Approved & Applied
    optimizations_collection.update_one(
        {"_id": optimization["_id"]},
        {"$set": {"status": "Approved & Applied", "approved_at": datetime.datetime.utcnow()}}
    )

    return jsonify({"message": "Optimization approved and applied successfully!"})

def apply_ai_update(update_code):
    """
    Apply the AI-generated update.
    """
    try:
        with open("/Users/patrick/Projects/Teralynk/backend/src/ai/unsupervised_ai.py", "w") as file:
            file.write(update_code)
        print("✅ AI Optimization Successfully Applied!")
    except Exception as e:
        print(f"❌ AI Code Update Failed: {e}")

if __name__ == "__main__":
    app.run(port=5002, debug=True)
