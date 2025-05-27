import apiClient from "../api/apiClient.js"; // Ensure the path matches your project structure
import formatFileSize from "../utils/formatFileSize.js"; // For size validation

/**
 * Upload a file to the server.
 * @param {File} file - The file to upload.
 * @param {Function} getToken - A function to retrieve the current auth token.
 * @param {Function} refreshTokenIfNeeded - A function to refresh the auth token if expired.
 * @param {Function} onProgress - A callback for tracking upload progress.
 * @returns {Promise} - Resolves with the uploaded file's response data.
 */
export const uploadFile = async (file, getToken, refreshTokenIfNeeded, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const token = await refreshTokenIfNeeded(getToken());
  const response = await apiClient.post("/api/files/upload", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      if (onProgress) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress(progress);
      }
    },
  });

  return response.data;
};

/**
 * Delete a file by its ID.
 * @param {string} fileId - The ID of the file to delete.
 * @param {Function} getToken - A function to retrieve the current auth token.
 * @param {Function} refreshTokenIfNeeded - A function to refresh the auth token if expired.
 */
export const deleteFile = async (fileId, getToken, refreshTokenIfNeeded) => {
  const token = await refreshTokenIfNeeded(getToken());
  await apiClient.delete(`/api/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Download a file by its ID.
 * @param {string} fileId - The ID of the file to download.
 * @param {Function} getToken - A function to retrieve the current auth token.
 * @param {Function} refreshTokenIfNeeded - A function to refresh the auth token if expired.
 * @param {Object[]} files - The list of all files to find the target file name.
 */
export const downloadFile = async (fileId, getToken, refreshTokenIfNeeded, files) => {
  const token = await refreshTokenIfNeeded(getToken());
  const response = await apiClient.get(`/api/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });

  const file = files.find((f) => f.id === fileId);
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

/**
 * Rename a file.
 * @param {string} fileId - The ID of the file to rename.
 * @param {string} newName - The new name for the file.
 * @param {Function} getToken - A function to retrieve the current auth token.
 * @param {Function} refreshTokenIfNeeded - A function to refresh the auth token if expired.
 */
export const renameFile = async (fileId, newName, getToken, refreshTokenIfNeeded) => {
  const token = await refreshTokenIfNeeded(getToken());
  await apiClient.patch(
    `/api/files/${fileId}/rename`,
    { newName },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

/**
 * Share a file.
 * @param {string} fileId - The ID of the file to share.
 * @param {Object} options - The sharing options.
 * @param {Function} getToken - A function to retrieve the current auth token.
 * @param {Function} refreshTokenIfNeeded - A function to refresh the auth token if expired.
 * @returns {Object} - The response data containing share details.
 */
export const shareFile = async (fileId, options, getToken, refreshTokenIfNeeded) => {
  const token = await refreshTokenIfNeeded(getToken());
  const response = await apiClient.post(`/api/files/${fileId}/share`, options, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
