// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Insights.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { logError, getErrorMessage } from "../utils/ErrorHandler";

const Insights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState(null); // success | error

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/insights", { withCredentials: true });
        setInsights(res.data.insights || []);
      } catch (err) {
        logError(err, "Insights - fetchInsights");
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const submitFeedback = async () => {
    if (!selectedInsight || !feedbackMessage.trim()) {
      setFeedbackStatus("error");
      return;
    }

    try {
      await axios.post(
        "/api/insights/feedback",
        {
          insightId: selectedInsight._id,
          message: feedbackMessage,
        },
        { withCredentials: true }
      );
      setFeedbackStatus("success");
      setFeedbackMessage("");
      setSelectedInsight(null);
    } catch (err) {
      logError(err, "Insights - submitFeedback");
      setFeedbackStatus("error");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">📊 AI Insights</h1>

      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <p className="text-center">Loading insights...</p>
      ) : insights.length === 0 ? (
        <p className="text-center text-gray-500">No insights available.</p>
      ) : (
        <div className="grid gap-4">
          {insights.map((insight) => (
            <Card key={insight._id} className="shadow border border-gray-200">
              <CardContent className="p-4">
                <p className="text-lg font-semibold">{insight.title || "Untitled Insight"}</p>
                <p className="text-gray-700 mt-2">{insight.description}</p>
                <p className="text-sm text-gray-500 mt-1">{new Date(insight.createdAt).toLocaleString()}</p>
                <Button
                  className="mt-4 bg-blue-500 text-white"
                  onClick={() => setSelectedInsight(insight)}
                >
                  Provide Feedback
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedInsight && (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold mb-2">Feedback on: {selectedInsight.title}</h2>
          <textarea
            className="w-full p-3 border rounded mb-3"
            rows={4}
            placeholder="Write your feedback..."
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
          ></textarea>
          <div className="flex gap-2">
            <Button className="bg-green-600 text-white" onClick={submitFeedback}>
              Submit Feedback
            </Button>
            <Button
              className="bg-gray-400 text-white"
              onClick={() => {
                setSelectedInsight(null);
                setFeedbackMessage("");
              }}
            >
              Cancel
            </Button>
          </div>
          {feedbackStatus === "success" && (
            <Alert type="success" className="mt-3">
              ✅ Feedback submitted successfully!
            </Alert>
          )}
          {feedbackStatus === "error" && (
            <Alert type="error" className="mt-3">
              ⚠️ Failed to submit feedback.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default Insights;
