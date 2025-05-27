// File: /src/api/s3Storage.js
import apiClient from './apiClient';
import logger from '../utils/logging';

/**
 * Get a list of available S3 buckets
 * @returns {Promise<Array>} List of S3 buckets
 */
export const listS3Buckets = async () => {
  try {
    const response = await apiClient.get('/api/storage/s3-buckets');
    return response.data.buckets || [];
  } catch (error) {
    logger.error('Failed to fetch S3 buckets', error);
    throw error;
  }
};

/**
 * List objects in an S3 bucket with optional prefix
 * @param {string} bucket - Bucket name
 * @param {string} prefix - Folder prefix (optional)
 * @returns {Promise<Array>} List of objects in the bucket
 */
export const listS3Objects = async (bucket, prefix = '') => {
  try {
    const response = await apiClient.get(`/api/storage/list-objects`, {
      params: { bucket, prefix }
    });
    return response.data.objects || [];
  } catch (error) {
    logger.error('Failed to list S3 objects', error);
    throw error;
  }
};

/**
 * Check if a file exists in S3
 * @param {string} bucket - Bucket name
 * @param {string} key - Object key
 * @returns {Promise<boolean>} Whether the file exists
 */
export const checkS3FileExists = async (bucket, key) => {
  try {
    const response = await apiClient.get(`/api/storage/check-file`, {
      params: { bucket, key }
    });
    return response.data.exists;
  } catch (error) {
    logger.error('Failed to check if S3 file exists', error);
    return false;
  }
};

/**
 * Upload a file to S3
 * @param {File} file - File to upload
 * @param {string} bucket - Bucket name
 * @param {string} folder - Folder prefix (optional)
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload result
 */
export const uploadToS3 = async (file, bucket, folder = '', onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (folder) formData.append('folder', folder);

    const config = {};
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }

    const response = await apiClient.post('/api/storage/upload', formData, config);
    return response.data;
  } catch (error) {
    logger.error('Failed to upload file to S3', error);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param {string} bucket - Bucket name
 * @param {string} key - Object key
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromS3 = async (bucket, key) => {
  try {
    const response = await apiClient.delete(`/api/storage/delete`, {
      params: { bucket, key }
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to delete file from S3', error);
    throw error;
  }
};

/**
 * Generate a presigned URL for an S3 object
 * @param {string} bucket - Bucket name
 * @param {string} key - Object key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Presigned URL
 */
export const getPresignedUrl = async (bucket, key, expiresIn = 3600) => {
  try {
    const response = await apiClient.get(`/api/storage/presigned-url`, {
      params: { bucket, key, expiresIn }
    });
    return response.data.url;
  } catch (error) {
    logger.error('Failed to generate presigned URL', error);
    throw error;
  }
};

/**
 * Get storage usage statistics
 * @param {string} bucket - Bucket name (optional)
 * @returns {Promise<Object>} Storage usage statistics
 */
export const getS3StorageUsage = async (bucket = null) => {
  try {
    const params = bucket ? { bucket } : {};
    const response = await apiClient.get('/api/storage/usage', { params });
    return response.data;
  } catch (error) {
    logger.error('Failed to get S3 storage usage', error);
    throw error;
  }
};

export default {
  listS3Buckets,
  listS3Objects,
  checkS3FileExists,
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  getS3StorageUsage
};
