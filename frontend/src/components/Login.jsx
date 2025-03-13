import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useSecrets } from "../components/SecretsFetcher";
import { authenticateUser, confirmForgotPassword, forgotPassword } from "../utils/awsCognitoClient";
import "../styles/components/Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const navigate = useNavigate();
  const secrets = useSecrets();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("⚠️ Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await authenticateUser(email, password);
      if (!result?.AccessToken) {
        throw new Error("Login failed — no token received.");
      }

      onLogin?.(result); // triggers AuthContext checkAuthStatus()
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.message || "⚠️ Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setLoading(true);

    if (!email) {
      setError("⚠️ Please enter your email.");
      setLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      setResettingPassword(true);
    } catch (err) {
      console.error("❌ Forgot Password Error:", err);
      setError(err.message || "⚠️ Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setLoading(true);

    if (!confirmationCode || !newPassword) {
      setError("⚠️ Provide reset code and new password.");
      setLoading(false);
      return;
    }

    try {
      await confirmForgotPassword(email, confirmationCode, newPassword);
      setResettingPassword(false);
      setNewPassword("");
      setConfirmationCode("");
      setError("✅ Password reset successful.");
    } catch (err) {
      console.error("❌ Reset Error:", err);
      setError(err.message || "⚠️ Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>{resettingPassword ? "Reset Password" : "Login"}</h2>
      {error && <div className="error-message">{error}</div>}

      {!resettingPassword ? (
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <button type="button" className="forgot-password-button" onClick={handleForgotPassword} disabled={loading}>
            {loading ? "Sending Reset Code..." : "Forgot Password?"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label>Reset Code</label>
            <input type="text" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <button type="button" className="reset-password-button" onClick={handlePasswordReset} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
};

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default Login;
