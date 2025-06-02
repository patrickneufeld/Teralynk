// ✅ FILE: /frontend/src/components/Signup.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser, confirmSignup } from "../services/aws/signup";
import "../styles/components/Signup.css";
import { logError, logInfo } from "../utils/logging/logging";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

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
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const executeRecaptcha = async () => {
      try {
        if (!window.grecaptcha || !RECAPTCHA_SITE_KEY) {
          throw new Error("reCAPTCHA not available");
        }

        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "signup" })
            .then(token => {
              setRecaptchaToken(token);
              logInfo("reCAPTCHA token retrieved", { token });
            })
            .catch(err => {
              logError(err, "reCAPTCHA execute failed");
              setError("reCAPTCHA failed. Try again.");
            });
        });
      } catch (e) {
        logError(e, "reCAPTCHA init failed");
        setError("reCAPTCHA is not supported in your browser.");
      }
    };

    executeRecaptcha();
  }, []);

  const validatePassword = (password, confirmPassword) => {
    const issues = [];
    if (password.length < 8) issues.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
    if (!/[0-9]/.test(password)) issues.push("a number");
    if (!/[!@#$%^&*]/.test(password)) issues.push("a special character (!@#$%^&*)");
    if (password !== confirmPassword) issues.push("Passwords must match");

    setPasswordError(issues.length ? `Password must include: ${issues.join(", ")}` : "");
    return issues.length === 0;
  };

  const isFormValid = () => {
    const { username, email, password, confirmPassword } = formData;
    return (
      username.trim() &&
      email.trim() &&
      validatePassword(password, confirmPassword) &&
      recaptchaToken
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password" || name === "confirmPassword") {
      validatePassword(
        name === "password" ? value : formData.password,
        name === "confirmPassword" ? value : formData.confirmPassword
      );
    }
  };

  const handleSignup = async () => {
    if (!isFormValid()) {
      setError("Please fix the errors and complete the reCAPTCHA.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      logInfo("Submitting signup", {
        email: formData.email,
        token: recaptchaToken,
      });

      await signupUser(formData.username, formData.email, formData.password, recaptchaToken);
      setIsConfirmed(true);
    } catch (err) {
      logError(err, "Signup");
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignup = async () => {
    if (!formData.confirmationCode.trim()) {
      setError("⚠️ Please enter the confirmation code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmSignup(formData.email, formData.confirmationCode);
      navigate("/login");
    } catch (err) {
      logError(err, "Signup.Confirm");
      setError(err.message || "Invalid confirmation code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container" data-testid="signup-form">
      <h2 className="signup-heading">{isConfirmed ? "Confirm Signup" : "Create Your Account"}</h2>

      {error && <div className="error-message" role="alert">{error}</div>}

      {!isConfirmed ? (
        <form onSubmit={(e) => e.preventDefault()} noValidate className="signup-form">
          <input type="text" name="username" placeholder="Username" autoComplete="username" value={formData.username} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" autoComplete="email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" autoComplete="new-password" value={formData.password} onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} required />
          {passwordError && <div className="error-message" role="alert">{passwordError}</div>}
          <button type="submit" onClick={handleSignup} disabled={loading || !isFormValid()} className="signup-button">
            {loading ? "Signing up..." : "Sign Up"}
          </button>
          <p className="secondary-actions text-center mt-4">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={(e) => e.preventDefault()} noValidate className="confirm-form">
          <input type="text" name="confirmationCode" placeholder="Confirmation Code" autoComplete="one-time-code" value={formData.confirmationCode} onChange={handleChange} required />
          <button type="submit" onClick={handleConfirmSignup} disabled={loading} className="confirm-button">
            {loading ? "Confirming..." : "Confirm Signup"}
          </button>
          <p className="secondary-actions text-center mt-4">
            Back to <Link to="/login" className="text-blue-600 hover:underline">login</Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default Signup;
