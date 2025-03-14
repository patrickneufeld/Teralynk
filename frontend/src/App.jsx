// File: /src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import SecretsFetcher from "./components/SecretsFetcher";
import Home from "./components/Home";
import About from "./components/About"; // <-- Add this line to import the About component
import Contact from "./components/Contact";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Login from "./components/Login";
import Signup from "./components/Signup";
import WorkflowPage from "./pages/WorkflowPage";
import FileSearch from "./components/FileSearch";
import FileVersioning from "./components/FileVersioning";
import FileSearchReplace from "./components/FileSearchReplace";
import LogPage from "./components/LogPage";
import BusinessProposal from "./components/BusinessProposal";
import Marketplace from "./components/Marketplace";
import StorageManager from "./components/StorageManagement";
import AIQuery from "./components/AITools";
import Troubleshooting from "./components/Troubleshooting";
import AdminDashboard from "./components/AdminDashboard";
import Notifications from "./components/Notifications";
import PerformanceDashboard from "./components/PerformanceDashboard";
import OptimizationApproval from "./components/OptimizationApproval";
import AIAssistant from "./components/AIAssistant";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Spinner from "./components/ui/Spinner";

// ✅ Styles
import "./styles/global/index.css";
import "./styles/components/About.css";
import "./styles/components/Contact.css";
import "./styles/components/Dashboard.css";
import "./styles/components/Profile.css";
import "./styles/components/Settings.css";
import "./styles/components/Login.css";
import "./styles/components/Footer.css";
import "./styles/components/Signup.css";
import "./styles/components/Marketplace.css";
import "./styles/components/StorageManagement.css";
import "./styles/components/Admin.css";
import "./styles/components/Troubleshooting.css";
import "./styles/components/Notifications.css";
import "./styles/components/PerformanceDashboard.css";
import "./styles/components/OptimizationApproval.css";

function App() {
  return (
    <SecretsFetcher>
      <AuthProvider>
        <ErrorBoundary>
          <MainApp />
        </ErrorBoundary>
      </AuthProvider>
    </SecretsFetcher>
  );
}

function MainApp() {
  const { loggedIn, user, loading, checkAuthStatus, handleLogout } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure authentication status is checked on mount
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogin = (authToken) => {
    try {
      localStorage.setItem("authToken", authToken);
      console.log("✅ User logged in successfully. Token saved:", authToken);
      checkAuthStatus(); // Refresh authentication state
    } catch (e) {
      console.error("Error handling login:", e);
      setError("Failed to process login. Please try again.");
    }
  };

  const handleError = (message) => {
    setError(message);
    console.error("Error:", message);
  };

  if (loading) {
    return (
      <div className="loading">
        <Spinner />
        <p>Loading... Please wait.</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header loggedIn={loggedIn} handleLogout={handleLogout} />
      <div className="main-container">
        <main>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <Home />
                </ErrorBoundary>
              }
            />
            <Route path="/about" element={<About />} /> {/* About route */}
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={
                !loggedIn ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !loggedIn ? <Signup /> : <Navigate to="/dashboard" replace />
              }
            />

            {/* Protected Routes */}
            {loggedIn && (
              <>
                <Route
                  path="/dashboard"
                  element={<Dashboard user={user} />}
                />
                {/* Other protected routes */}
              </>
            )}

            {/* Catch-All Route */}
            <Route
              path="*"
              element={<Navigate to={loggedIn ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </main>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <Footer />
    </div>
  );
}

export default App;
