// File: /frontend/src/App.jsx

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
import ErrorBoundary from "./components/ErrorBoundary";
import SecretsFetcher from "./components/SecretsFetcher";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import Spinner from "./components/ui/Spinner";
import WebSocketHealthBanner from "./components/common/WebSocketHealthBanner";

import routeConfig from "./routes/config";
import RouteRenderer from "./components/RouteRenderer";
import { decodeToken, setToken, setRefreshToken } from "./utils/tokenUtils";
import { logError } from "./utils/logging/logging";

// Debug logging function
const debugLog = (message, data = {}) => {
  console.log(`[DEBUG] ${message}`, data);
  // Add visual indicator on the page for debugging
  const debugElement = document.getElementById('debug-log');
  if (debugElement) {
    const entry = document.createElement('div');
    entry.textContent = `${new Date().toISOString()} - ${message}`;
    debugElement.appendChild(entry);
  } else if (document.body) {
    const newDebugElement = document.createElement('div');
    newDebugElement.id = 'debug-log';
    newDebugElement.style.position = 'fixed';
    newDebugElement.style.bottom = '0';
    newDebugElement.style.left = '0';
    newDebugElement.style.right = '0';
    newDebugElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
    newDebugElement.style.color = 'white';
    newDebugElement.style.padding = '10px';
    newDebugElement.style.zIndex = '9999';
    newDebugElement.style.maxHeight = '200px';
    newDebugElement.style.overflow = 'auto';
    const entry = document.createElement('div');
    entry.textContent = `${new Date().toISOString()} - ${message}`;
    newDebugElement.appendChild(entry);
    document.body.appendChild(newDebugElement);
  }
};

// ✅ Full-page loading spinner
const FullPageSpinner = () => {
  debugLog("Rendering FullPageSpinner");
  return (
    <div className="full-page-loading" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: 'white'
    }}>
      <Spinner />
      <p>Loading...</p>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        If this screen persists, there might be an issue with the application.
      </p>
    </div>
  );
};

// ✅ Flatten route config into public/protected arrays
const flattenRoutes = () => {
  debugLog("Flattening routes");
  const publicRoutes = [];
  const protectedRoutes = [];

  if (routeConfig.public) publicRoutes.push(...routeConfig.public);

  if (routeConfig.protected) {
    Object.values(routeConfig.protected).forEach((group) => {
      protectedRoutes.push(...group);
    });
  }

  debugLog(`Routes flattened: ${publicRoutes.length} public, ${protectedRoutes.length} protected`);
  return { publicRoutes, protectedRoutes };
};

// ✅ Core Application Component
function AppInner() {
  debugLog("AppInner initializing");
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedIn, user, loading, status, setUser, logout } = useAuth();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  debugLog(`Auth state: loggedIn=${loggedIn}, loading=${loading}, status=${status}`);

  const { publicRoutes, protectedRoutes } = useMemo(flattenRoutes, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleLogin = useCallback(
    (authResult) => {
      debugLog("Login handler called", { authResult: !!authResult });
      try {
        const { accessToken, refreshToken } = authResult;
        if (!accessToken || !refreshToken) {
          throw new Error("Missing access or refresh token");
        }

        setToken(accessToken);
        setRefreshToken(refreshToken);

        const decoded = decodeToken(accessToken);
        const userData = {
          ...decoded,
          permissions: decoded["custom:permissions"]
            ? decoded["custom:permissions"].split(",")
            : [],
        };

        setUser(userData);
        navigate("/dashboard");
      } catch (err) {
        logError(err, "App.LoginHandler");
        setError("Login failed. Please try again.");
      }
    },
    [navigate, setUser]
  );

  useEffect(() => {
    debugLog("Setting initialCheckComplete to true");
    setInitialCheckComplete(true);
  }, []);

  // ✅ Auto-redirect from "/" to dashboard if authenticated
  useEffect(() => {
    if (!loading && loggedIn && location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [loading, loggedIn, location.pathname, navigate]);

  if (loading || !initialCheckComplete || status === "checking") {
    debugLog("Showing loading spinner", { loading, initialCheckComplete, status });
    return <FullPageSpinner />;
  }

  debugLog("Rendering main app content", { user: !!user });
  
  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ✅ WebSocket health check banner */}
      <WebSocketHealthBanner />

      <Header onMenuToggle={toggleSidebar} />

      <div className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`} style={{ flex: 1 }}>
        <main style={{ padding: '20px' }}>
          <Suspense fallback={<FullPageSpinner />}>
            <ErrorBoundary>
              {/* Debug info */}
              <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3>Debug Info</h3>
                <p>User authenticated: {loggedIn ? 'Yes' : 'No'}</p>
                <p>Status: {status}</p>
                <p>Public routes: {publicRoutes.length}</p>
                <p>Protected routes: {protectedRoutes.length}</p>
              </div>
              
              {/* Public Routes */}
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

              {/* Protected Routes */}
              <RouteRenderer routes={protectedRoutes} isProtected />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>

      {/* Error toast message */}
      {error && (
        <div className="error-toast" role="alert" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div className="error-content">
            ⚠️ {error}
            <button 
              onClick={() => setError(null)} 
              className="dismiss-button"
              style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ✅ App wrapped in context and error handling providers
export default function App() {
  debugLog("App component initializing");
  
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
