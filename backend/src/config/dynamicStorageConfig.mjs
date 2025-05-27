// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/config/dynamicStorageConfig.js

import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';
import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Load dynamic storage providers
const storageConfigPath = "/Users/patrick/Projects/Teralynk/backend/storageProviders.json";
let storageProviders = {};

/**
 * Load storage provider configuration from a JSON file.
 */
const loadStorageProviders = () => {
  if (fs.existsSync(storageConfigPath)) {
    storageProviders = JSON.parse(fs.readFileSync(storageConfigPath, "utf-8"));
  } else {
    storageProviders = {
      s3: {
        client: new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }),
        bucket: process.env.BUCKET_NAME,
      },
      googleDrive: {
        client: google.drive({
          version: "v3",
          auth: new google.auth.OAuth2(
            process.env.GOOGLE_DRIVE_CLIENT_ID,
            process.env.GOOGLE_DRIVE_CLIENT_SECRET,
            process.env.GOOGLE_DRIVE_REDIRECT_URI
          ),
        }),
      },
      dropbox: {
        client: new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN }),
      },
    };

    fs.writeFileSync(storageConfigPath, JSON.stringify(storageProviders, null, 2));
  }
};

// Load storage providers on startup
loadStorageProviders();

/**
 * Get the storage client for a given provider.
 * @param {string} provider - The storage provider name.
 */
const getStorageClient = (provider) => {
  if (!storageProviders[provider]) {
    throw new Error(`❌ Invalid storage provider: ${provider}`);
  }
  return storageProviders[provider];
};

/**
 * Add a new storage provider dynamically.
 * @param {string} providerName - The name of the new provider.
 * @param {object} config - Configuration details for the provider.
 */
const addNewStorageProvider = (providerName, config) => {
  if (storageProviders[providerName]) {
    throw new Error(`❌ Storage provider '${providerName}' already exists.`);
  }

  storageProviders[providerName] = config;
  fs.writeFileSync(storageConfigPath, JSON.stringify(storageProviders, null, 2));

  console.log(`✅ Storage provider '${providerName}' added successfully.`);
};

/**
 * Remove a storage provider.
 * @param {string} providerName - The provider to remove.
 */
const removeStorageProvider = (providerName) => {
  if (!storageProviders[providerName]) {
    throw new Error(`❌ Storage provider '${providerName}' does not exist.`);
  }

  delete storageProviders[providerName];
  fs.writeFileSync(storageConfigPath, JSON.stringify(storageProviders, null, 2));

  console.log(`✅ Storage provider '${providerName}' removed successfully.`);
};

/**
 * Get a list of all available storage providers.
 */
const listAvailableStorageProviders = () => {
  return Object.keys(storageProviders);
};

// Export functions for use in other files
export { 
  getStorageClient, 
  addNewStorageProvider, 
  removeStorageProvider, 
  listAvailableStorageProviders 
};
