import mongoose from "mongoose";
const { mean, sqrt } = require("mathjs");

// MongoDB connection setup
const dbURI = process.env.DB_CONNECTION_STRING || "mongodb://localhost:27017/teralynk_ai";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const PerformanceLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  mse: Number,
  mae: Number,
  rse: Number,
});

const PerformanceLog = mongoose.model("PerformanceLog", PerformanceLogSchema);

class AIPerformanceTracker {
  constructor() {
    this.mseHistory = [];
    this.maeHistory = [];
    this.rseHistory = [];
  }

  /**
   * Evaluate AI predictions using MSE, MAE, and RSE.
   * @param {number[]} yTrue - Actual values.
   * @param {number[]} yPred - Predicted values.
   */
  async evaluatePredictions(yTrue, yPred) {
    if (!yTrue.length || !yPred.length || yTrue.length !== yPred.length) {
      throw new Error("Invalid input: yTrue and yPred must be non-empty and have the same length");
    }

    const mse = mean(yTrue.map((y, i) => Math.pow(y - yPred[i], 2)));
    const mae = mean(yTrue.map((y, i) => Math.abs(y - yPred[i])));
    const rse = yTrue.length > 1 ? sqrt((mse * yTrue.length) / (yTrue.length - 1)) : 0;

    this.mseHistory.push(mse);
    this.maeHistory.push(mae);
    this.rseHistory.push(rse);

    await this.logPerformance(mse, mae, rse);

    return { mse, mae, rse };
  }

  /**
   * Log AI performance metrics to MongoDB.
   */
  async logPerformance(mse, mae, rse) {
    const logEntry = new PerformanceLog({ mse, mae, rse });
    await logEntry.save();
    console.log(`📊 AI Performance Logged: MSE=${mse}, MAE=${mae}, RSE=${rse}`);
  }

  /**
   * Get average error metrics.
   */
  getAverageErrors() {
    return {
      avg_mse: this.mseHistory.length ? mean(this.mseHistory) : 0,
      avg_mae: this.maeHistory.length ? mean(this.maeHistory) : 0,
      avg_rse: this.rseHistory.length ? mean(this.rseHistory) : 0,
    };
  }

  /**
   * Check if AI performance exceeds a threshold and trigger retraining.
   */
  async checkPerformanceThreshold(threshold = 0.05) {
    const recentLogs = await PerformanceLog.find().sort({ timestamp: -1 }).limit(10);
    const errors = recentLogs.map(log => log.mse);

    if (errors.length && mean(errors) > threshold) {
      console.warn("🚨 High AI error detected! Triggering AI model retraining...");
      this.retrainAIModel();
    }
  }

  /**
   * Placeholder for AI model retraining logic.
   */
  retrainAIModel() {
    console.log("🔄 AI Model Retraining Started... (Updating weights, learning from past errors, etc.)");
    // Future implementation: Fetch user behavior data, fine-tune AI weights, retrain model.
  }
}

module.exports = new AIPerformanceTracker();
