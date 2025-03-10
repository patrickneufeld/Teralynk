const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

/**
 * ✅ Fetch All Available Platforms
 * @returns {Promise<Array>} - List of platforms
 */
export const fetchPlatforms = async () => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms`);
    if (!response.ok) {
      throw new Error("Failed to fetch platforms");
    }
    const data = await response.json();
    return data.platforms || [];
  } catch (error) {
    console.error("❌ Error fetching platforms:", error);
    return [];
  }
};

/**
 * ✅ Add a New Platform
 * @param {object} platform - The platform details to add
 * @param {string} platform.name - Name of the platform
 * @param {string} platform.authUrl - Authorization URL of the platform
 * @param {string} platform.tokenUrl - Token URL of the platform
 * @param {string} platform.defaultRedirectUri - Default Redirect URI for the platform
 * @returns {Promise<object|null>} - The added platform or null if failed
 */
export const addPlatform = async (platform) => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(platform),
    });

    if (!response.ok) {
      throw new Error("Failed to add platform");
    }

    const data = await response.json();
    return data.platform || null;
  } catch (error) {
    console.error("❌ Error adding platform:", error);
    return null;
  }
};

/**
 * ✅ Delete a Platform
 * @param {string} platformId - The ID of the platform to delete
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const deletePlatform = async (platformId) => {
  try {
    const response = await fetch(`${API_URL}/oauth/platforms/${platformId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete platform");
    }

    return true;
  } catch (error) {
    console.error("❌ Error deleting platform:", error);
    return false;
  }
};
