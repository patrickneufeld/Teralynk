// ✅ FILE: /frontend/src/utils/api-helpers.js

/**
 * 📦 Handles standard API response structure
 * @param {Object} response - Axios/fetch-style response object
 * @returns {any} - response.data.data if successful
 * @throws {Error} - with relevant error message
 */
export const handleApiResponse = (response) => {
    if (!response || typeof response !== "object") {
      throw new Error("Invalid API response.");
    }
  
    if (!response.data?.success) {
      const errorMessage =
        response.data?.error || response.data?.message || "API request failed.";
      throw new Error(errorMessage);
    }
  
    return response.data.data;
  };
  
  /**
   * 🛠️ Creates an Error instance from a failed API call
   * @param {any} error - Error from Axios or fetch
   * @returns {Error} - Custom error with detailed message
   */
  export const createApiError = (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown API error occurred.";
  
    console.error("❌ API Error:", message, error);
    return new Error(message);
  };
  