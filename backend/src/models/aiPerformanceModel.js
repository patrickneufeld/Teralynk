// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/models/aiPerformanceModel.js

import mongoose from "mongoose";

const aiPerformanceSchema = new mongoose.Schema({
    modelId: { type: String, required: true }, // AI model's unique identifier
    mse: { type: Number, required: true }, // Mean Squared Error
    mae: { type: Number, required: true }, // Mean Absolute Error
    rse: { type: Number, required: true }, // Root Squared Error
    timestamp: { type: Date, required: true }, // Timestamp of the performance record
});

export const AIModelPerformance = mongoose.model("AIModelPerformance", aiPerformanceSchema);
