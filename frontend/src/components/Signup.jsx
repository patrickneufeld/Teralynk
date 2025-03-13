// File: /frontend/src/components/Signup.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecrets } from "../components/SecretsFetcher";
import { signUpUser } from "../utils/awsCognitoClient";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import "../styles/components/Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    confirmationCode: "",
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const secrets = useSecrets();

  const validatePassword = (password, confirmPassword) => {
    const issues = [];
    if (password.length < 8) issues.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
    if (!/[0-9]/.test(password)) issues.push("a number");
    if (!/[!@#$%^&*]/.test(password)) issues.push("a special character (!@#$%^&*)");
    if (password !== confirmPassword) issues.push("Passwords must match");

    setPasswordError(
      issues.length ? `Password must include: ${issues.join(", ")}` : ""
    );
    return issues.length === 0;
  };

  const isFormValid = () => {
    const { username, email, password, confirmPassword } = formData;
    return (
      username.trim() &&
      email.trim() &&
      validatePassword(password, confirmPassword)
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password" || name === "confirmPassword") {
      validatePassword(formData.password, formData.confirmPassword);
    }
  };

  const handleSignup = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    setError("");

    try {
      await signUpUser(formData.username, formData.password, formData.email);
      setIsConfirmed(true);
    } catch (err) {
      console.error("❌ Signup failed:", err);
      setError(err.message || "Unexpected error during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignup = async () => {
    if (!formData.confirmationCode.trim()) {
      setError("⚠️ Please provide the confirmation code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const client = new CognitoIdentityProviderClient({
        region: secrets?.VITE_AWS_REGION,
      });

      const command = new ConfirmSignUpCommand({
        ClientId: secrets?.VITE_COGNITO_CLIENT_ID,
        Username: formData.username,
        ConfirmationCode: formData.confirmationCode,
      });

      await client.send(command);
      navigate("/login");
    } catch (err) {
      console.error("❌ Confirmation failed:", err);
      setError(err.message || "Invalid confirmation code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>{isConfirmed ? "Confirm Signup" : "Signup"}</h2>
      {error && <p className="error" aria-live="polite">{error}</p>}
      {!isConfirmed ? (
        <form>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {passwordError && <p className="error">{passwordError}</p>}
          <button
            type="button"
            onClick={handleSignup}
            disabled={loading || !isFormValid()}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      ) : (
        <form>
          <input
            type="text"
            name="confirmationCode"
            placeholder="Confirmation Code"
            value={formData.confirmationCode}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={handleConfirmSignup}
            disabled={loading}
          >
            {loading ? "Confirming..." : "Confirm Signup"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Signup;
