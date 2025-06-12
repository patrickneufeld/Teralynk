// ✅ FILE: /frontend/src/components/AiPerformanceLogs.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/Card";  // Adjusted import path
import "../styles/components/AiPerformanceLogs.css";
import { logError } from "@/utils/logging/logging"; // Import logging utility
import PropTypes from 'prop-types';


const AiPerformanceLogs = ({ apiEndpoint = "/api/ai/logs", initialLogs = [] }) => {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // Use null for initial error state

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(apiEndpoint);
        setLogs(response.data);
      } catch (err) {
        logError("Failed to fetch AI performance logs", err); // Use logger
        setError("Failed to fetch AI performance logs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [apiEndpoint]);  // Add apiEndpoint as a dependency

  if (loading) {
    return <p className="log-loading">Loading logs...</p>;  // Simplified loading state
  }

  if (error) {
    return (
      <Alert variant="error">
        {error}
      </Alert>
    ); // Error display with Alert component
  }

  return (
    <div className="ai-performance-logs container">
      <h2 className="log-title">AI Performance Logs</h2>

      <div className="logs-container">
        {logs.length === 0 ? (
          <p className="log-empty">No logs available.</p>
        ) : (
          logs.map((log) => (
            <Card key={log.id || log.timestamp} className="performance-log-card">
              <CardContent>
                <p>
                  <strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>Message:</strong> {log.message}
                </p>
                {log.level && (
                  <p>
                    <strong>Level:</strong> {log.level}
                  </p>
                )}
                {log.meta && ( // Use meta instead of context
                  <p>
                    <strong>Metadata:</strong> {JSON.stringify(log.meta)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

AiPerformanceLogs.propTypes = {
  apiEndpoint: PropTypes.string,
  initialLogs: PropTypes.array
};

export default AiPerformanceLogs;
