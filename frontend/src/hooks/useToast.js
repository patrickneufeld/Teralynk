// ✅ FILE: /frontend/src/hooks/useToast.js

import { toast } from 'react-toastify';

/**
 * Hook: useToast
 *
 * Provides consistent toast notifications for success, error, warning, and info.
 * Centralizes all toast config for easier future maintenance.
 *
 * @returns {{
 *   success: (message: string, options?: object) => void,
 *   error: (message: string, options?: object) => void,
 *   warning: (message: string, options?: object) => void,
 *   info: (message: string, options?: object) => void
 * }}
 */
export const useToast = () => {
  const baseOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'colored',
  };

  const success = (message, options = {}) =>
    toast.success(message, { ...baseOptions, ...options });

  const error = (message, options = {}) =>
    toast.error(message, { ...baseOptions, ...options });

  const warning = (message, options = {}) =>
    toast.warning(message, { ...baseOptions, ...options });

  const info = (message, options = {}) =>
    toast.info(message, { ...baseOptions, ...options });

  return { success, error, warning, info };
};
