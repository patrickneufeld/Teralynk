// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Settings.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import { logError, getErrorMessage } from "../utils/ErrorHandler";
import { getToken } from "../utils/tokenUtils"; // ✅ Secure token access
import "../styles/components/Settings.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [autoSave, setAutoSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const settingsRef = useRef({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Token missing.");

      const response = await axios.get(`${BACKEND_URL}/api/user/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { emailNotifications, theme, language } = response.data || {};

      setEmailNotifications(emailNotifications ?? true);
      setTheme(theme || "light");
      setLanguage(language || "en");
      settingsRef.current = { emailNotifications, theme, language };
    } catch (err) {
      logError(err, "Settings - fetchSettings");
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();
      if (!token) throw new Error("Token missing.");

      const payload = { emailNotifications, theme, language };

      const response = await axios.post(`${BACKEND_URL}/api/user/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 204) {
        setSuccess("✅ Settings saved successfully!");
        settingsRef.current = payload;
      } else {
        throw new Error("Settings save failed.");
      }
    } catch (err) {
      logError(err, "Settings - saveSettings");
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setter) => (value) => {
    setter(value);
    if (autoSave) saveSettings();
  };

  const handleToggle = (setter, current) => () => {
    setter(!current);
    if (autoSave) saveSettings();
  };

  return (
    <div className="settings-container">
      <h2 className="text-2xl font-bold mb-4">⚙️ User Settings</h2>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      {success && <Alert type="success" className="mb-4">{success}</Alert>}
      {loading && <p className="loading-text">Loading...</p>}

      <div className="settings-option">
        <label>Email Notifications</label>
        <input
          type="checkbox"
          checked={emailNotifications}
          onChange={handleToggle(setEmailNotifications, emailNotifications)}
        />
      </div>

      <div className="settings-option">
        <label>Theme</label>
        <Select value={theme} onChange={(e) => handleSettingChange(setTheme)(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </Select>
      </div>

      <div className="settings-option">
        <label>Language</label>
        <Select value={language} onChange={(e) => handleSettingChange(setLanguage)(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </Select>
      </div>

      <div className="settings-option">
        <label>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          Auto Save on Change
        </label>
      </div>

      <Button
        className="save-button"
        onClick={saveSettings}
        disabled={loading || autoSave}
      >
        {loading ? "Saving..." : "💾 Save Settings"}
      </Button>
    </div>
  );
}
