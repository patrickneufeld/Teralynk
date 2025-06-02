// ✅ FILE: /frontend/src/components/Login.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  memo,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../contexts/AuthContext";
import ErrorBoundary from "@/utils/logging/ErrorBoundary";
import Loader from "./ui/Loader";
import PasswordStrengthMeter from "./ui/PasswordStrengthMeter";
import { createLogger } from "../utils/logging/logging";
import "../styles/components/Login.css";

// Create logger instance
const logger = createLogger('Login');

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
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

const Login = memo(({ onLogin = () => {} }) => {
  const navigate = useNavigate();
  const { login, loginWithProvider } = useAuth();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [state, setState] = useState(INITIAL_UI_STATE);
  const [validationErrors, setValidationErrors] = useState({ email: "", password: "" });

  // Check for remembered user
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUser");
    if (remembered) {
      try {
        const { email, timestamp } = JSON.parse(remembered);
        const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000; // 7 days
        if (!isExpired) {
          setFormData(prev => ({ ...prev, email, rememberMe: true }));
        } else {
          localStorage.removeItem("rememberedUser");
        }
      } catch (err) {
        localStorage.removeItem("rememberedUser");
      }
    }
  }, []);

  // Check for blocked status
  useEffect(() => {
    const blocked = localStorage.getItem("loginBlocked");
    if (blocked) {
      try {
        const { until } = JSON.parse(blocked);
        if (Date.now() < until) {
          setState(prev => ({ ...prev, isBlocked: true }));
        } else {
          localStorage.removeItem("loginBlocked");
        }
      } catch (err) {
        localStorage.removeItem("loginBlocked");
      }
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors = { email: "", password: "" };
    let valid = true;

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
      valid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;

    setFormData(prev => ({ ...prev, [name]: inputValue }));
    setState(prev => ({ ...prev, error: "" }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCaptchaVerification = (token) => {
    if (token) {
      setState(prev => ({ ...prev, captchaVerified: true }));
    }
  };

  const handleSocialLogin = async (provider) => {
    if (state.loadingState === "loading") return;

    try {
      setState(prev => ({ ...prev, loadingState: "loading", error: "" }));
      let token;

      if (provider === "Google" && window.google) {
        const response = await new Promise((resolve, reject) => {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: resolve,
          });
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              reject(new Error("Google login failed or was dismissed"));
            }
          });
        });
        token = response?.credential;
      } else if (provider === "Facebook" && window.FB) {
        await new Promise((resolve) => window.FB.getLoginStatus(resolve));
        const fbResponse = await new Promise((resolve, reject) =>
          window.FB.login((response) => {
            if (response.authResponse) {
              resolve(response);
            } else {
              reject(new Error("Facebook login failed"));
            }
          }, { scope: "email" })
        );
        token = fbResponse.authResponse?.accessToken;
      }

      if (!token) {
        throw new Error(`${provider} authentication failed`);
      }

      const result = await loginWithProvider(provider.toLowerCase(), token);
      if (!result?.success) {
        throw new Error(result?.message || `${provider} login failed`);
      }

      setState(prev => ({ ...prev, loadingState: "success" }));
      toast.success(`Successfully logged in with ${provider}`);
      onLogin();
      navigate("/dashboard");

    } catch (err) {
      logger.error(`${provider} login failed`, err);
      setState(prev => ({
        ...prev,
        loadingState: "error",
        error: err.message || `${provider} login failed`
      }));
      toast.error(`${provider} login failed`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (state.loadingState === "loading") return;

    setState(prev => ({ ...prev, error: "" }));

    if (!validateForm()) return;

    if (state.isBlocked) {
      setState(prev => ({
        ...prev,
        error: "Too many login attempts. Please try again later."
      }));
      return;
    }

    if (state.captchaRequired && !state.captchaVerified) {
      setState(prev => ({
        ...prev,
        error: "Please complete the CAPTCHA verification."
      }));
      return;
    }

    setState(prev => ({ ...prev, loadingState: "loading" }));

    try {
      const controller = new AbortController();
      const { email, password, rememberMe } = formData;

      const loginResult = await login(email.trim(), password, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (!loginResult?.success) {
        throw new Error(loginResult?.message || "Login failed");
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedUser", JSON.stringify({
          email,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem("rememberedUser");
      }

      // Reset login attempts on success
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginBlocked");

      setState(prev => ({ ...prev, loadingState: "success" }));
      toast.success("Login successful!");
      onLogin();
      navigate("/dashboard");

    } catch (error) {
      const isAbort = error.name === "AbortError";
      const msg = isAbort ? "Request cancelled" : error.message || "Login failed";

      logger.error("Login failed", error);

      // Update login attempts
      const attempts = state.loginAttempts + 1;
      setState(prev => ({
        ...prev,
        loadingState: "error",
        error: msg,
        loginAttempts: attempts,
        captchaRequired: attempts >= 2
      }));

      // Block user after max attempts
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const blockUntil = Date.now() + BLOCK_DURATION;
        localStorage.setItem("loginBlocked", JSON.stringify({ until: blockUntil }));
        setState(prev => ({ ...prev, isBlocked: true }));
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error(msg);
      }
    }
  };

  // Render loading state
    if (state.loadingState === "loading") {
    return (
      <div className="login-loading">
        <Loader size="lg" />
        <p>Logging in...</p>
      </div>
    );
  }

  console.log("Recaptcha Key:", import.meta.env.VITE_RECAPTCHA_SITE_KEY); // 👈 INSERT HERE


  return (
    <ErrorBoundary fallback={
      <div className="error-container">
        <h3>Login Error</h3>
        <p>Something went wrong. Please try again later.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    }>
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="username"
            disabled={state.loadingState === "loading"}
            required
            className={validationErrors.email ? "error" : ""}
          />
          {validationErrors.email && (
            <div className="validation-error">{validationErrors.email}</div>
          )}

          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              type={state.showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={state.loadingState === "loading"}
              required
              className={validationErrors.password ? "error" : ""}
            />
            <button
              type="button"
              onClick={() => setState(prev => ({ 
                ...prev, 
                showPassword: !prev.showPassword 
              }))}
              disabled={state.loadingState === "loading"}
              className="toggle-password"
              aria-label={state.showPassword ? "Hide password" : "Show password"}
            >
              {state.showPassword ? "Hide" : "Show"}
            </button>
          </div>
          
          <PasswordStrengthMeter strength={state.passwordStrength} />
          
          {validationErrors.password && (
            <div className="validation-error">{validationErrors.password}</div>
          )}

          <label className="remember-me">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={state.loadingState === "loading"}
            />
            Remember Me
          </label>

          {state.captchaRequired && (
            <div className="captcha-wrapper">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaVerification}
              />
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={state.loadingState === "loading" || state.isBlocked}
          >
            {state.loadingState === "loading" ? (
              <Loader size="sm" />
            ) : (
              "Login"
            )}
          </button>

          <div className="login-links">
            <Link to="/reset" className="forgot-password">
              Forgot Password?
            </Link>
            <Link to="/signup" className="create-account">
              Create Account
            </Link>
          </div>

          {!state.isBlocked && (
            <div className="social-login">
              {SOCIAL_PROVIDERS.map(({ name, Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSocialLogin(name)}
                  className="social-login-button"
                  disabled={state.loadingState === "loading"}
                >
                  <Icon /> Login with {name}
                </button>
              ))}
            </div>
          )}

          {state.error && (
            <div className="login-error" role="alert">
              {state.error}
            </div>
          )}

          {state.isBlocked && (
            <div className="blocked-message" role="alert">
              Account temporarily locked due to too many failed attempts.
              Please try again later or reset your password.
            </div>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
});

Login.displayName = "Login";
export default Login;
