// ✅ FILE: /Users/patrick/Teralynk/frontend/src/components/Profile.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/components/Profile.css"; // ✅ Ensure correct path to CSS file

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Profile() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token is missing.");

                console.log(`🔍 Fetching user profile: ${BACKEND_URL}/api/profile`);

                const response = await axios.get(`${BACKEND_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                if (response.data) {
                    setUserData(response.data);
                } else {
                    setError("No user data found.");
                }
            } catch (err) {
                console.error("❌ Profile Fetch Error:", err);
                setError("Failed to load profile information. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    if (loading) return <div className="profile-container">Loading profile...</div>;
    if (error) return <div className="profile-container error">⚠️ {error}</div>;

    return (
        <div className="profile-container">
            <h2>User Profile</h2>
            <div className="profile-field">
                <strong>Name:</strong> {userData?.name || "Not available"}
            </div>
            <div className="profile-field">
                <strong>Email:</strong> {userData?.email || "Not available"}
            </div>
            <div className="profile-field">
                <strong>Joined:</strong> {userData?.joined ? new Date(userData.joined).toLocaleDateString() : "Not available"}
            </div>
        </div>
    );
}

export default Profile;
