// ================================================
// ✅ FILE: /frontend/src/App.jsx
// Enterprise Application Root - Fixed Version
// ================================================

import React, { Suspense, useEffect, memo, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import RootLayout from "./layouts/RootLayout";
import routeConfig from "./routes/config";
import { useAuth } from "./contexts/AuthContext";
import { logInfo, logError } from "./utils/logging/index.js";
import Dashboard from "./components/Dashboard";

// =====================================
// ✅ Memoized Loading Spinner
// =====================================
const LoadingSpinner = memo(() => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10000,
    minHeight: '100vh'
  }}>
    <div style={{
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      width: 48,
      height: 48,
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ marginTop: 24, fontWeight: 500, color: '#374151' }}>Loading…</p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}
    </style>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// =====================================
// ✅ Memoized Protected Route
// =====================================
const ProtectedRoute = memo(({ element: Element, permissions }) => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      console.log("Not authenticated, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [loggedIn, navigate]);

  if (!loggedIn) {
    return <LoadingSpinner />;
  }

  return <Element />;
});

ProtectedRoute.displayName = 'ProtectedRoute';

// =====================================
// ✅ Memoized Routes Component
// =====================================
const AppRoutes = memo(() => {
  const { loggedIn } = useAuth();
  console.log("AppRoutes - Authentication state:", loggedIn);

  // Handle public routes
  const publicRoutes = Array.isArray(routeConfig.public) 
    ? routeConfig.public.map(route => (
        <Route
          key={route.path}
          path={route.path}
          element={<route.element />}
        />
      ))
    : [];

  return (
    <Routes>
      {/* Add a direct route to Dashboard for testing */}
      <Route 
        path="/dashboard" 
        element={loggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      
      {/* File management routes */}
      <Route 
        path="/files" 
        element={loggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/upload" 
        element={loggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/storage" 
        element={loggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      
      {publicRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
});

AppRoutes.displayName = 'AppRoutes';

// =====================================
// ✅ App Component Root
// =====================================
const App = memo(() => {
  const location = useLocation();
  const auth = useAuth();
  const navigate = useNavigate();

  // Log location changes
  useEffect(() => {
    logInfo("App location changed:", location.pathname);
  }, [location.pathname]);

  // Debug authentication state
  useEffect(() => {
    console.log("App - Auth state:", { 
      loggedIn: auth.loggedIn,
      user: auth.user,
      pathname: location.pathname
    });
    
    // Redirect to dashboard if authenticated and on login page
    if (auth.loggedIn && location.pathname === '/login') {
      console.log("Redirecting to dashboard from login page");
      navigate('/dashboard');
    }
  }, [auth.loggedIn, auth.user, location.pathname, navigate]);

  // Memoize meta content
  const metaContent = useMemo(() => (
    <Helmet>
      <title>Teralynk Platform</title>
      <meta 
        name="description" 
        content="Teralynk: Unified AI-driven file storage and productivity platform." 
      />
    </Helmet>
  ), []);

  return (
    <>
      {metaContent}
      <RootLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <AppRoutes />
        </Suspense>
      </RootLayout>
    </>
  );
});

App.displayName = 'App';

export default App;
