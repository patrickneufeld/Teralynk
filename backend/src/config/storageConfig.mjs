// File: /backend/src/config/storageConfig.mjs

import dotenv from 'dotenv';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import { logInfo, logError } from '../utils/logging/index.mjs';

dotenv.config();

// Storage provider limits and capabilities
const PROVIDER_LIMITS = {
  s3: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxConcurrentUploads: 100,
    supportedOperations: ['upload', 'download', 'delete', 'list', 'multipart']
  },
  googleDrive: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxConcurrentUploads: 50,
    supportedOperations: ['upload', 'download', 'delete', 'list', 'share']
  },
  dropbox: {
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxConcurrentUploads: 20,
    supportedOperations: ['upload', 'download', 'delete', 'list', 'share']
  }
};

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Initialize Google Drive Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
const googleDriveClient = google.drive({ version: 'v3', auth: oauth2Client });

// Initialize Dropbox Client
const dropboxClient = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch,
});

/**
 * Refresh Google Drive Access Token
 * @returns {Promise<void>}
 */
const refreshGoogleDriveToken = async () => {
  try {
    const { token } = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials({ access_token: token });
    logInfo("Google Drive token refreshed successfully");
  } catch (error) {
    logError("Failed to refresh Google Drive token", { error: error.message });
    throw error;
  }
};

/**
 * Refresh Dropbox Access Token
 * @returns {Promise<void>}
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
      logInfo("Dropbox token refreshed successfully");
    } else {
      throw new Error(data.error || 'Token refresh failed');
    }
  } catch (error) {
    logError("Failed to refresh Dropbox token", { error: error.message });
    throw error;
  }
};

// Unified Storage Configuration
const storageProviders = {
  s3: {
    client: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    type: 's3',
    limits: PROVIDER_LIMITS.s3,
    isAvailable: true
  },
  googleDrive: {
    client: googleDriveClient,
    refreshToken: refreshGoogleDriveToken,
    type: 'googleDrive',
    limits: PROVIDER_LIMITS.googleDrive,
    isAvailable: true
  },
  dropbox: {
    client: dropboxClient,
    refreshToken: refreshDropboxToken,
    type: 'dropbox',
    limits: PROVIDER_LIMITS.dropbox,
    isAvailable: true
  }
};

/**
 * Get storage provider client and configuration
 * @param {string} provider - Provider name ('s3', 'googleDrive', 'dropbox')
 * @returns {Object} Provider configuration and client
 * @throws {Error} If provider is invalid or unavailable
 */
export const getStorageClient = (provider) => {
  const providerConfig = storageProviders[provider];
  
  if (!providerConfig) {
    logError(`Invalid storage provider requested: ${provider}`);
    throw new Error(`Invalid storage provider: ${provider}`);
  }

  if (!providerConfig.isAvailable) {
    logError(`Storage provider ${provider} is currently unavailable`);
    throw new Error(`Storage provider ${provider} is unavailable`);
  }

  // Auto-refresh tokens for OAuth-based providers
  if (providerConfig.refreshToken) {
    providerConfig.refreshToken().catch(error => {
      logError(`Token refresh failed for ${provider}`, { error: error.message });
      providerConfig.isAvailable = false;
    });
  }

  return providerConfig;
};

/**
 * List all available storage providers
 * @returns {string[]} Array of available provider names
 */
export const listAvailableStorageProviders = () => {
  return Object.entries(storageProviders)
    .filter(([_, config]) => config.isAvailable)
    .map(([name]) => name);
};

/**
 * Check if a storage provider is available and operational
 * @param {string} provider - Provider name
 * @returns {Promise<boolean>} Provider availability status
 */
export const checkStorageAvailability = async (provider) => {
  const providerConfig = storageProviders[provider];
  
  if (!providerConfig) {
    logError(`Invalid storage provider: ${provider}`);
    throw new Error(`Invalid storage provider: ${provider}`);
  }

  try {
    switch (provider) {
      case 's3':
        await s3Client.send(new ListBucketsCommand({}));
        break;
      case 'googleDrive':
        await googleDriveClient.files.list({ pageSize: 1 });
        break;
      case 'dropbox':
        await dropboxClient.filesListFolder({ path: '' });
        break;
    }
    
    providerConfig.isAvailable = true;
    logInfo(`Storage provider ${provider} is available`);
    return true;
  } catch (error) {
    providerConfig.isAvailable = false;
    logError(`Storage provider ${provider} is unavailable`, { error: error.message });
    return false;
  }
};

/**
 * Get provider limits and capabilities
 * @param {string} provider - Provider name
 * @returns {Object} Provider limits and capabilities
 */
export const getProviderLimits = (provider) => {
  const providerConfig = storageProviders[provider];
  
  if (!providerConfig) {
    logError(`Invalid storage provider: ${provider}`);
    throw new Error(`Invalid storage provider: ${provider}`);
  }

  return providerConfig.limits;
};

// Export all functions
export default {
  getStorageClient,
  listAvailableStorageProviders,
  checkStorageAvailability,
  getProviderLimits,
  PROVIDER_LIMITS
};
