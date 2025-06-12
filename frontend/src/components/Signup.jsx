// ✅ FILE: /frontend/src/components/Signup.jsx

import React, { useState, useEffect, useCallback } from "react";
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
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  const navigate = useNavigate();

  // Memoize the password validation function to prevent unnecessary re-renders
  const validatePassword = useCallback((password, confirmPassword) => {
    const issues = [];
    if (password.length < 8) issues.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
    if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
    if (!/[0-9]/.test(password)) issues.push("a number");
    if (!/[!@#$%^&*]/.test(password)) issues.push("a special character (!@#$%^&*)");
    if (password !== confirmPassword) issues.push("Passwords must match");

    return issues;
  }, []);

  // Handle reCAPTCHA loading
  useEffect(() => {
    // Check if reCAPTCHA script is already loaded
    if (window.grecaptcha && window.grecaptcha.ready) {
      setRecaptchaLoaded(true);
      return;
    }

    // Only load reCAPTCHA if we have a site key
    if (!RECAPTCHA_SITE_KEY) {
      logError("Missing reCAPTCHA site key");
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setRecaptchaLoaded(true);
    };
    
    script.onerror = () => {
      logError("Failed to load reCAPTCHA script");
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Execute reCAPTCHA when loaded
  useEffect(() => {
    if (!recaptchaLoaded || !window.grecaptcha || !RECAPTCHA_SITE_KEY) {
      return;
    }

    const executeRecaptcha = async () => {
      try {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "signup" });
            setRecaptchaToken(token);
            logInfo("reCAPTCHA token retrieved");
          } catch (err) {
            logError("reCAPTCHA execute failed", { error: err.message });
            setError("reCAPTCHA failed. Try again.");
          }
        });
      } catch (e) {
        logError("reCAPTCHA init failed", { error: e.message });
        // Don't set error here to avoid bad UX - just log it
      }
    };

    executeRecaptcha();
  }, [recaptchaLoaded]);

  // Update password error message when password or confirmPassword changes
  useEffect(() => {
    const issues = validatePassword(formData.password, formData.confirmPassword);
    setPasswordError(issues.length ? `Password must include: ${issues.join(", ")}` : "");
  }, [formData.password, formData.confirmPassword, validatePassword]);

  const isFormValid = () => {
    const { username, email, password, confirmPassword } = formData;
    const passwordIssues = validatePassword(password, confirmPassword);
    
    return (
      username.trim() &&
      email.trim() &&
      passwordIssues.length === 0 &&
      // Make reCAPTCHA optional in development if no site key is provided
      (recaptchaToken || !RECAPTCHA_SITE_KEY)
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      logInfo("Submitting signup", {
        email: formData.email,
        hasToken: !!recaptchaToken,
      });

      await signupUser(formData.username, formData.email, formData.password, recaptchaToken);
      setIsConfirmed(true);
    } catch (err) {
      logError("Signup failed", { error: err.message });
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignup = async (e) => {
    e.preventDefault();
    
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
      logError("Signup confirmation failed", { error: err.message });
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
        <form onSubmit={handleSignup} noValidate className="signup-form">
          <input type="text" name="username" placeholder="Username" autoComplete="username" value={formData.username} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" autoComplete="email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" autoComplete="new-password" value={formData.password} onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} required />
          {passwordError && <div className="error-message" role="alert">{passwordError}</div>}
          <button type="submit" disabled={loading || !isFormValid()} className="signup-button">
            {loading ? "Signing up..." : "Sign Up"}
          </button>
          <p className="secondary-actions text-center mt-4">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleConfirmSignup} noValidate className="confirm-form">
          <input type="text" name="confirmationCode" placeholder="Confirmation Code" autoComplete="one-time-code" value={formData.confirmationCode} onChange={handleChange} required />
          <button type="submit" disabled={loading} className="confirm-button">
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
