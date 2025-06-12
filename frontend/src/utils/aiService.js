// ✅ FILE: /frontend/src/utils/aiService.js

import axios from "axios";
import { logError, getErrorMessage } from "./ErrorHandler";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

/**
 * ✅ Fetch all available AI models
 */
export const fetchAIModels = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/ai/models`, {
      withCredentials: true,
    });

    if (!response.data?.models) {
      throw new Error("No models found.");
    }

    return response.data.models;
  } catch (error) {
    logError(error, "fetchAIModels");
    throw new Error(getErrorMessage(error));
  }
};

/**
 * ✅ Fetch all saved AI groups
 */
export const fetchAIGroups = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/ai/groups`, {
      withCredentials: true,
    });

    return response.data.groups || [];
  } catch (error) {
    logError(error, "fetchAIGroups");
    throw new Error(getErrorMessage(error));
  }
};

/**
 * ✅ Save a new AI group
 * @param {object} group - { name: string, models: array }
 */
export const saveAIGroup = async (group) => {
  try {
    const response = await axios.post(`${API_BASE}/api/ai/groups`, group, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    return response.data.group;
  } catch (error) {
    logError(error, "saveAIGroup");
    throw new Error(getErrorMessage(error));
  }
};

/**
 * ✅ Delete a saved AI group by ID
 */
export const deleteAIGroup = async (groupId) => {
  try {
    const response = await axios.delete(`${API_BASE}/api/ai/groups/${groupId}`, {
      withCredentials: true,
    });

    return response.status === 200;
  } catch (error) {
    logError(error, "deleteAIGroup");
    throw new Error(getErrorMessage(error));
  }
};
