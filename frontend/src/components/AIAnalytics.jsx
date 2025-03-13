// ✅ FILE: /frontend/src/components/AIAnalytics.jsx

import React, { useEffect, useState } from "react";
import "../styles/components/AIAnalytics.css";
import { fetchAIMetrics } from "../utils/apiHelpers";
import { Card, CardContent } from "./ui/Card";
import Loader from "./ui/Loader";
import Alert from "./ui/Alert";

const AIAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchAIMetrics(); // 📊 Custom API helper
        setMetrics(response);
      } catch (err) {
        console.error("❌ Failed to load metrics:", err);
        setError("Failed to load AI analytics data.");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  return (
    <div className="ai-analytics-container">
      <h1 className="title">📊 AI Analytics Dashboard</h1>

      {loading && <Loader />}
      {error && <Alert type="error">{error}</Alert>}

      {metrics && (
        <div className="metrics-grid">
          <Card>
            <CardContent>
              <h3>Total AI Queries</h3>
              <p>{metrics.totalQueries.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Success Rate</h3>
              <p>{metrics.successRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Average Response Time</h3>
              <p>{metrics.avgResponseTime} ms</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Model Accuracy (MSE)</h3>
              <p>{metrics.mse}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Error Rate</h3>
              <p>{metrics.errorRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Most Queried Model</h3>
              <p>{metrics.topModel}</p>
            </CardContent>
          </Card>

          {metrics.lastRetrained && (
            <Card className="full-span">
              <CardContent>
                <h3>Last Retraining</h3>
                <p>{new Date(metrics.lastRetrained).toLocaleString()}</p>
              </CardContent>
            </Card>
          )}

          {metrics.recommendations?.length > 0 && (
            <Card className="full-span">
              <CardContent>
                <h3>⚙️ Optimization Suggestions</h3>
                <ul>
                  {metrics.recommendations.map((rec, idx) => (
                    <li key={idx} className="optimization-item">✅ {rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalytics;
