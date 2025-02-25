// File: /Users/patrick/Projects/Teralynk/frontend/components/AiQueryPanel.js

import React, { useState } from "react";
import { Card, CardContent, Button, Input, Textarea } from "@/components/ui";
import axios from "axios";

const AiQueryPanel = () => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({});

  const handleQuery = async () => {
    if (!query.trim()) return alert("Please enter a query.");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/ai/query", { query });
      setResponses(response.data.responses);
    } catch (error) {
      console.error("Error querying AI platforms:", error);
      alert("Failed to query AI platforms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (responseId, feedbackText) => {
    try {
      await axios.post("/api/ai/feedback", { responseId, feedback: feedbackText });
      setFeedback((prev) => ({ ...prev, [responseId]: feedbackText }));
      alert("Feedback submitted successfully.");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <Card className="p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">AI Query Panel</h2>
      <Input
        type="text"
        placeholder="Enter your query here..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
      />
      <Button
        onClick={handleQuery}
        disabled={isLoading}
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isLoading ? "Loading..." : "Query AI Platforms"}
      </Button>

      <div className="responses">
        {responses.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-2">AI Responses:</h3>
            {responses.map((res, index) => (
              <Card key={index} className="mb-4 p-4 bg-gray-100">
                <CardContent>
                  <p className="font-medium">{res.platform}:</p>
                  <p className="text-gray-700 mb-4">{res.result}</p>
                  <Textarea
                    placeholder="Provide feedback..."
                    value={feedback[res.id] || ""}
                    onChange={(e) =>
                      setFeedback((prev) => ({ ...prev, [res.id]: e.target.value }))
                    }
                    className="mb-2"
                  />
                  <Button
                    onClick={() => handleFeedback(res.id, feedback[res.id] || "")}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Submit Feedback
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </Card>
  );
};

export default AiQueryPanel;
