// ✅ FILE: /backend/src/config/aws.js

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

let s3ClientInstance = null;

/**
 * ✅ Initialize and return the singleton S3 client
 * @returns {S3Client}
 */
export const getS3Client = () => {
  if (!s3ClientInstance) {
    const region = process.env.AWS_REGION;
    if (!region) {
      console.error("❌ Missing AWS_REGION in environment");
      throw new Error("AWS region is not set");
    }

    s3ClientInstance = new S3Client({ region });
    console.info("✅ S3Client initialized");
  }
  return s3ClientInstance;
};

/**
 * ✅ Generate a pre-signed URL for downloading a file from S3
 * @param {string} bucket - The bucket name
 * @param {string} key - The object key (file path in S3)
 * @param {number} expiresIn - Expiry time in seconds (default: 3600)
 * @returns {Promise<string>} - The signed URL
 */
export const getPresignedUrl = async (bucket, key, expiresIn = 3600) => {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn });
};

// ✅ Export AWS S3 Commands for reuse in routes/services
export {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
};
