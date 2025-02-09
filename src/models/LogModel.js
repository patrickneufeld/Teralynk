// /Users/patrick/Projects/Teralynk/backend/src/models/LogModel.js

const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ["info", "warning", "error"], required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} } // Optional metadata for additional logging info
});

module.exports = mongoose.model("Log", LogSchema);
