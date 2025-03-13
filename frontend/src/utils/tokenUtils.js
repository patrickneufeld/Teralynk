import CryptoJS from "crypto-js";

// 🔐 Key constants
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRY_KEY = "token_expiry";
const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || "sessionStorage"; // Make STORAGE_MODE configurable via env
const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || "super-secure-key";

/**
 * 🔐 Encrypt a token (AES)
 * @param {string} token - The token to encrypt
 * @returns {string|null} - The encrypted token, or null on failure
 */
const encryptToken = (token) => {
  try {
    return CryptoJS.AES.encrypt(token, ENCRYPTION_SECRET).toString();
  } catch (err) {
    console.error("🔴 Token encryption failed:", err);
    throw new Error("Encryption failed");
  }
};

/**
 * 🔓 Decrypt a token
 * @param {string} encryptedToken - The encrypted token to decrypt
 * @returns {string|null} - The decrypted token, or null on failure
 */
const decryptToken = (encryptedToken) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error("🔴 Token decryption failed:", err);
    throw new Error("Decryption failed");
  }
};

/**
 * ⚙️ Get storage engine
 * Uses sessionStorage or localStorage based on `STORAGE_MODE` constant
 */
const getStorage = () =>
  STORAGE_MODE === "sessionStorage" ? sessionStorage : localStorage;

/**
 * ✅ Set access token securely
 * @param {string} token - The token to store
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
 */
export const setToken = (token, expiresIn = 3600) => {
  const storage = getStorage();
  try {
    const encrypted = encryptToken(token);
    const expiry = Date.now() + expiresIn * 1000;
    storage.setItem(TOKEN_KEY, encrypted);
    storage.setItem(EXPIRY_KEY, expiry.toString());
    dispatchTokenUpdate(); // Notify other components about the token update
  } catch (err) {
    console.error("❌ Failed to store token:", err);
    throw new Error("Failed to store token");
  }
};

/**
 * 🔐 Get decrypted token if valid
 * @returns {string|null} - Decrypted token or null if invalid or expired
 */
export const getToken = () => {
  const storage = getStorage();
  try {
    const encrypted = storage.getItem(TOKEN_KEY);
    const expiry = parseInt(storage.getItem(EXPIRY_KEY), 10);

    if (!encrypted || isNaN(expiry)) return null;

    if (Date.now() > expiry) {
      removeToken();
      return null;
    }

    return decryptToken(encrypted);
  } catch (err) {
    console.error("❌ Failed to retrieve token:", err);
    throw new Error("Failed to retrieve token");
  }
};

/**
 * ⏳ Check if token is valid
 * @returns {boolean} - Returns true if token exists and is valid
 */
export const isTokenValid = () => !!getToken();

/**
 * 🗑 Remove token and expiry from storage
 */
export const removeToken = () => {
  const storage = getStorage();
  try {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(EXPIRY_KEY);
    dispatchTokenUpdate(); // Notify about the token removal
  } catch (err) {
    console.error("❌ Failed to remove token:", err);
    throw new Error("Failed to remove token");
  }
};

/**
 * 💾 Set refresh token securely
 * @param {string} refreshToken - The refresh token to store
 */
export const setRefreshToken = (refreshToken) => {
  const storage = getStorage();
  try {
    const encrypted = encryptToken(refreshToken);
    storage.setItem(REFRESH_TOKEN_KEY, encrypted);
  } catch (err) {
    console.error("❌ Failed to store refresh token:", err);
    throw new Error("Failed to store refresh token");
  }
};

/**
 * 🔄 Get refresh token
 * @returns {string|null} - Decrypted refresh token or null if not found
 */
export const getRefreshToken = () => {
  try {
    const encrypted = getStorage().getItem(REFRESH_TOKEN_KEY);
    return encrypted ? decryptToken(encrypted) : null;
  } catch (err) {
    console.error("❌ Failed to retrieve refresh token:", err);
    throw new Error("Failed to retrieve refresh token");
  }
};

/**
 * 🗑 Remove refresh token from storage
 */
export const removeRefreshToken = () => {
  try {
    getStorage().removeItem(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error("❌ Failed to remove refresh token:", err);
    throw new Error("Failed to remove refresh token");
  }
};

/**
 * 📡 Notify when token updates
 * Dispatches a global event that other components can listen for
 */
const dispatchTokenUpdate = () => {
  try {
    const event = new Event("tokenUpdated");
    window.dispatchEvent(event);
  } catch (err) {
    console.error("❌ Failed to dispatch tokenUpdated event:", err);
  }
};

/**
 * 📡 Listen for token update events
 * @param {Function} callback - The callback function to execute on token update
 */
export const onTokenUpdate = (callback) => {
  try {
    window.addEventListener("tokenUpdated", callback);
  } catch (err) {
    console.error("❌ Failed to register token update listener:", err);
  }
};

/**
 * 🛡️ Token expiry check
 * Uses decoded JWT to validate if the token has expired
 * @param {string} token - The JWT token
 * @returns {boolean} - True if token has expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = JSON.parse(atob(token.split('.')[1])); // Decoding JWT to get exp
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
