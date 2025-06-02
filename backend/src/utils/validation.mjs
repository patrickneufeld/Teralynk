// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/utils/validationMiddleware.js

import logger from "./bootstrapLogger.mjs"; // no db import

/**
 * ✅ Validates that all required environment variables are defined.
 * Defaults to checking for DB_CONNECTION_STRING instead of individual DB_* keys.
 * @param {string[]} requiredKeys - List of required environment variable keys
 * @throws {Error} - If any required environment variable is missing
 */
export const validateEnvironmentVariables = (requiredKeys = ["DB_CONNECTION_STRING"]) => {
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    logger.error(`❌ Missing required environment variables: ${missingKeys.join(", ")}`);
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }

  logger.info("✅ All required environment variables are set.");
};

/**
 * ✅ Validates request body fields for an API endpoint.
 * @param {Object} body - Request body object
 * @param {string[]} requiredFields - List of required fields in the request body
 * @returns {Object} - Contains `isValid` boolean and `missingFields` array
 */
export const validateRequestBody = (body, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    logger.warn(`⚠️ Missing required fields in request body: ${missingFields.join(", ")}`);
    return {
      isValid: false,
      missingFields,
    };
  }

  logger.info("✅ Request body validation passed.");
  return {
    isValid: true,
    missingFields: [],
  };
};

/**
 * ✅ Validates file-related input for S3 uploads.
 * @param {Object} file - File object containing file type and other attributes
 * @param {string[]} allowedFileTypes - Array of allowed MIME types
 * @returns {boolean} - Returns true if the file is valid, otherwise throws an error
 * @throws {Error} - If the file is invalid or missing
 */
export const validateFile = (file, allowedFileTypes) => {
  if (!file) {
    logger.error("❌ File validation failed: No file provided.");
    throw new Error("File is required but was not provided.");
  }

  if (!allowedFileTypes.includes(file.mimetype)) {
    logger.error(`❌ Invalid file type: ${file.mimetype}. Allowed types: ${allowedFileTypes.join(", ")}`);
    throw new Error(`Invalid file type. Allowed types are: ${allowedFileTypes.join(", ")}`);
  }

  logger.info(`✅ File validation passed for type: ${file.mimetype}`);
  return true;
};

/**
 * ✅ Validates that all required query parameters are present.
 * @param {Object} query - Query object from the request
 * @param {string[]} requiredQueryParams - List of required query parameters
 * @returns {Object} - Contains `isValid` boolean and `missingParams` array
 */
export const validateQueryParams = (query, requiredQueryParams) => {
  const missingParams = requiredQueryParams.filter((param) => !query[param]);

  if (missingParams.length > 0) {
    logger.warn(`⚠️ Missing required query parameters: ${missingParams.join(", ")}`);
    return {
      isValid: false,
      missingParams,
    };
  }

  logger.info("✅ Query parameter validation passed.");
  return {
    isValid: true,
    missingParams: [],
  };
};

/**
 * ✅ Utility to handle validation results for express routes.
 * @param {Object} validationResult - Validation result object containing `isValid` and `missingFields`
 * @param {Object} res - Express response object
 * @returns {boolean} - Returns false and sends a response if validation fails
 */
export const handleValidationResult = (validationResult, res) => {
  if (!validationResult.isValid) {
    logger.error("❌ Validation failed.", {
      missingFields: validationResult.missingFields,
    });

    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: `Missing fields: ${validationResult.missingFields.join(", ")}`,
    });
    return false;
  }

  logger.info("✅ Validation passed.");
  return true;
};
