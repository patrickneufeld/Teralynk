// /Users/patrick/Projects/Teralynk/frontend/src/components/AiQueryPanel.jsx

import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Alert } from "../components/ui/alert";
import { Loader } from "../components/ui/loader";

const AiQueryPanel = () => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleQuery = async () => {
    if (!query.trim()) {
      setErrorMessage("Please enter a query.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("/api/ai/query", { query });
      setResponses(response.data.responses);
      if (response.data.responses.length === 0) {
        setErrorMessage("No responses received from AI platforms.");
      }
    } catch (error) {
      console.error("Error querying AI platforms:", error);
      setErrorMessage("Failed to query AI platforms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (responseId, feedbackText) => {
    if (!feedbackText.trim()) {
      setErrorMessage("Feedback cannot be empty.");
      return;
    }

    try {
      await axios.post("/api/ai/feedback", { responseId, feedback: feedbackText });
      setFeedback((prev) => ({ ...prev, [responseId]: feedbackText }));
      setSuccessMessage("Feedback submitted successfully.");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setErrorMessage("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">AI Query Panel</h2>

      {isLoading && <Loader className="mb-4" />}
      {errorMessage && <Alert className="mb-4 text-red-500">{errorMessage}</Alert>}
      {successMessage && <Alert className="mb-4 text-green-500">{successMessage}</Alert>}

      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">Enter Query</h3>
          <Input
            type="text"
            placeholder="Enter your query here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2 w-full"
          />
          <Button onClick={handleQuery} disabled={isLoading} className="mt-3 w-full">
            {isLoading ? "Querying..." : "Query AI Platforms"}
          </Button>
        </CardContent>
      </Card>

      {/* AI Responses Display */}
      {responses.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">AI Responses</h3>
            <div className="grid gap-4">
              {responses.map((res, index) => (
                <div key={res.id || index} className="p-3 border rounded-md bg-gray-100">
                  <h4 className="font-semibold">{res.platform}</h4>
                  <p className="text-sm">{res.result}</p>
                  <Textarea
                    placeholder="Provide feedback..."
                    value={feedback[res.id] || ""}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, [res.id]: e.target.value }))}
                    className="mt-2 w-full"
                  />
                  <Button
                    onClick={() => handleFeedback(res.id, feedback[res.id] || "")}
                    className="mt-2 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Submit Feedback
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AiQueryPanel;
