// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Dashboard.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../utils/tokenUtils";
import "../styles/components/Dashboard.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Dashboard() {
  const { user, checkAuthStatus } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("User not authenticated.");
      return;
    }

    try {
      const token = getToken(); // ✅ Use secure tokenUtils method
      if (!token) {
        throw new Error("Missing authentication token. Please log in again.");
      }

      console.log(`🔍 Fetching user data from: ${BACKEND_URL}/api/user-data`);

      const response = await fetch(`${BACKEND_URL}/api/user-data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // ✅ Optional: remove if not using cookies on backend
        credentials: "include",
      });

      if (response.status === 401) {
        console.warn("🔄 Token expired. Attempting to refresh...");
        const refreshed = await checkAuthStatus();
        if (!refreshed) {
          throw new Error("Session expired. Please log in again.");
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      console.error("❌ Error fetching user data:", err);
      setError(err.message || "Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, checkAuthStatus]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <div className="dashboard">
      <h2>Welcome, {user?.username || "User"}! 🎉</h2>

      {loading && (
        <div className="dashboard-loading" aria-live="polite">
          Loading your dashboard...
        </div>
      )}

      {error && (
        <div className="dashboard-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && userData ? (
        <div className="user-details">
          <h3>Your Profile</h3>
          <p>
            <strong>Name:</strong> {userData.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {userData.email || "N/A"}
          </p>
          <p>
            <strong>Member Since:</strong>{" "}
            {userData.memberSince
              ? new Date(userData.memberSince).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      ) : (
        !loading && !error && <p>No user data available.</p>
      )}
    </div>
  );
}

export default Dashboard;
