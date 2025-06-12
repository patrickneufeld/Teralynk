// ✅ FILE PATH: backend/src/models/UserService.js

import mongoose from "mongoose";

const UserServiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platform: { type: String, required: true },
    authMethod: { type: String, enum: ["api", "login"], required: true },
    apiKey: { type: String },
    username: { type: String },
    password: { type: String },
    storageCapacity: { type: Number, default: 0 },
});

module.exports = mongoose.model("UserService", UserServiceSchema);
