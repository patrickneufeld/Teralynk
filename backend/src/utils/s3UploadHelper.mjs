// ✅ FILE PATH: /frontend/src/utils/s3UploadHelper.js

/**
 * Get a presigned S3 upload URL from the backend
 * @param {File} file - File object from input
 * @param {string} endpoint - Backend API endpoint to generate signed URL
 * @returns {Promise<{ uploadURL: string, key: string }>}
 */
export const getPresignedUploadUrl = async (file, endpoint = "/api/upload/profile-presigned-url") => {
    if (!file || !file.type || !file.name) {
      throw new Error("❌ Invalid file provided for presigned URL generation.");
    }
  
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size,
        }),
        credentials: "include",
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`❌ Failed to get presigned URL: ${response.status} - ${errorText}`);
      }
  
      const { uploadURL, key } = await response.json();
  
      if (!uploadURL || !key) {
        throw new Error("❌ Invalid response: missing uploadURL or key from backend.");
      }
  
      return { uploadURL, key };
    } catch (error) {
      console.error("🚨 Error fetching presigned URL:", error);
      throw error;
    }
  };
  
  /**
   * Upload a file directly to S3 using a presigned URL
   * @param {string} uploadURL - The presigned S3 URL
   * @param {File} file - The file to upload
   * @param {number} [maxRetries=3] - Max retry attempts on failure
   * @returns {Promise<void>}
   */
  export const uploadFileToS3 = async (uploadURL, file, maxRetries = 3) => {
    let attempt = 0;
  
    while (attempt < maxRetries) {
      try {
        const res = await fetch(uploadURL, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "x-amz-acl": "public-read",
          },
          body: file,
        });
  
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`❌ S3 upload failed: ${res.status} - ${errorText}`);
        }
  
        console.info(`✅ S3 upload successful for file: ${file.name}`);
        return;
      } catch (error) {
        attempt++;
        console.warn(`⚠️ Upload attempt ${attempt} failed. Retrying...`, error.message);
  
        if (attempt === maxRetries) {
          console.error("❌ Final attempt failed. Upload aborted.");
          throw error;
        }
  
        // Exponential backoff before retry
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
  };
  