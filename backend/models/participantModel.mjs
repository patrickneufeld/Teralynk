// File Path: backend/models/participantModel.js

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    role: { type: String, default: 'viewer' }, // Roles: viewer, editor, admin
    joinedAt: { type: Date, default: Date.now },
});

participantSchema.index({ sessionId: 1, userId: 1 }, { unique: true }); // Unique constraint

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;
