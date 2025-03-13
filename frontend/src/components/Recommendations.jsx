// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Recommendations.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/components/Recommendations.css";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Card from "./ui/Card";
import Loader from "./ui/Loader";
import Alert from "./ui/Alert";

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedRecommendations, setSavedRecommendations] = useState([]);

  useEffect(() => {
    fetchRecommendations();
    loadSavedRecommendations();
  }, [category]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`/api/recommendations?category=${category}`, {
        withCredentials: true,
      });
      setRecommendations(response.data.recommendations);
    } catch (err) {
      console.error("❌ Error fetching recommendations:", err);
      setError("Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedRecommendations = () => {
    const saved = JSON.parse(localStorage.getItem("savedRecommendations")) || [];
    setSavedRecommendations(saved);
  };

  const saveRecommendation = (recommendation) => {
    const updated = [...savedRecommendations, recommendation];
    setSavedRecommendations(updated);
    localStorage.setItem("savedRecommendations", JSON.stringify(updated));
  };

  const removeSavedRecommendation = (index) => {
    const updated = savedRecommendations.filter((_, i) => i !== index);
    setSavedRecommendations(updated);
    localStorage.setItem("savedRecommendations", JSON.stringify(updated));
  };

  return (
    <div className="recommendations-container">
      <h1 className="title">🔍 AI-Powered Recommendations</h1>

      {error && <Alert type="error">{error}</Alert>}

      <div className="controls">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="general">General</option>
          <option value="productivity">Productivity</option>
          <option value="security">Security</option>
          <option value="file-management">File Management</option>
          <option value="collaboration">Collaboration</option>
        </Select>
        <Button onClick={fetchRecommendations}>🔄 Refresh</Button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="recommendation-list">
          {recommendations.length === 0 ? (
            <p>No recommendations available.</p>
          ) : (
            recommendations.map((rec, index) => (
              <Card key={index} className="recommendation-card">
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
                <Button onClick={() => saveRecommendation(rec)}>💾 Save</Button>
              </Card>
            ))
          )}
        </div>
      )}

      <div className="saved-recommendations">
        <h2>📌 Saved Recommendations</h2>
        {savedRecommendations.length === 0 ? (
          <p>No saved recommendations.</p>
        ) : (
          savedRecommendations.map((rec, index) => (
            <Card key={index} className="saved-card">
              <h3>{rec.title}</h3>
              <p>{rec.description}</p>
              <Button className="remove-btn" onClick={() => removeSavedRecommendation(index)}>
                ❌ Remove
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Recommendations;
