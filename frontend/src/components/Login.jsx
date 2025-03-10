import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import awsConfig from "../utils/awsSdkClient"; // Cognito client instance
import CryptoJS from "crypto-js"; // Import for calculating the secret hash
import "../styles/components/Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false); // State for password reset
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  /**
   * ✅ Calculate SECRET_HASH
   */
  const calculateSecretHash = (username, clientId, clientSecret) => {
    try {
      const message = username + clientId;
      const hmac = CryptoJS.HmacSHA256(message, clientSecret);
      return CryptoJS.enc.Base64.stringify(hmac);
    } catch (error) {
      console.error("❌ Error Calculating Secret Hash:", error);
      throw new Error("Error generating secret hash.");
    }
  };

  /**
   * ✅ Handle Login Form Submission
   */
  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("⚠️ Please provide both email and password.");
      setLoading(false);
      return;
    }

    try {
      const secretHash = calculateSecretHash(
        email,
        import.meta.env.VITE_COGNITO_CLIENT_ID,
        import.meta.env.VITE_COGNITO_CLIENT_SECRET
      );

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      const cognitoClient = await awsConfig.getCognitoClient();
      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error("Invalid credentials or authentication failed.");
      }

      // Store tokens securely
      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;
      sessionStorage.setItem("idToken", IdToken);
      sessionStorage.setItem("accessToken", AccessToken);
      sessionStorage.setItem("refreshToken", RefreshToken);

      // Notify parent component and navigate
      onLogin && onLogin(response.AuthenticationResult);
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Login Error:", error);
      setError(error.message || "⚠️ Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Handle Password Reset Request
   */
  const handleForgotPassword = async () => {
    setError("");
    setLoading(true);

    if (!email) {
      setError("⚠️ Please provide your email to reset your password.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔑 Sending password reset code...");
      const cognitoClient = await awsConfig.getCognitoClient();
      const command = new ForgotPasswordCommand({
        ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        Username: email,
      });

      await cognitoClient.send(command);
      setResettingPassword(true);
      console.log("✅ Password reset code sent successfully.");
    } catch (error) {
      console.error("❌ Error Sending Reset Code:", error);
      setError(error.message || "⚠️ Failed to send password reset code.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Confirm New Password
   */
  const handlePasswordReset = async () => {
    setError("");
    setLoading(true);

    if (!confirmationCode || !newPassword) {
      setError("⚠️ Please provide both the reset code and your new password.");
      setLoading(false);
      return;
    }

    try {
      const cognitoClient = await awsConfig.getCognitoClient();
      const command = new ConfirmForgotPasswordCommand({
        ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });

      await cognitoClient.send(command);
      setResettingPassword(false);
      setNewPassword("");
      setConfirmationCode("");
      console.log("✅ Password reset successfully.");
      setError("Password reset successful. You can now log in with your new password.");
    } catch (error) {
      console.error("❌ Error Resetting Password:", error);
      setError(error.message || "⚠️ Failed to reset your password. Please try again.");
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <button
            type="button"
            className="forgot-password-button"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            {loading ? "Sending Reset Code..." : "Forgot Password?"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="confirmationCode">Reset Code</label>
            <input
              type="text"
              id="confirmationCode"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
              placeholder="Enter the reset code"
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter your new password"
            />
          </div>
          <button
            type="button"
            className="reset-password-button"
            onClick={handlePasswordReset}
            disabled={loading}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
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
