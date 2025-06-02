// File: /Users/patrick/Projects/Teralynk/frontend/src/services/storageService.js

export const getStorageUsage = async () => {
    const response = await fetch("/api/storage", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch storage data.");
    return await response.json();
  };
  
  export const upgradeStorage = async (platformId) => {
    const response = await fetch(`/api/storage/${platformId}/upgrade`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Storage upgrade failed.");
    return await response.json();
  };
  
  export const uploadFile = async (platformId, file) => {
    const formData = new FormData();
    formData.append("file", file);
  
    const response = await fetch(`/api/storage/${platformId}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  
    if (!response.ok) throw new Error("File upload failed.");
    return await response.json();
  };
  
  export const getLowestCostProvider = async () => {
    const response = await fetch("/api/storage/lowest-cost", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to determine cheapest provider.");
    return await response.json();
  };
  