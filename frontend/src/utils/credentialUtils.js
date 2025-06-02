// File: /Users/patrick/Projects/Teralynk/frontend/src/utils/credentialUtils.js

export const getStoredCredentials = async () => {
    const response = await fetch("/api/credentials", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch credentials.");
    return await response.json();
  };
  
  export const saveCredentials = async (platformId, credentials) => {
    const response = await fetch(`/api/credentials/${platformId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error("Failed to save credentials.");
    return await response.json();
  };
  
  export const validateCredentials = (creds) => {
    const requiredFields = ["clientId", "clientSecret", "apiKey"];
    const errors = [];
  
    for (const field of requiredFields) {
      if (!creds[field] || creds[field].trim() === "") {
        errors.push(`${field} is required`);
      }
    }
  
    return errors;
  };
  