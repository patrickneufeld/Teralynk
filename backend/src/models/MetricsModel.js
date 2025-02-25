// /Users/patrick/Projects/Teralynk/backend/src/models/MetricsModel.js

const mongoose = require('mongoose');

const MetricsSchema = new mongoose.Schema({
    metricName: { type: String, required: true },
    value: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Metrics', MetricsSchema);
