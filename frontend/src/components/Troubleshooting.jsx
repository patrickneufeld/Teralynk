// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Troubleshooting.jsx

import React, { useState, useEffect } from "react";
import { getToken } from "../utils/tokenUtils";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Loader from "./ui/Loader";
import {
  fetchWithTimeout,
  logUsageAnalytics,
  analyzeErrorPatterns,
} from "../utils/AIUtils";
import { logError, getErrorMessage } from "../utils/ErrorHandler";
import "../styles/components/Troubleshooting.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Troubleshooting = () => {
  const [status, setStatus] = useState({ backend: "unknown", auth: "unknown" });
  const [logs, setLogs] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkSystemStatus();
    fetchErrorLogs();
  }, []);

  // 🛠️ Fetch backend & auth status
  const checkSystemStatus = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Missing authentication token.");

      const [backendRes, authRes] = await Promise.all([
        fetchWithTimeout(`${BACKEND_URL}/health`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithTimeout(`${BACKEND_URL}/auth/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStatus({
        backend: backendRes.ok ? "healthy" : "down",
        auth: authRes.ok ? "authenticated" : "unauthenticated",
      });

      logUsageAnalytics({ event: "troubleshooting-check", backend: backendRes.ok, auth: authRes.ok });
    } catch (err) {
      logError(err, "Troubleshooting - checkSystemStatus");
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 📡 Fetch recent error logs
  const fetchErrorLogs = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/logs/errors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retrieve logs.");

      setLogs(data.logs || []);
      analyzeErrorPatterns(data.logs).then(setAiSuggestions);
    } catch (err) {
      logError(err, "Troubleshooting - fetchErrorLogs");
      setError(getErrorMessage(err));
    }
  };

  // ⚙️ Manually trigger system recheck
  const retryDiagnostics = () => {
    setStatus({ backend: "checking...", auth: "checking..." });
    checkSystemStatus();
  };

  return (
    <div className="troubleshooting-container">
      <h2>🛠 Troubleshooting</h2>

      {error && <Alert type="error">{error}</Alert>}

      <div className="status-check">
        <h3>🔍 System Status</h3>
        <p>Backend: <span className={`status-${status.backend}`}>{status.backend}</span></p>
        <p>Auth Service: <span className={`status-${status.auth}`}>{status.auth}</span></p>

        <Button onClick={retryDiagnostics} disabled={loading}>
          {loading ? "Rechecking..." : "🔄 Re-run Diagnostics"}
        </Button>
      </div>

      <div className="log-section">
        <h3>📜 Recent Error Logs</h3>
        {logs.length === 0 ? (
          <p>No recent errors found.</p>
        ) : (
          <ul>
            {logs.map((log, idx) => (
              <li key={idx} className="error-log">
                <strong>{log.timestamp}:</strong> {log.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {aiSuggestions.length > 0 && (
        <div className="ai-suggestions">
          <h3>🤖 AI Suggestions</h3>
          <ul>
            {aiSuggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Troubleshooting;
