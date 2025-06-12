// ================================================
// ✅ FILE: /frontend/src/layouts/RootLayout.jsx
// Fixed Root Layout - No Render Loops
// ================================================

import React, { Suspense, useState, useCallback, memo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // ✅ FIXED import

import Header from "./Header";
import Footer from "./Footer";
import Spinner from "../components/ui/Spinner";
import WebSocketHealthBanner from "../components/common/WebSocketHealthBanner";
import { logInfo } from "../utils/logging/logging";

// ✅ Memoized Spinner Component
const FullPageSpinner = memo(() => (
  <div 
    className="full-page-loading" 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
      color: "#1a1a1a",
      zIndex: 9999
    }}
  >
    <Spinner />
    <p style={{ marginTop: 12 }}>Loading...</p>
  </div>
));
FullPageSpinner.displayName = 'FullPageSpinner';

// ✅ Memoized Error Toast
const ErrorToast = memo(({ error, onClose }) => {
  if (!error) return null;
  
  return (
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
        zIndex: 9999,
      }}
    >
      ⚠️ {error}
      <button
        onClick={onClose}
        style={{
          marginLeft: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#721c24",
          fontWeight: "bold",
        }}
        aria-label="Close error message"
      >
        ×
      </button>
    </div>
  );
});
ErrorToast.displayName = 'ErrorToast';

// ✅ Memoized Main Content
const MainContent = memo(({ children, sidebarOpen }) => (
  <div 
    className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`} 
    style={{ flex: 1 }}
  >
    <main style={{ padding: "20px" }}>
      <Suspense fallback={<FullPageSpinner />}>
        {children}
      </Suspense>
    </main>
  </div>
));
MainContent.displayName = 'MainContent';

// ✅ Root Layout Component
const RootLayout = memo(({ children }) => {
  const location = useLocation();
  const { loggedIn, user, loading, initialized } = useAuth();
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔄 Memoized Handlers
  const handleMenuToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  // 🧠 Log auth/location changes
  React.useEffect(() => {
    logInfo("RootLayout State:", { 
      loggedIn, 
      loading, 
      initialized,
      pathname: location.pathname,
      user: user ? { id: user.id, email: user.email } : null
    });
  }, [loggedIn, loading, initialized, location.pathname, user]);

  // ⏳ Show loading state
  if (!initialized || loading) {
    return <FullPageSpinner />;
  }

  return (
    <div 
      className="App" 
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--app-bg, #fff)"
      }}
    >
      <WebSocketHealthBanner />

      <Header
        onMenuToggle={handleMenuToggle}
        user={user}
        loggedIn={loggedIn}
      />

      <MainContent sidebarOpen={sidebarOpen}>
        {children}
      </MainContent>

      <ErrorToast 
        error={error} 
        onClose={handleErrorClose}
      />

      <Footer />
    </div>
  );
});
RootLayout.displayName = 'RootLayout';

export default RootLayout;
