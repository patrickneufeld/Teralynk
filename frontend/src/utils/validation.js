// ✅ FILE: /frontend/src/utils/validation.js

/**
 * ✅ Validates if the input is a valid email.
 * @param {string} email - Email to validate.
 * @returns {string|null} - Error message if invalid, otherwise null.
 */
export const validateEmail = (email) => {
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email?.trim()) return "Email is required.";
  if (!emailRegex.test(email)) return "Please enter a valid email address.";
  return null;
};

/**
 * ✅ Validates if the input is a secure password.
 * @param {string} password - Password to validate.
 * @returns {string|null} - Error message if invalid, otherwise null.
 */
export const validatePassword = (password) => {
  const issues = [];
  if (!password || password.length < 8) issues.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
  if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
  if (!/[0-9]/.test(password)) issues.push("a number");
  if (!/[!@#$%^&*]/.test(password)) issues.push("a special character (!@#$%^&*)");

  return issues.length
    ? `Password must include: ${issues.join(", ")}.`
    : null;
};

/**
 * ✅ Validates if the input matches a URL format.
 * @param {string} url - URL to validate.
 * @returns {string|null} - Error message if invalid, otherwise null.
 */
export const validateURL = (url) => {
  const urlRegex =
    /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

  if (!url?.trim()) return "URL is required.";
  if (!urlRegex.test(url)) return "Please enter a valid URL.";
  return null;
};

/**
 * ✅ Validates if the confirmation password matches the original password.
 * @param {string} password - Original password.
 * @param {string} confirmPassword - Confirmation password to validate.
 * @returns {string|null} - Error message if invalid, otherwise null.
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword?.trim()) return "Confirmation password is required.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
};

/**
 * ✅ Aggregates all validation results into a single object.
 * @param {Object} fields - Fields to validate (e.g., { email, password, confirmPassword, url }).
 * @returns {Object} - Validation results with error messages for each field.
 */
export const validateForm = (fields) => {
  const errors = {};

  if ("email" in fields) {
    errors.email = validateEmail(fields.email);
  }

  if ("password" in fields) {
    errors.password = validatePassword(fields.password);
  }

  if ("confirmPassword" in fields) {
    errors.confirmPassword = validateConfirmPassword(
      fields.password,
      fields.confirmPassword
    );
  }

  if ("url" in fields) {
    errors.url = validateURL(fields.url);
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([_, value]) => value !== null)
  );
};
