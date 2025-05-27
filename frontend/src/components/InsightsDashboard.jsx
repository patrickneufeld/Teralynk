// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/InsightsDashboard.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Alert from "./ui/Alert";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Spinner from "./ui/Spinner";
import "../styles/components/InsightsDashboard.css";

const InsightsDashboard = () => {
  const [insights, setInsights] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("/api/insights", { withCredentials: true });
      setInsights(response.data.insights || []);
    } catch (err) {
      console.error("❌ Failed to fetch insights:", err);
      setError("Unable to load insights.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const filtered = insights.filter((insight) =>
      insight.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setInsights(filtered);
  };

  const handleFeedback = async (id, rating) => {
    try {
      await axios.post("/api/insights/feedback", { id, rating }, { withCredentials: true });
      setFeedbackMessage("✅ Feedback submitted successfully!");
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (err) {
      console.error("❌ Feedback error:", err);
      setFeedbackMessage("⚠️ Failed to submit feedback.");
    }
  };

  const filteredInsights = insights.filter((insight) => {
    if (filter === "all") return true;
    return insight.type === filter;
  });

  return (
    <div className="insights-dashboard">
      <h1 className="title">📊 AI Insights Dashboard</h1>

      {error && <Alert type="error">{error}</Alert>}
      {feedbackMessage && <Alert type="success">{feedbackMessage}</Alert>}
      {loading && <Spinner className="mt-4" />}

      <div className="controls">
        <Input
          type="text"
          placeholder="Search insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="ai-optimization">AI Optimization</option>
          <option value="trend">Trends</option>
          <option value="summary">Summaries</option>
        </Select>
      </div>

      <div className="insight-list">
        {filteredInsights.length === 0 ? (
          <p className="text-gray-600 text-center">No insights available.</p>
        ) : (
          filteredInsights.map((insight) => (
            <Card key={insight._id} className="insight-card">
              <h3 className="insight-title">{insight.title}</h3>
              <p className="insight-content">{insight.content}</p>
              <div className="insight-meta">
                <span className="timestamp">
                  {new Date(insight.timestamp).toLocaleString()}
                </span>
                <div className="feedback">
                  <Button onClick={() => handleFeedback(insight._id, "up")}>👍</Button>
                  <Button onClick={() => handleFeedback(insight._id, "down")}>👎</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InsightsDashboard;
