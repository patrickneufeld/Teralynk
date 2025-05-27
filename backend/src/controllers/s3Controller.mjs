// File: /src/controllers/s3Controller.js
import { 
  getS3Client, 
  getSignedUrlForS3, 
  deleteFileFromS3 
} from "../utils/s3.mjs";
import logger from "../utils/logger.mjs";
import { 
  ListBucketsCommand, 
  ListObjectsV2Command, 
  HeadObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";

/**
 * List all S3 buckets
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listS3Buckets = async (req, res) => {
  try {
    const s3Client = getS3Client();
    const command = new ListBucketsCommand({});
    const data = await s3Client.send(command);
    
    res.status(200).json({
      success: true,
      buckets: data.Buckets || []
    });
  } catch (error) {
    logger.error("Error listing S3 buckets", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to list S3 buckets"
    });
  }
};

/**
 * List objects in an S3 bucket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listS3Objects = async (req, res) => {
  try {
    const { bucket, prefix = "" } = req.query;
    
    if (!bucket) {
      return res.status(400).json({
        success: false,
        error: "Bucket parameter is required"
      });
    }
    
    const s3Client = getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/"
    });
    
    const data = await s3Client.send(command);
    
    // Process folders (CommonPrefixes)
    const folders = (data.CommonPrefixes || []).map(prefix => ({
      Key: prefix.Prefix,
      IsFolder: true
    }));
    
    // Process files (Contents)
    const files = (data.Contents || [])
      .filter(item => item.Key !== prefix) // Filter out the current prefix
      .map(item => ({
        Key: item.Key,
        Size: item.Size,
        LastModified: item.LastModified,
        IsFolder: false
      }));
    
    // Combine folders and files
    const objects = [...folders, ...files];
    
    res.status(200).json({
      success: true,
      prefix,
      objects
    });
  } catch (error) {
    logger.error("Error listing S3 objects", { 
      bucket: req.query.bucket,
      prefix: req.query.prefix,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: "Failed to list S3 objects"
    });
  }
};

/**
 * Check if a file exists in S3
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkS3FileExists = async (req, res) => {
  try {
    const { bucket, key } = req.query;
    
    if (!bucket || !key) {
      return res.status(400).json({
        success: false,
        error: "Bucket and key parameters are required"
      });
    }
    
    const s3Client = getS3Client();
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    try {
      await s3Client.send(command);
      res.status(200).json({
        success: true,
        exists: true
      });
    } catch (error) {
      if (error.name === "NotFound") {
        res.status(200).json({
          success: true,
          exists: false
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error("Error checking if file exists in S3", { 
      bucket: req.query.bucket,
      key: req.query.key,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: "Failed to check if file exists"
    });
  }
};

/**
 * Upload a file to S3
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadToS3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }
    
    const { bucket } = req.body;
    let { folder = "" } = req.body;
    
    if (!bucket) {
      return res.status(400).json({
        success: false,
        error: "Bucket parameter is required"
      });
    }
    
    // Ensure folder ends with a slash if it's not empty
    if (folder && !folder.endsWith("/")) {
      folder += "/";
    }
    
    // Generate S3 key
    const key = folder + req.file.originalname;
    
    // Upload file to S3
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        userId: req.user?.userId || "anonymous",
        originalName: req.file.originalname
      }
    });
    
    const result = await s3Client.send(command);
    
    res.status(200).json({
      success: true,
      key,
      bucket,
      etag: result.ETag
    });
  } catch (error) {
    logger.error("Error uploading file to S3", { 
      file: req.file?.originalname,
      bucket: req.body.bucket,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: "Failed to upload file"
    });
  }
};

/**
 * Delete a file from S3
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFromS3 = async (req, res) => {
  try {
    const { bucket, key } = req.query;
    
    if (!bucket || !key) {
      return res.status(400).json({
        success: false,
        error: "Bucket and key parameters are required"
      });
    }
    
    await deleteFileFromS3(bucket, key);
    
    res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    logger.error("Error deleting file from S3", { 
      bucket: req.query.bucket,
      key: req.query.key,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: "Failed to delete file"
    });
  }
};

/**
 * Get a presigned URL for an S3 object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getS3PresignedUrl = async (req, res) => {
  try {
    const { bucket, key, expiresIn = 3600 } = req.query;
    
    if (!bucket || !key) {
      return res.status(400).json({
        success: false,
        error: "Bucket and key parameters are required"
      });
    }
    
    const url = await getSignedUrlForS3(bucket, key, parseInt(expiresIn));
    
    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    logger.error("Error generating presigned URL", { 
      bucket: req.query.bucket,
      key: req.query.key,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: "Failed to generate presigned URL"
    });
  }
};

/**
 * Get storage usage statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getS3StorageUsage = async (req, res) => {
  try {
    const { bucket } = req.query;
    
    if (!bucket) {
      return res.status(400).json({
        success: false,
        error: "Bucket parameter is required"
      });
    }
    
    const s3Client = getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: bucket
    });
    
    const data = await s3Client.send(command);
    
    // Calculate total size
    const totalSize = (data.Contents || []).reduce((acc, obj) => acc + obj.Size, 0);
    const totalMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
    
    // Assume a quota of 5GB for demonstration purposes
    // In a real application, this would come from a user's plan or settings
    const quotaMB = 5 * 1024; // 5GB in MB
    const percentUsed = Math.round((totalMB / quotaMB) * 100);
    
    res.status(200).json({
      success: true,
      bucket,
      objectCount: data.KeyCount || 0,
      totalSize,
      totalMB,
      quotaMB,
      percentUsed
    });
  } catch (error) {
    logger.error("Error getting storage usage", { 
      bucket: req.query.bucket,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: "Failed to get storage usage"
    });
  }
};
