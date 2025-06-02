// ✅ FILE: /frontend/src/services/analyticsService.js

import apiClient from '@/api/apiClient';
import logger from '@/utils/logging/logging';

const ANALYTICS_ENDPOINT = '/api/analytics/log';

/**
 * General analytics event logger
 * 
 * @param {string} eventName - Name of the event
 * @param {object} eventData - Additional metadata
 */
export const logEvent = async (eventName, eventData = {}) => {
  try {
    await apiClient.post(ANALYTICS_ENDPOINT, {
      type: 'event',
      eventName,
      eventData,
      timestamp: new Date().toISOString(),
    });
    logger.debug('📈 Event logged', { eventName, eventData });
  } catch (error) {
    logger.error('❌ logEvent failed', 'analyticsService', { error });
  }
};

/**
 * Specialized error logger
 * 
 * @param {string} errorName - Short description of error
 * @param {object} errorData - Contextual data
 */
export const logError = async (errorName, errorData = {}) => {
  try {
    await apiClient.post(ANALYTICS_ENDPOINT, {
      type: 'error',
      errorName,
      errorData,
      timestamp: new Date().toISOString(),
    });
    logger.debug('🛑 Error logged', { errorName, errorData });
  } catch (error) {
    logger.error('❌ logError failed', 'analyticsService', { error });
  }
};

/**
 * Page view tracker
 * 
 * @param {string} url - Current page URL
 */
export const trackPageView = async (url) => {
  try {
    await apiClient.post(ANALYTICS_ENDPOINT, {
      type: 'page_view',
      url,
      timestamp: new Date().toISOString(),
    });
    logger.debug('📄 Page view logged', { url });
  } catch (error) {
    logger.error('❌ trackPageView failed', 'analyticsService', { error });
  }
};

/**
 * Identify user for session analytics
 * 
 * @param {object} user - User metadata (id, email, roles)
 */
export const identifyUser = async (user) => {
  try {
    await apiClient.post(ANALYTICS_ENDPOINT, {
      type: 'identify_user',
      user,
      timestamp: new Date().toISOString(),
    });
    logger.debug('🙋 User identified', { user });
  } catch (error) {
    logger.error('❌ identifyUser failed', 'analyticsService', { error });
  }
};

/**
 * Flush batched events (optional for optimization)
 */
export const flushEvents = async () => {
  try {
    await apiClient.post(`${ANALYTICS_ENDPOINT}/flush`);
    logger.debug('🧹 Flushed analytics events');
  } catch (error) {
    logger.error('❌ flushEvents failed', 'analyticsService', { error });
  }
};
