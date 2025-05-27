// File Path: frontend/services/folderPermissionsService.js

import axios from 'axios';

const API_URL = '/api/folder-permissions';

export const getFolderPermissions = async () => {
    return axios.get(API_URL);
};

export const updateFolderPermissions = async (folderId, updatedPermission) => {
    return axios.put(`${API_URL}/${folderId}`, updatedPermission);
};

export const createFolderPermission = async (newPermission) => {
    return axios.post(API_URL, newPermission);
};
