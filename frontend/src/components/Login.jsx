// File: /frontend/src/components/Login.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../contexts/AuthContext";
import ErrorBoundary from "./ErrorBoundary";
import Loader from "./ui/Loader";
import PasswordStrengthMeter from "./ui/PasswordStrengthMeter";
import { logError, logInfo } from "../utils/logging/logging";

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

const Login = memo(({ onLogin = () => {} }) => {
  const navigate = useNavigate();
  const { login, loginWithProvider } = useAuth();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [state, setState] = useState(INITIAL_UI_STATE);
  const [validationErrors, setValidationErrors] = useState({ email: "", password: "" });

  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    const controller = abortControllerRef.current;
    return () => controller.abort();
  }, []);

  const validateForm = useCallback(() => {
    const errors = { email: "", password: "" };
    let valid = true;

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !email.includes("@")) {
      errors.email = "Enter a valid email address";
      valid = false;
    }

    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: inputValue }));
    setState((prev) => ({ ...prev, error: "" }));
  };

  const handleCaptchaVerification = () => {
    setState((prev) => ({ ...prev, captchaVerified: true }));
  };

  const handleForgotPassword = () => {
    navigate("/reset");
  };

  const handleSocialLogin = async (provider) => {
    try {
      setState((prev) => ({ ...prev, loadingState: "loading" }));
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
        await new Promise((resolve, reject) =>
          window.FB.login((response) => {
            if (response.authResponse) {
              token = response.authResponse.accessToken;
              resolve();
            } else {
              reject(new Error("Facebook login failed"));
            }
          }, { scope: "email" })
        );
      }

      if (!token) throw new Error(`${provider} login token not found`);

      await loginWithProvider(provider, token);
      toast.success(`Logged in with ${provider}`);
      onLogin();
    } catch (err) {
      logError(err, "Login.Social");
      toast.error(`Login with ${provider} failed`);
      setState((prev) => ({
        ...prev,
        loadingState: "error",
        error: err.message,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setState((prev) => ({ ...prev, error: "" }));
    if (!validateForm()) return;

    const { email, password, rememberMe } = formData;
    const cleanEmail = email.trim();

    if (state.isBlocked) {
      setState((prev) => ({
        ...prev,
        error: "Too many login attempts. Please try again later.",
      }));
      return;
    }

    if (state.captchaRequired && !state.captchaVerified) {
      setState((prev) => ({
        ...prev,
        error: "Please complete the CAPTCHA verification.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loadingState: "loading" }));

    try {
      const loginResult = await login(cleanEmail, password, {
        usernameOverride: true,
        signal: abortControllerRef.current.signal,
      });

      if (!loginResult?.success) throw new Error(loginResult?.message || "Login failed");

      if (rememberMe) {
        localStorage.setItem("rememberedUser", JSON.stringify({ email: cleanEmail, timestamp: Date.now() }));
      } else {
        localStorage.removeItem("rememberedUser");
      }

      setState((prev) => ({ ...prev, loadingState: "success" }));
      toast.success("Login successful!");
      onLogin();
    } catch (error) {
      const isAbort = error.name === "AbortError";
      const msg = isAbort ? "Request cancelled" : error.message || "Login failed";

      logError(error, "Login.Submit");

      setState((prev) => ({
        ...prev,
        loadingState: "error",
        error: msg,
        loginAttempts: prev.loginAttempts + 1,
        captchaRequired: prev.loginAttempts >= 2,
      }));

      toast.error(msg);
    }
  };

  return (
    <ErrorBoundary fallback={() => <div>Something went wrong. Please try again.</div>}>
      <div className="login-container" data-testid="login-form">
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={state.loadingState === "loading"}
              autoComplete="username"
              required
              className={validationErrors.email ? "error" : ""}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <span id="email-error" className="validation-error">
                {validationErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={state.showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={state.loadingState === "loading"}
                autoComplete="current-password"
                required
                className={validationErrors.password ? "error" : ""}
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setState((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                }
                aria-label={state.showPassword ? "Hide password" : "Show password"}
                disabled={state.loadingState === "loading"}
              >
                {state.showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {validationErrors.password && (
              <span id="password-error" className="validation-error">
                {validationErrors.password}
              </span>
            )}
            <PasswordStrengthMeter strength={state.passwordStrength} />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={state.loadingState === "loading"}
              />
              Remember me
            </label>
          </div>

          {state.captchaRequired && (
            <div className="captcha-container">
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
            aria-busy={state.loadingState === "loading"}
          >
            {state.loadingState === "loading" ? (
              <>
                <Loader size="sm" />
                <span className="sr-only">Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* ✅ Added navigational links here */}
          <div className="secondary-actions mt-4 space-x-4 text-sm text-center">
            <Link to="/reset" className="text-blue-600 hover:underline">
              Forgot Password?
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>

          <div className="social-login-container mt-6">
            {SOCIAL_PROVIDERS.map(({ name, Icon }) => (
              <button
                key={name.toLowerCase()}
                type="button"
                className={`social-login-button ${name.toLowerCase()}`}
                onClick={() => handleSocialLogin(name)}
                disabled={state.loadingState === "loading"}
                aria-label={`Login with ${name}`}
              >
                <Icon />
                <span>Login with {name}</span>
              </button>
            ))}
          </div>

          {state.error && (
            <div className="error-message" role="alert">
              {state.error}
            </div>
          )}
          {state.isBlocked && (
            <div className="blocked-message" role="alert">
              Account temporarily blocked. Please try again later.
            </div>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
});

Login.displayName = "Login";

export default Login;
