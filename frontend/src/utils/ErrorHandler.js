// File: /frontend/src/utils/ErrorHandler.js

/**
 * ✅ Centralized error logger.
 * Extend this to include remote error tracking services (e.g. Sentry, Datadog).
 * @param {Error | any} error - The error to log
 * @param {string} [context="Unknown Context"] - Location or module name
 */
export const logError = (error, context = "Unknown Context") => {
  const errorDetails = {
    name: error?.name || "UnknownError",
    message: error?.message || String(error),
    stack: error?.stack || null,
    code: error?.code || null,
    context,
  };

  console.error(`❌ [${context}]`, errorDetails);

  // Optional: Send to monitoring tools
  // import * as Sentry from "@sentry/react";
  // Sentry.captureException(error, { tags: { context }, extra: errorDetails });
};

/**
 * ✅ Friendly error formatter for UI display
 * Handles Fetch, Axios, AWS SDK, and generic JS errors
 * @param {Error | any} error - The raw error object or string
 * @returns {string} - A user-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";

  if (typeof error === "string") return error;

  // AWS Cognito-specific errors
  switch (error.name) {
    case "NotAuthorizedException":
      return "Your session has expired. Please log in again.";
    case "UserNotFoundException":
      return "User not found. Please check your credentials.";
    case "CodeMismatchException":
      return "Invalid confirmation code.";
    default:
      break;
  }

  // Axios-style errors
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;

  // Fetch-style errors
  if (error.status && error.statusText) {
    return `Server responded with ${error.status}: ${error.statusText}`;
  }

  if (error.message) return error.message;

  return "An unexpected error occurred. Please try again later.";
};

/**
 * ✅ Wrapper to catch + log + rethrow UI-friendly errors
 * @param {Function} fn - Async function to run
 * @param {string} context - Context of the error
 */
export const handleWithErrorLogging = async (fn, context = "Unknown") => {
  try {
    return await fn();
  } catch (err) {
    logError(err, context);
    throw new Error(getErrorMessage(err));
  }
};
