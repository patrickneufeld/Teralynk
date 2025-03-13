// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/utils/platformService.js

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

/**
 * ✅ Fetch All Available Platforms
 * @returns {Promise<Array>} - List of platforms
 */
export const fetchPlatforms = async () => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms`);
    if (!response.ok) throw new Error("Failed to fetch platforms");
    const data = await response.json();
    return data.platforms || [];
  } catch (error) {
    console.error("❌ Error fetching platforms:", error);
    return [];
  }
};

/**
 * ✅ Add a New Platform
 * @param {object} platform - The platform details
 * @returns {Promise<object|null>} - Newly created platform or null
 */
export const addPlatform = async (platform) => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(platform),
    });
    if (!response.ok) throw new Error("Failed to add platform");
    const data = await response.json();
    return data.platform || null;
  } catch (error) {
    console.error("❌ Error adding platform:", error);
    return null;
  }
};

/**
 * ✅ Delete a Platform
 * @param {string} platformId
 * @returns {Promise<boolean>}
 */
export const deletePlatform = async (platformId) => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms/${platformId}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("❌ Error deleting platform:", error);
    return false;
  }
};

/**
 * ✅ Update an Existing Platform
 * @param {string} platformId
 * @param {object} updatedData
 * @returns {Promise<object|null>}
 */
export const updatePlatform = async (platformId, updatedData) => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms/${platformId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error("Failed to update platform");
    const data = await response.json();
    return data.platform || null;
  } catch (error) {
    console.error("❌ Error updating platform:", error);
    return null;
  }
};

/**
 * ✅ Toggle Platform Status (enable/disable for new credentials)
 * @param {string} platformId
 * @param {boolean} enabled
 * @returns {Promise<boolean>}
 */
export const togglePlatformStatus = async (platformId, enabled) => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms/${platformId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    return response.ok;
  } catch (error) {
    console.error("❌ Error toggling platform status:", error);
    return false;
  }
};

/**
 * ✅ Validate OAuth Redirect URI and Credentials
 * @param {object} credentials
 * @returns {Promise<object|null>} - Validation result or null
 */
export const validatePlatformCredentials = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/oauth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error("OAuth validation failed");
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error("❌ Credential validation error:", error);
    return null;
  }
};
