// ================================================
// ✅ FILE: /frontend/src/App.jsx
// Fully Integrated App Shell with Routing, Auth, and Layout
// ================================================

import React, {
  useEffect,
  useMemo,
  useState,
  Suspense,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./utils/logging/ErrorBoundary";
import SecretsFetcher from "./components/SecretsFetcher";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import Spinner from "./components/ui/Spinner";
import WebSocketHealthBanner from "./components/common/WebSocketHealthBanner";

import routeConfig from "./routes/config";
import RouteRenderer from "./components/RouteRenderer";
import * as TokenManager from '@/utils/tokenManager';
import { logError, logInfo } from "./utils/logging/logging";

// =====================================
// 🔄 Full-Screen Loading Spinner
// =====================================
const FullPageSpinner = () => (
  <div
    className="full-page-loading"
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#ffffff",
      color: "#1a1a1a",
    }}
  >
    <Spinner />
    <p style={{ marginTop: "12px" }}>Loading...</p>
    <p
      style={{
        marginTop: "16px",
        fontSize: "12px",
        color: "#666",
      }}
    >
      If this screen persists, there may be an issue with the application.
    </p>
  </div>
);

// =====================================
// 🧭 Flatten Routes from config
// =====================================
const flattenRoutes = () => {
  const publicRoutes = [];
  const protectedRoutes = [];
  if (routeConfig.public) publicRoutes.push(...routeConfig.public);
  if (routeConfig.protected) {
    Object.values(routeConfig.protected).forEach((group) =>
      protectedRoutes.push(...group)
    );
  }
  return { publicRoutes, protectedRoutes };
};

// =====================================
// 🔒 Authenticated App Content
// =====================================
function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedIn, user, loading, status, setUser } = useAuth();

  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { publicRoutes, protectedRoutes } = useMemo(flattenRoutes, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleLogin = useCallback(
    (authResult) => {
      try {
        const { accessToken, refreshToken } = authResult;
        if (!accessToken || !refreshToken)
          throw new Error("Missing access or refresh token");

        tokenManager.setToken(accessToken);
        tokenManager.setRefreshToken(refreshToken);

        const userData = tokenManager.decodeToken(accessToken);
        setUser(userData);
        navigate("/dashboard");
      } catch (err) {
        logError("Login handler error", err);
        setError("Login failed. Please try again.");
      }
    },
    [navigate, setUser]
  );

  useEffect(() => {
    setInitialCheckComplete(true);
  }, []);

  if (loading || !initialCheckComplete || status === "checking") {
    return <FullPageSpinner />;
  }

  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--app-bg, #ffffff)",
      }}
    >
      <WebSocketHealthBanner />
      <Header onMenuToggle={toggleSidebar} />

      <div
        className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`}
        style={{ flex: 1 }}
      >
        <main style={{ padding: "20px" }}>
          <Suspense fallback={<FullPageSpinner />}>
            <ErrorBoundary>
              <RouteRenderer
                routes={publicRoutes.map((route) =>
                  route.path === "/login"
                    ? {
                        ...route,
                        component: (props) => (
                          <route.component {...props} onLogin={handleLogin} />
                        ),
                      }
                    : route
                )}
                isProtected={false}
              />
              {loggedIn && user && (
                <RouteRenderer routes={protectedRoutes} isProtected />
              )}
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>

      {error && (
        <div
          className="error-toast"
          role="alert"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "10px 20px",
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            className="dismiss-button"
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#721c24",
              fontWeight: "bold",
            }}
          >
            ×
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

// =====================================
// 🧠 Root App Export (Wrap All Providers)
// =====================================
export default function App() {
  logInfo("🚀 App root initializing");
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <SecretsFetcher>
              <AppInner />
            </SecretsFetcher>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
