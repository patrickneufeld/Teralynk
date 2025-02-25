// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/config/storageConfig.js

require("dotenv").config();
const { S3Client } = require("@aws-sdk/client-s3");
const { google } = require("googleapis");
const Dropbox = require("dropbox").Dropbox;
const fetch = require("node-fetch");

// ✅ AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Google Drive Configuration with Token Refreshing
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });

const googleDriveClient = google.drive({ version: "v3", auth: oauth2Client });

/**
 * ✅ Refresh Google Drive Access Token (for long-running services)
 */
const refreshGoogleDriveToken = async () => {
  try {
    const { token } = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials({ access_token: token });
    console.log("✅ Google Drive token refreshed successfully.");
  } catch (error) {
    console.error("❌ Failed to refresh Google Drive token:", error.message);
  }
};

// ✅ Dropbox Configuration with Token Refreshing
const dropboxClient = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch,
});

/**
 * ✅ Refresh Dropbox Access Token
 */
const refreshDropboxToken = async () => {
  try {
    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
        grant_type: "refresh_token",
        client_id: process.env.DROPBOX_APP_KEY,
        client_secret: process.env.DROPBOX_APP_SECRET,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      dropboxClient.auth.setAccessToken(data.access_token);
      console.log("✅ Dropbox token refreshed successfully.");
    } else {
      console.error("❌ Dropbox token refresh failed:", data);
    }
  } catch (error) {
    console.error("❌ Failed to refresh Dropbox token:", error.message);
  }
};

// ✅ Unified Storage Configuration
const storageProviders = {
  s3: {
    client: s3Client,
    bucket: process.env.BUCKET_NAME,
  },
  googleDrive: {
    client: googleDriveClient,
    refreshToken: refreshGoogleDriveToken,
  },
  dropbox: {
    client: dropboxClient,
    refreshToken: refreshDropboxToken,
  },
};

/**
 * ✅ Get the active storage provider
 * @param {string} provider - Storage provider name ('s3', 'googleDrive', 'dropbox')
 */
const getStorageClient = (provider) => {
  if (!storageProviders[provider]) {
    throw new Error(`❌ Invalid storage provider: ${provider}`);
  }

  // Auto-refresh tokens for OAuth-based providers
  if (storageProviders[provider].refreshToken) {
    storageProviders[provider].refreshToken();
  }

  return storageProviders[provider];
};

/**
 * ✅ List all available storage providers
 */
const listAvailableStorageProviders = () => {
  return Object.keys(storageProviders);
};

/**
 * ✅ Check if a storage provider is available and operational
 * @param {string} provider - Storage provider name
 */
const checkStorageAvailability = async (provider) => {
  if (!storageProviders[provider]) {
    throw new Error(`❌ Invalid storage provider: ${provider}`);
  }

  try {
    if (provider === "s3") {
      await s3Client.send(new ListBucketsCommand({}));
    } else if (provider === "googleDrive") {
      await googleDriveClient.files.list({ pageSize: 1 });
    } else if (provider === "dropbox") {
      await dropboxClient.filesListFolder({ path: "" });
    }
    console.log(`✅ ${provider} is available.`);
    return true;
  } catch (error) {
    console.error(`❌ ${provider} is unavailable:`, error.message);
    return false;
  }
};

module.exports = {
  getStorageClient,
  listAvailableStorageProviders,
  checkStorageAvailability,
};
