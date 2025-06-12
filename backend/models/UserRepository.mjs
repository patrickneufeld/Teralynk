// File Path: backend/src/models/UserRepository.js

const mongoose = require('mongoose');

const UserRepositorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Repository name
  authEndpoint: { type: String, required: true }, // OAuth endpoint
  clientId: { type: String, required: true }, // Client ID for OAuth
  clientSecret: { type: String, required: true }, // Client Secret for OAuth
  redirectUri: { type: String, required: true }, // Redirect URI for OAuth
  apiBaseUrl: { type: String, required: true }, // Base URL for API requests
});

module.exports = mongoose.model('UserRepository', UserRepositorySchema);
