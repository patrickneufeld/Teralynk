// ✅ FILE: /frontend/src/services/userService.js

import apiClient from '@/api/apiClient';
import { getToken } from '@/utils/tokenManager';
import logger from '@/utils/logging/logging';

/**
 * User Service
 * 
 * Provides functions for user authentication, profile fetching, profile updating, and session validation.
 * Centralizes all user-related API interactions.
 */

const ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/me',
  UPDATE_PROFILE: '/api/user/update-profile',
};

/**
 * Login user
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post(ENDPOINTS.LOGIN, credentials);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ loginUser failed', 'userService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await apiClient.post(ENDPOINTS.LOGOUT);
    return { success: true };
  } catch (error) {
    logger.warn('⚠️ logoutUser encountered error', 'userService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Refresh session
 */
export const refreshSession = async (refreshToken) => {
  try {
    const response = await apiClient.post(ENDPOINTS.REFRESH, { refreshToken });
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ refreshSession failed', 'userService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Fetch current user profile
 */
export const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.PROFILE);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ fetchUserProfile failed', 'userService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const token = getToken();
    if (!token) throw new Error('Missing access token');

    const response = await apiClient.put(ENDPOINTS.UPDATE_PROFILE, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ updateUserProfile failed', 'userService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};
