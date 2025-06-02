// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/utils/dateUtils.js

/**
 * ✅ Get Current Timestamp (formatted for logging)
 * @returns {string} - Current timestamp in ISO format
 */
export const getCurrentTimestamp = () => {
    return new Date().toISOString(); // Format the date as ISO string
};
