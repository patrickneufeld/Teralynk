import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ✅ ProtectedRoute Component
 * Ensures only authenticated users can access specific routes.
 */
const ProtectedRoute = ({ redirectPath = "/login" }) => {
  const { user, loading } = useAuth();

  // Show a loading state while authentication is being verified
  if (loading) {
    return (
      <div className="loading">
        <p>Loading... Please wait.</p>
      </div>
    );
  }

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    console.warn("⚠️ Access denied: User is not authenticated. Redirecting to login.");
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated, render the protected components
  return <Outlet />;
};

export default ProtectedRoute;
