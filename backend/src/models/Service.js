// ✅ FILE PATH: backend/src/models/Service.js

import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    platform: { type: String, required: true, unique: true },
    type: { type: String, enum: ["ai", "storage"], required: true },
    authOptions: [{ type: String }], // e.g., ["API Key", "Username & Password"]
});

module.exports = mongoose.model("Service", ServiceSchema);
