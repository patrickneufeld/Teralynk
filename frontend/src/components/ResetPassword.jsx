// File: /frontend/src/components/ResetPassword.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordReset, confirmPasswordReset } from "../services/aws/password";
import { validatePassword } from "../utils/validation";
import Loader from "./ui/Loader";
import { logError } from "../utils/logging/logging";
import "../styles/components/ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // 'request' or 'confirm'
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types
  };

  const validateRequestForm = () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    return true;
  };

  const validateConfirmForm = () => {
    if (!formData.code || !formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!validatePassword(formData.newPassword)) {
      setError("Password does not meet security requirements");
      return false;
    }

    return true;
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequestForm()) return;

    setLoading(true);
    setError("");

    try {
      await requestPasswordReset(formData.email);
      setStep("confirm");
    } catch (err) {
      logError(err, "ResetPassword.request");
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!validateConfirmForm()) return;

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(
        formData.email,
        formData.code,
        formData.newPassword
      );
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      logError(err, "ResetPassword.confirm");
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-success" data-testid="reset-success">
        <h2>Password Reset Successful!</h2>
        <p>
          You’ll be redirected to{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            login
          </Link>{" "}
          shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="reset-password-container" data-testid="reset-password">
      <h2 className="reset-heading">Reset Password</h2>

      {step === "request" ? (
        <form onSubmit={handleRequestSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? <Loader size="sm" /> : "Send Reset Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="code">Reset Code</label>
            <input
              type="text"
              name="code"
              id="code"
              inputMode="numeric"
              required
              value={formData.code}
              onChange={handleChange}
              disabled={loading}
              autoComplete="one-time-code"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              required
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? <Loader size="sm" /> : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => setStep("request")}
            className="back-button mt-4"
            disabled={loading}
          >
            Back to Email
          </button>
        </form>
      )}

      <p className="secondary-actions text-center mt-6">
        Remembered your password?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
