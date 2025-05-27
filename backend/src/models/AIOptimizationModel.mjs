// /Users/patrick/Projects/Teralynk/backend/src/models/AIOptimizationModel.js

import mongoose from "mongoose";

// Define the schema for AI optimization tracking
const AIOptimizationSchema = new mongoose.Schema({
    optimizationType: {
        type: String,
        required: true,
        enum: ["performance", "accuracy", "efficiency", "cost_reduction"],
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true, // Prevent modification after creation
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "applied"],
        default: "pending",
    },
    impact: {
        type: String,
        required: true,
        enum: ["low", "medium", "high"],
    },
    requestedByAI: {
        type: Boolean,
        default: true,
    },
    approvalRequired: {
        type: Boolean,
        default: function () {
            return this.impact === "high" || this.optimizationType === "cost_reduction";
        }, // Auto-set approvalRequired based on impact/type
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    approvedAt: {
        type: Date,
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
        trim: true,
    },
    logs: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String, required: true, trim: true },
        },
    ],
});

// Middleware hook to ensure approvalRequired is auto-calculated before saving
AIOptimizationSchema.pre("save", function (next) {
    if (this.impact === "high" || this.optimizationType === "cost_reduction") {
        this.approvalRequired = true;
    }
    next();
});

// Static method to fetch optimizations by status
AIOptimizationSchema.statics.findByStatus = function (status) {
    return this.find({ status });
};

// Instance method to log optimization history
AIOptimizationSchema.methods.addLog = function (message) {
    this.logs.push({ message });
    return this.save();
};

// Export the model
module.exports = mongoose.model("AIOptimization", AIOptimizationSchema);
