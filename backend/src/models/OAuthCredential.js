const mongoose = require("mongoose");

const OAuthCredentialSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Unique user identifier
  repository: { type: String, required: true }, // Repository name (e.g., Dropbox)
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  redirectUri: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date }, // Expiry time of the access token
});

module.exports = mongoose.model("OAuthCredential", OAuthCredentialSchema);
