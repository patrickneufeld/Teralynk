// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Settings.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/components/Settings.css"; // ✅ Ensure correct CSS path

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Settings() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [theme, setTheme] = useState("light");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ Load current user settings on component mount
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token missing.");

                console.log(`🔍 Fetching user settings: ${BACKEND_URL}/api/user/settings`);

                const response = await axios.get(`${BACKEND_URL}/api/user/settings`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                if (response.data) {
                    setEmailNotifications(response.data.emailNotifications);
                    setTheme(response.data.theme);
                } else {
                    setError("No settings found.");
                }
            } catch (err) {
                console.error("❌ Settings Fetch Error:", err);
                setError("Failed to load settings. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // ✅ Handle Save Settings
    const handleSaveSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token missing.");

            console.log(`🔍 Saving user settings: ${BACKEND_URL}/api/user/settings`);

            await axios.post(
                `${BACKEND_URL}/api/user/settings`,
                { emailNotifications, theme },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );

            alert("✅ Settings saved successfully!");
        } catch (err) {
            console.error("❌ Settings Save Error:", err);
            setError("Error saving settings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="settings-container">Loading...</div>;

    return (
        <div className="settings-container">
            <h2>User Settings</h2>
            {error && <p className="error">⚠️ {error}</p>}

            <div className="settings-option">
                <label>Email Notifications</label>
                <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                />
            </div>

            <div className="settings-option">
                <label>Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>

            <button className="save-button" onClick={handleSaveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
            </button>
        </div>
    );
}

export default Settings;
