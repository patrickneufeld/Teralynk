// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/AIRecommendations.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Loader from "./ui/Loader";
import "../styles/components/AIRecommendations.css";

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState({});
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setError("");
        setLoading(true);
        const res = await axios.get("/api/ai/recommendations", { withCredentials: true });
        setRecommendations(res.data.recommendations || []);
      } catch (err) {
        console.error("❌ Failed to fetch AI recommendations:", err);
        setError("⚠️ Failed to load recommendations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [retry]);

  const groupByCategory = (recs) => {
    return recs.reduce((acc, rec) => {
      const category = rec.category || "General";
      acc[category] = acc[category] || [];
      acc[category].push(rec);
      return acc;
    }, {});
  };

  const handleAction = async (id, action) => {
    setButtonLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.post(`/api/ai/recommendations/${id}/${action}`, {}, { withCredentials: true });
      setRecommendations((prev) => prev.filter((rec) => rec.id !== id));
    } catch (err) {
      console.error(`❌ Failed to ${action} recommendation ${id}:`, err);
      setError(`❌ Could not ${action} recommendation.`);
    } finally {
      setButtonLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const grouped = groupByCategory(recommendations);

  return (
    <div className="ai-recommendations-container">
      <h1 className="title">🤖 AI Recommendations</h1>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      {loading && <Loader className="mb-4" />}

      {!loading && !error && Object.keys(grouped).length === 0 && (
        <p className="empty-message">✨ You're all caught up. No recommendations right now.</p>
      )}

      {!loading &&
        Object.entries(grouped).map(([category, recs]) => (
          <section key={category} className="recommendation-category">
            <h2 className="category-title">{category}</h2>
            <div className="recommendation-grid">
              {recs.map((rec) => (
                <Card key={rec.id} className="recommendation-card">
                  <CardContent className="recommendation-content">
                    <p className="recommendation-text">{rec.message}</p>
                    <div className="recommendation-actions">
                      <Button
                        onClick={() => handleAction(rec.id, "apply")}
                        disabled={buttonLoading[rec.id]}
                        className="apply-btn"
                      >
                        {buttonLoading[rec.id] ? "Applying..." : "✅ Apply"}
                      </Button>
                      <Button
                        onClick={() => handleAction(rec.id, "dismiss")}
                        disabled={buttonLoading[rec.id]}
                        className="dismiss-btn"
                      >
                        {buttonLoading[rec.id] ? "Dismissing..." : "❌ Dismiss"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

      {!loading && error && (
        <Button className="retry-btn mt-4" onClick={() => setRetry((r) => r + 1)}>
          🔄 Retry Fetch
        </Button>
      )}
    </div>
  );
};

export default AIRecommendations;
