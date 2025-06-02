//Users/patrick/Projects/Teralynk/frontend/src/api/s3Api.js
import axios from "axios";

// Use browser-safe environment variable access
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * API client for S3 operations.
 */
const s3Api = {
  /**
   * List all S3 buckets.
   * @returns {Promise<Array>} List of buckets
   */
  listBuckets: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/storage/s3-buckets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Token authorization
        },
      });
      return response.data?.buckets || [];
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "listBuckets" });
      console.error("Error listing buckets:", error);
      throw new Error("Failed to fetch S3 buckets. Please try again later.");
    }
  },

  /**
   * List objects in an S3 bucket with optional prefix.
   * @param {string} bucket - Bucket name
   * @param {string} prefix - Folder path
   * @returns {Promise<Object>} Objects
   */
  listObjects: async (bucket, prefix = "") => {
    if (!bucket) throw new Error("Bucket name is required");
    try {
      const response = await axios.get(`${API_BASE_URL}/storage/list-objects`, {
        params: { bucket, prefix },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data?.objects || [];
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "listObjects", bucket, prefix });
      console.error("Error listing objects:", error);
      throw new Error("Failed to fetch S3 objects. Please try again later.");
    }
  },

  /**
   * Check if a file exists in an S3 bucket.
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @returns {Promise<boolean>} File existence status
   */
  checkFileExists: async (bucket, key) => {
    if (!bucket || !key) throw new Error("Bucket name and key are required");
    try {
      const response = await axios.get(`${API_BASE_URL}/storage/check-file`, {
        params: { bucket, key },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data?.exists || false;
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "checkFileExists", bucket, key });
      console.error("Error checking file existence:", error);
      throw new Error("Failed to check if file exists. Please try again later.");
    }
  },

  /**
   * Upload a file to S3.
   * @param {File} file - File to upload
   * @param {string} bucket - Bucket name
   * @param {string} folder - Folder path
   * @param {Function} onProgress - Upload progress callback
   * @returns {Promise<Object>} Upload result
   */
  uploadFile: async (file, bucket, folder = "", onProgress = null) => {
    if (!file || !bucket) throw new Error("File and bucket name are required");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    if (folder) formData.append("folder", folder);

    try {
      const response = await axios.post(`${API_BASE_URL}/storage/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        onUploadProgress: onProgress
          ? (event) => {
              const percent = Math.round((event.loaded * 100) / event.total);
              onProgress(percent);
            }
          : undefined,
      });
      return response.data;
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "uploadFile", bucket, fileName: file.name });
      console.error("Error uploading file:", error);
      throw new Error("Failed to upload file. Please try again later.");
    }
  },

  /**
   * Delete a file from S3.
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   */
  deleteFile: async (bucket, key) => {
    if (!bucket || !key) throw new Error("Bucket and key are required");
    try {
      const response = await axios.delete(`${API_BASE_URL}/storage/delete`, {
        params: { bucket, key },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "deleteFile", bucket, key });
      console.error("Error deleting file:", error);
      throw new Error("Failed to delete file. Please try again later.");
    }
  },

  /**
   * Get a presigned URL for an object.
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {Promise<string>} Presigned URL
   */
  getPresignedUrl: async (bucket, key, expiresIn = 3600) => {
    if (!bucket || !key) throw new Error("Bucket and key are required");
    try {
      const response = await axios.get(`${API_BASE_URL}/storage/presigned-url`, {
        params: { bucket, key, expiresIn },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data?.url || "";
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "getPresignedUrl", bucket, key });
      console.error("Error getting presigned URL:", error);
      throw new Error("Failed to generate presigned URL. Please try again later.");
    }
  },

  /**
   * Get storage usage statistics.
   * @param {string|null} bucket - Bucket name (optional)
   * @returns {Promise<Object>} Storage usage data
   */
  getStorageUsage: async (bucket = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/storage/usage`, {
        params: bucket ? { bucket } : {},
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data || {};
    } catch (error) {
      // Enhanced error logging
      await logError(error, "S3 API Error", { action: "getStorageUsage", bucket });
      console.error("Error getting storage usage:", error);
      throw new Error("Failed to fetch storage usage. Please try again later.");
    }
  },
};

export default s3Api;
