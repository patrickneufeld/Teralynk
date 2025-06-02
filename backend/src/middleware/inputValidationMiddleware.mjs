// ✅ FILE: /backend/src/middleware/inputValidationMiddleware.js

import { validationResult } from "express-validator";

/**
 * Middleware to handle validation errors from express-validator.
 * Sends 400 response with formatted field errors.
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      status: "error",
      errors: extractedErrors,
    });
  }

  next();
}

/**
 * Programmatic validator runner with built-in error handling.
 * Allows validation arrays to be used as middleware dynamically.
 *
 * @param {Array} validations - An array of validation chains.
 * @returns {Function} Express middleware
 */
export function validateRequest(validations) {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map((err) => ({
          field: err.param,
          message: err.msg,
        }));

        return res.status(400).json({
          status: "error",
          errors: extractedErrors,
        });
      }

      next();
    } catch (err) {
      console.error("❌ Validation middleware internal error:", err);
      return res.status(500).json({ error: "Validation failed internally." });
    }
  };
}
