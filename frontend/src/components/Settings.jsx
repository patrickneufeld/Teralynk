// File: /frontend/src/components/Settings.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

import Input from "./ui/Input";
import Select from "./ui/Select";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Loader from "./ui/Loader";

import { logError, getErrorMessage } from "../utils/ErrorHandler";
import { getToken } from "../utils/tokenUtils";

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
    <div className="settings-container max-w-xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4 text-center">⚙️ User Settings</h2>

      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}
      {loading && <Loader className="mb-4" />}

      <div className="settings-option mb-4">
        <label className="block font-medium mb-1">Email Notifications</label>
        <input
          type="checkbox"
          checked={emailNotifications}
          onChange={handleToggle(setEmailNotifications, emailNotifications)}
        />
      </div>

      <div className="settings-option mb-4">
        <label className="block font-medium mb-1">Theme</label>
        <Select
          value={theme}
          onChange={(e) => handleSettingChange(setTheme)(e.target.value)}
          className="w-full"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </Select>
      </div>

      <div className="settings-option mb-4">
        <label className="block font-medium mb-1">Language</label>
        <Select
          value={language}
          onChange={(e) => handleSettingChange(setLanguage)(e.target.value)}
          className="w-full"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </Select>
      </div>

      <div className="settings-option mb-4">
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          <span>Auto Save on Change</span>
        </label>
      </div>

      <Button
        onClick={saveSettings}
        disabled={loading || autoSave}
        className="w-full"
      >
        {loading ? "Saving..." : "💾 Save Settings"}
      </Button>
    </div>
  );
}
