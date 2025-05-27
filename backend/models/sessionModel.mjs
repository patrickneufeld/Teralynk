// File Path: backend/models/sessionModel.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    fileId: { type: String, required: true },
    participants: [{ type: String }], // List of participant user IDs
    updates: [{ type: mongoose.Schema.Types.Mixed }], // Stores session updates
    createdAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
