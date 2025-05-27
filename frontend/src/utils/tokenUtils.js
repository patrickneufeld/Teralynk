// ✅ FILE: /frontend/src/utils/tokenUtils.js

// 🔐 Keys
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ID_TOKEN_KEY = "id_token";
const EXPIRY_KEY = "token_expiry";

// 🔧 Configurable via Vite
const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || "sessionStorage";
const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || "super-secure-key";
const ENCRYPTION_VERSION = 'v2';

/**
 * 📦 Storage utility
 */
const getStorage = () =>
  STORAGE_MODE === "sessionStorage" ? sessionStorage : localStorage;

/**
 * 🧠 Web Crypto utilities
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * 🔐 Convert string to ArrayBuffer
 */
function strToBuf(str) {
  return encoder.encode(str);
}

/**
 * 🔐 Convert ArrayBuffer to base64
 */
function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * 🔓 Convert base64 to ArrayBuffer
 */
function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/**
 * 🧠 Derive AES-GCM key from passphrase
 */
async function deriveKey(passphrase, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToBuf(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 🔐 Encrypt token
 */
const encryptToken = async (token) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(ENCRYPTION_SECRET, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    strToBuf(token)
  );
  return `${ENCRYPTION_VERSION}:${bufToBase64(salt)}:${bufToBase64(iv)}:${bufToBase64(encrypted)}`;
};

/**
 * 🔓 Decrypt token
 */
const decryptToken = async (encryptedToken) => {
  const [version, saltB64, ivB64, dataB64] = encryptedToken.split(":");
  if (version !== ENCRYPTION_VERSION) throw new Error("Unsupported encryption version");
  const salt = base64ToBuf(saltB64);
  const iv = base64ToBuf(ivB64);
  const data = base64ToBuf(dataB64);
  const key = await deriveKey(ENCRYPTION_SECRET, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return decoder.decode(decrypted);
};

/**
 * ✅ Set access token and expiry
 */
export const setToken = async (token, expiresIn = 3600) => {
  const storage = getStorage();
  try {
    const encrypted = await encryptToken(token);
    const expiry = Date.now() + expiresIn * 1000;
    storage.setItem(TOKEN_KEY, encrypted);
    storage.setItem(EXPIRY_KEY, expiry.toString());
    dispatchTokenUpdate();
  } catch (err) {
    console.error("❌ Failed to store token:", err);
    throw new Error("Failed to store token");
  }
};

/**
 * ✅ Set ID token (optional)
 */
export const setIdToken = async (token) => {
  const storage = getStorage();
  try {
    const encrypted = await encryptToken(token);
    storage.setItem(ID_TOKEN_KEY, encrypted);
  } catch (err) {
    console.error("❌ Failed to store ID token:", err);
  }
};

/**
 * 🔓 Get access token if valid
 */
export const getToken = async () => {
  const storage = getStorage();
  try {
    const encrypted = storage.getItem(TOKEN_KEY);
    const expiry = parseInt(storage.getItem(EXPIRY_KEY), 10);
    if (!encrypted || isNaN(expiry)) return null;
    if (Date.now() > expiry) {
      removeToken();
      return null;
    }
    return await decryptToken(encrypted);
  } catch (err) {
    console.error("❌ Failed to retrieve token:", err);
    return null;
  }
};

/**
 * 🔍 Get seconds remaining until expiry
 */
export const getTimeUntilExpiry = () => {
  const expiry = parseInt(getStorage().getItem(EXPIRY_KEY), 10);
  return expiry && !isNaN(expiry) ? expiry - Date.now() : 0;
};

/**
 * 🔓 Decode JWT
 */
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const decoded = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (err) {
    console.error("❌ Failed to decode token:", err);
    return null;
  }
};

/**
 * ✅ Set refresh token
 */
export const setRefreshToken = async (token) => {
  const storage = getStorage();
  try {
    const encrypted = await encryptToken(token);
    storage.setItem(REFRESH_TOKEN_KEY, encrypted);
  } catch (err) {
    console.error("❌ Failed to store refresh token:", err);
    throw new Error("Failed to store refresh token");
  }
};

/**
 * 🔄 Get refresh token
 */
export const getRefreshToken = async () => {
  try {
    const encrypted = getStorage().getItem(REFRESH_TOKEN_KEY);
    return encrypted ? await decryptToken(encrypted) : null;
  } catch (err) {
    console.error("❌ Failed to get refresh token:", err);
    return null;
  }
};

/**
 * 🧼 Remove access token
 */
export const removeToken = () => {
  const storage = getStorage();
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(EXPIRY_KEY);
  dispatchTokenUpdate();
};

/**
 * 🧼 Remove refresh token
 */
export const removeRefreshToken = () => {
  getStorage().removeItem(REFRESH_TOKEN_KEY);
};

/**
 * 🧼 Remove all tokens
 */
export const removeAllTokens = () => {
  removeToken();
  removeRefreshToken();
};

/**
 * 🔁 Apply refreshed token payload
 */
export const applyRefreshedTokens = async (authResult) => {
  try {
    if (!authResult?.AccessToken || !authResult?.ExpiresIn) return false;
    await setToken(authResult.AccessToken, authResult.ExpiresIn);
    if (authResult.RefreshToken) await setRefreshToken(authResult.RefreshToken);
    if (authResult.IdToken) await setIdToken(authResult.IdToken);
    return true;
  } catch (err) {
    console.error("❌ Failed to apply refreshed tokens:", err);
    return false;
  }
};

/**
 * 🔐 Check token validity
 */
export const isTokenValid = async () => !!(await getToken());

/**
 * 🛡️ Check token expiry from JWT
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  const now = Date.now() / 1000;
  return decoded.exp < now;
};

/**
 * 📡 Global token update notification
 */
export const dispatchTokenUpdate = () => {
  try {
    const event = new Event("tokenUpdated");
    window.dispatchEvent(event);
  } catch (err) {
    console.error("❌ Failed to dispatch tokenUpdated event:", err);
  }
};

/**
 * 📡 Subscribe to token updates
 */
export const onTokenUpdate = (callback) => {
  try {
    window.addEventListener("tokenUpdated", callback);
  } catch (err) {
    console.error("❌ Failed to subscribe to token update:", err);
  }
};

/**
 * 🧪 Placeholder for future backend-driven refresh token logic
 */
export const refreshAuthToken = async () => {
  console.warn("⚠️ refreshAuthToken is not yet implemented");
  return null;
};

// 👇 Export all together for convenience
export const tokenUtils = {
  setToken,
  setIdToken,
  getToken,
  getTimeUntilExpiry,
  decodeToken,
  isTokenValid,
  isTokenExpired,
  setRefreshToken,
  getRefreshToken,
  removeToken,
  removeRefreshToken,
  removeAllTokens,
  applyRefreshedTokens,
  dispatchTokenUpdate,
  onTokenUpdate,
  refreshAuthToken,
};

export default tokenUtils;
