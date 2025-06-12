// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/utils/credentialService.js

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

/**
 * 🔍 Fetch all user credentials
 */
export const fetchCredentials = async () => {
  try {
    const res = await fetch(`${API_URL}/api/credentials`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch credentials.");
    const data = await res.json();
    return data.credentials || [];
  } catch (err) {
    console.error("❌ fetchCredentials:", err);
    throw err;
  }
};

/**
 * 💾 Save new credential
 * @param {Object} payload
 */
export const saveCredential = async (payload) => {
  try {
    const res = await fetch(`${API_URL}/api/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save credential.");
    return await res.json();
  } catch (err) {
    console.error("❌ saveCredential:", err);
    throw err;
  }
};

/**
 * ✏️ Update credential by ID
 * @param {string} id
 * @param {Object} updates
 */
export const updateCredential = async (id, updates) => {
  try {
    const res = await fetch(`${API_URL}/api/credentials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update credential.");
    return await res.json();
  } catch (err) {
    console.error("❌ updateCredential:", err);
    throw err;
  }
};

/**
 * 🗑️ Delete credential by ID
 * @param {string} id
 */
export const deleteCredential = async (id) => {
  try {
    const res = await fetch(`${API_URL}/api/credentials/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete credential.");
    return true;
  } catch (err) {
    console.error("❌ deleteCredential:", err);
    throw err;
  }
};
