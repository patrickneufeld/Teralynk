// ✅ FILE: /frontend/src/services/notificationService.js
import { toast } from 'react-toastify';
import logger from '@/utils/logging/logging';

/**
 * Notification Service
 * 
 * Provides centralized control for showing toasts across the application.
 */

/**
 * Show a success toast
 * @param {string} message - Notification content
 * @param {object} options - Toast options
 */
export const notifySuccess = (message, options = {}) => {
  logger.info('✅ Notification (Success):', message);
  toast.success(message, { position: 'top-right', autoClose: 4000, ...options });
};

/**
 * Show an info toast
 * @param {string} message - Notification content
 * @param {object} options - Toast options
 */
export const notifyInfo = (message, options = {}) => {
  logger.info('ℹ️ Notification (Info):', message);
  toast.info(message, { position: 'top-right', autoClose: 4000, ...options });
};

/**
 * Show a warning toast
 * @param {string} message - Notification content
 * @param {object} options - Toast options
 */
export const notifyWarning = (message, options = {}) => {
  logger.warn('⚠️ Notification (Warning):', message);
  toast.warn(message, { position: 'top-right', autoClose: 4000, ...options });
};

/**
 * Show an error toast
 * @param {string} message - Notification content
 * @param {object} options - Toast options
 */
export const notifyError = (message, options = {}) => {
  logger.error('❌ Notification (Error):', message);
  toast.error(message, { position: 'top-right', autoClose: 5000, ...options });
};

/**
 * Flexible notification dispatcher
 * 
 * @param {string} message - Notification content
 * @param {'success'|'info'|'warning'|'error'} type - Type of notification
 * @param {object} options - Toast options
 */
export const notifyCustom = (message, type = 'info', options = {}) => {
  switch (type) {
    case 'success':
      notifySuccess(message, options);
      break;
    case 'warning':
      notifyWarning(message, options);
      break;
    case 'error':
      notifyError(message, options);
      break;
    case 'info':
    default:
      notifyInfo(message, options);
      break;
  }
};
