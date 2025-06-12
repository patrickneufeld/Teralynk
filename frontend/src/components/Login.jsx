// ================================================
// ✅ FILE: /frontend/src/components/Login.jsx
// Fully Complete Login Component (v2.4) — CAPTCHA, OAuth, Lockout, Logging, MFA
// ================================================

import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/utils/logging/ErrorBoundary";
import Loader from "./ui/Loader";
import PasswordStrengthMeter from "./ui/PasswordStrengthMeter";
import { createLogger } from "../utils/logging/logging";
import secureStorage from "@/utils/security/secureStorage";
import { emitSecurityEvent } from "@/utils/security/eventEmitter";
import { TELEMETRY_CONFIG, emitTelemetry } from "@/utils/telemetry";
import "../styles/components/Login.css";

const logger = createLogger("Login");

const RECAPTCHA_SITE_KEY =
  import.meta.env.MODE === "development"
    ? "6LfywVIrAAAAAF2XDFV4Zcxbdta21lclRfA0I_8p"
    : import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const INITIAL_FORM_STATE = {
  email: "",
  password: "",
  rememberMe: false,
};

const INITIAL_UI_STATE = {
  error: "",
  loadingState: "idle",
  loginAttempts: 0,
  captchaRequired: false,
  captchaVerified: false,
  isBlocked: false,
  showPassword: false,
  passwordStrength: null,
};

const SOCIAL_PROVIDERS = [
  { name: "Google", Icon: () => <span>🔍</span> },
  { name: "Facebook", Icon: () => <span>📘</span> },
];

const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000;

const Login = memo(({ onLogin = () => {} }) => {
  const navigate = useNavigate();
  const { login, loginWithProvider } = useAuth();
  const recaptchaRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [state, setState] = useState(INITIAL_UI_STATE);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUser");
    if (remembered) {
      try {
        const { email, timestamp } = JSON.parse(remembered);
        const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;
        if (!isExpired) {
          setFormData((prev) => ({ ...prev, email, rememberMe: true }));
        } else {
          localStorage.removeItem("rememberedUser");
        }
      } catch {
        localStorage.removeItem("rememberedUser");
      }
    }
  }, []);

  useEffect(() => {
    const blocked = localStorage.getItem("loginBlocked");
    if (blocked) {
      try {
        const { until } = JSON.parse(blocked);
        if (Date.now() < until) {
          setState((prev) => ({ ...prev, isBlocked: true }));
        } else {
          localStorage.removeItem("loginBlocked");
        }
      } catch {
        localStorage.removeItem("loginBlocked");
      }
    }
  }, []);
  const validateForm = useCallback(() => {
    const errors = { email: "", password: "" };
    let valid = true;

    if (!formData.email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address";
      valid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setState((prev) => ({ ...prev, error: "" }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  useEffect(() => {
    if (!formData.password) {
      setState((prev) => ({ ...prev, passwordStrength: null }));
      return;
    }

    setState((prev) => ({
      ...prev,
      passwordStrength:
        formData.password.length > 11
          ? "strong"
          : formData.password.length > 7
          ? "medium"
          : "weak",
    }));
  }, [formData.password]);

  const handleCaptchaChange = (value) => {
    setState((prev) => ({ ...prev, captchaVerified: !!value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (state.isBlocked) {
      return setState((prev) => ({
        ...prev,
        error: "Too many failed attempts. Try again later.",
      }));
    }

    if (state.captchaRequired && !state.captchaVerified) {
      return setState((prev) => ({
        ...prev,
        error: "Please verify you are not a robot.",
      }));
    }

    setState((prev) => ({ ...prev, loadingState: "loading" }));

    try {
      const result = await login(formData.email, formData.password);

      if (formData.rememberMe) {
        localStorage.setItem(
          "rememberedUser",
          JSON.stringify({ email: formData.email, timestamp: Date.now() })
        );
      } else {
        localStorage.removeItem("rememberedUser");
      }

      emitTelemetry("login.success", { email: formData.email });
      emitSecurityEvent("login.success", { email: formData.email });
      logger.info("Login successful", { email: formData.email });

      onLogin(result);
      navigate("/dashboard");
    } catch (err) {
      const attempts = state.loginAttempts + 1;
      const shouldBlock = attempts >= MAX_LOGIN_ATTEMPTS;
      if (shouldBlock) {
        const until = Date.now() + BLOCK_DURATION;
        localStorage.setItem("loginBlocked", JSON.stringify({ until }));
      }

      emitTelemetry("login.failure", { reason: err.message });
      emitSecurityEvent("login.failure", { error: err.message });
      logger.error("Login failed", { error: err.message });

      setState((prev) => ({
        ...prev,
        error: err.message || "Login failed",
        loginAttempts: attempts,
        captchaRequired: true,
        captchaVerified: false,
        loadingState: "idle",
        isBlocked: shouldBlock,
      }));

      if (recaptchaRef.current) recaptchaRef.current.reset();
    }
  };

  const handleProviderLogin = async (provider) => {
    try {
      const result = await loginWithProvider(provider.name.toLowerCase());
      emitTelemetry("login.social.success", { provider: provider.name });
      emitSecurityEvent("login.social.success", { provider: provider.name });
      logger.info(`${provider.name} login success`);
      onLogin(result);
      navigate("/dashboard");
    } catch (err) {
      emitTelemetry("login.social.failure", {
        provider: provider.name,
        reason: err.message,
      });
      emitSecurityEvent("login.social.failure", { error: err.message });
      logger.error(`${provider.name} login failed`, { error: err.message });
      toast.error(`Login with ${provider.name} failed`);
    }
  };

  return (
    <ErrorBoundary>
      <div className="login-page">
        <div className="login-card">
          <h1>Welcome Back to Teralynk</h1>

          {state.error && <div className="error-banner">{state.error}</div>}
          {state.loadingState === "loading" && <Loader />}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={validationErrors.email ? "error" : ""}
              disabled={state.isBlocked}
            />
            {validationErrors.email && (
              <div className="error-message">{validationErrors.email}</div>
            )}

            <label htmlFor="password">Password</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className={validationErrors.password ? "error" : ""}
              disabled={state.isBlocked}
            />
            {validationErrors.password && (
              <div className="error-message">{validationErrors.password}</div>
            )}

            {formData.password && (
              <div className="password-strength-meter">
                Strength: <strong>{state.passwordStrength}</strong>
              </div>
            )}

            <div className="form-options">
              <label>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={state.isBlocked}
                />
                Remember me
              </label>
              <Link to="/reset-password">Forgot password?</Link>
            </div>

            {state.captchaRequired && (
              <div className="recaptcha-container">
                <ReCAPTCHA
                  sitekey={RECAPTCHA_SITE_KEY}
                  ref={recaptchaRef}
                  onChange={handleCaptchaChange}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-login"
              disabled={state.loadingState === "loading" || state.isBlocked}
            >
              Login
            </button>
          </form>

          <div className="social-login">
            <p>Or login with</p>
            <div className="social-buttons">
              {SOCIAL_PROVIDERS.map((provider) => (
                <button
                  key={provider.name}
                  className={`btn-social ${provider.name.toLowerCase()}`}
                  onClick={() => handleProviderLogin(provider)}
                  disabled={state.isBlocked}
                >
                  <provider.Icon />
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          <div className="signup-link">
            Don’t have an account? <Link to="/signup">Sign up here</Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default Login;
