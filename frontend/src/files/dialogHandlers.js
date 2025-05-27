/**
 * Handles dialog state management.
 * This module includes utilities for opening and closing dialogs with specific actions.
 */

/**
 * Open a dialog with a specified type and optional file ID.
 * @param {string} dialogType - The type of dialog to open (e.g., "share", "metadata", "versions", "collaborate", "delete").
 * @param {string|null} fileId - The ID of the selected file, if applicable.
 * @param {Function} setState - State updater function from React useState.
 */
export const openDialog = (dialogType, fileId, setState) => {
    setState((prev) => ({
      ...prev,
      dialogOpen: dialogType,
      selectedFile: fileId || null,
    }));
  };
  
  /**
   * Close the currently open dialog.
   * @param {Function} setState - State updater function from React useState.
   */
  export const closeDialog = (setState) => {
    setState((prev) => ({
      ...prev,
      dialogOpen: null,
      selectedFile: null,
    }));
  };
  
  /**
   * Handle actions for the VersionHistoryDialog.
   * @param {Object} params - Parameters for the action.
   * @param {string} params.fileId - The ID of the file.
   * @param {string} params.action - The action to perform (e.g., "restore", "delete", "create").
   * @param {string|null} params.versionId - The version ID, if applicable.
   * @param {Function} apiClient - API client instance for network requests.
   * @param {Function} refreshTokenIfNeeded - Function to refresh the auth token.
   * @param {Function} getToken - Function to retrieve the auth token.
   * @param {Function} showNotification - Function to display user notifications.
   * @param {Function} logError - Function to log errors for debugging.
   * @param {Function} setCollections - State updater function for collections.
   */
  export const handleVersionAction = async ({
    fileId,
    action,
    versionId,
    apiClient,
    refreshTokenIfNeeded,
    getToken,
    showNotification,
    logError,
    setCollections,
  }) => {
    try {
      const token = await refreshTokenIfNeeded(getToken());
  
      if (action === "restore") {
        await apiClient.post(`/api/files/${fileId}/versions/${versionId}/restore`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Version restored successfully", "success");
      } else if (action === "delete") {
        await apiClient.delete(`/api/files/${fileId}/versions/${versionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCollections((prev) => ({
          ...prev,
          fileVersions: {
            ...prev.fileVersions,
            [fileId]: prev.fileVersions[fileId].filter((v) => v.id !== versionId),
          },
        }));
        showNotification("Version deleted successfully", "success");
      } else if (action === "create") {
        const response = await apiClient.post(`/api/files/${fileId}/versions`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCollections((prev) => ({
          ...prev,
          fileVersions: {
            ...prev.fileVersions,
            [fileId]: [...(prev.fileVersions[fileId] || []), response.data.version],
          },
        }));
        showNotification("Version created successfully", "success");
      }
    } catch (error) {
      logError(error, "handleVersionAction", { fileId, action, versionId });
      showNotification(`Failed to ${action} version`, "error");
    }
  };
  
  /**
   * Handle actions for the CollaborationDialog.
   * @param {Object} params - Parameters for the action.
   * @param {string} params.fileId - The ID of the file.
   * @param {string} params.action - The collaboration action (e.g., "invite", "remove", "updatePermissions").
   * @param {Object} params.userData - Data for the collaborator.
   * @param {Function} apiClient - API client instance for network requests.
   * @param {Function} refreshTokenIfNeeded - Function to refresh the auth token.
   * @param {Function} getToken - Function to retrieve the auth token.
   * @param {Function} showNotification - Function to display user notifications.
   * @param {Function} logError - Function to log errors for debugging.
   * @param {Function} setCollections - State updater function for collections.
   */
  export const handleCollaborationAction = async ({
    fileId,
    action,
    userData,
    apiClient,
    refreshTokenIfNeeded,
    getToken,
    showNotification,
    logError,
    setCollections,
  }) => {
    try {
      const token = await refreshTokenIfNeeded(getToken());
  
      if (action === "invite") {
        const response = await apiClient.post(`/api/files/${fileId}/collaborators`, userData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCollections((prev) => ({
          ...prev,
          collaboratorInvites: [...prev.collaboratorInvites, response.data],
        }));
        showNotification("Invitation sent successfully", "success");
      } else if (action === "remove") {
        await apiClient.delete(`/api/files/${fileId}/collaborators/${userData.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Collaborator removed successfully", "success");
      } else if (action === "updatePermissions") {
        await apiClient.patch(`/api/files/${fileId}/collaborators/${userData.userId}`, {
          permissions: userData.permissions,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Permissions updated successfully", "success");
      }
    } catch (error) {
      logError(error, "handleCollaborationAction", { fileId, action, userData });
      showNotification(`Failed to ${action}`, "error");
    }
  };
  