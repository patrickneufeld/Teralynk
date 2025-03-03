// ✅ FILE: frontend/src/components/Dashboard.jsx

import React, { useEffect, useState } from "react";
import "../styles/components/Dashboard.css"; // ✅ Import styles

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Dashboard({ user }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setError("User not authenticated.");
            return;
        }

        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Missing authentication token.");
                }

                console.log(`🔍 Fetching user data from: ${BACKEND_URL}/api/user-data`);

                const response = await fetch(`${BACKEND_URL}/api/user-data`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status: ${response.status}`);
                }

                const data = await response.json();
                setUserData(data);
            } catch (err) {
                console.error("❌ Error fetching user data:", err);
                setError("Failed to load user data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]); // ✅ Dependency array to re-run if user changes

    return (
        <div className="dashboard">
            <h2>Welcome, {user?.username || "User"}! 🎉</h2>

            {loading && <div className="dashboard-loading" aria-live="polite">Loading your dashboard...</div>}
            {error && <div className="dashboard-error" role="alert">⚠️ {error}</div>}

            {!loading && !error && userData ? (
                <div className="user-details">
                    <h3>Your Profile</h3>
                    <p><strong>Name:</strong> {userData.name || "N/A"}</p>
                    <p><strong>Email:</strong> {userData.email || "N/A"}</p>
                    <p><strong>Member Since:</strong> {userData.memberSince ? new Date(userData.memberSince).toLocaleDateString() : "N/A"}</p>
                </div>
            ) : (
                !loading && !error && <p>No user data available.</p>
            )}
        </div>
    );
}

export default Dashboard;
