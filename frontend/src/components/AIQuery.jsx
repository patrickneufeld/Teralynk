// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/AIQuery.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/tokenUtils";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Alert } from "../components/ui/alert";
import { Loader } from "../components/ui/loader";

const AIQuery = ({ platforms = [] }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [savedResults, setSavedResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [markedResult, setMarkedResult] = useState(null);

  useEffect(() => {
    const fetchSavedResults = async () => {
      try {
        const token = getToken();
        const response = await axios.get("/api/saved-results", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedResults(response.data);
      } catch (err) {
        setError("Failed to fetch saved results.");
      }
    };
    fetchSavedResults();
  }, []);

  const handlePlatformToggle = (platformId) => {
    setError("");
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setError("Query cannot be empty.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one AI platform.");
      return;
    }

    setError("");
    setLoading(true);
    setResults({});

    try {
      const token = getToken();
      const response = await axios.post(
        "/api/ai/query-ai",
        { query, platforms: selectedPlatforms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data.results);
    } catch (err) {
      console.error("❌ Query Error:", err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platformId, result) => {
    try {
      const token = getToken();
      const response = await axios.post(
        "/api/saved-results",
        { platformId, result },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedResults((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("❌ Save Error:", err);
      setError("Failed to save result.");
    }
  };

  const handleDeleteSavedResult = async (id) => {
    try {
      const token = getToken();
      await axios.delete(`/api/saved-results/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedResults((prev) => prev.filter((result) => result._id !== id));
    } catch (err) {
      console.error("❌ Delete Error:", err);
      setError("Failed to delete saved result.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">🧠 AI Query Tool</h2>

      {loading && <Loader className="mb-4" />}
      {error && <Alert className="mb-4 text-red-500">{error}</Alert>}

      {/* Platform Selector */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">Select AI Platforms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {platforms.length === 0 ? (
              <p className="text-sm text-red-500">No platforms available. Please check your settings.</p>
            ) : (
              platforms.map((platform) => (
                <label key={platform.id} className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                    className="form-checkbox"
                  />
                  {platform.name ?? "Unknown AI"}
                </label>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Query Input */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">Enter Query</h3>
          <Textarea
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError("");
            }}
            placeholder="Type your query here..."
            className="mt-2 w-full"
          />
          <Button onClick={executeQuery} disabled={loading} className="mt-3 w-full">
            {loading ? "Executing..." : "Execute Query"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">Results</h3>
          {Object.keys(results).length === 0 ? (
            <p className="text-gray-500">No results yet.</p>
          ) : (
            <div className="grid gap-4">
              {Object.entries(results).map(([platformId, result]) => (
                <div
                  key={platformId}
                  className={`p-3 border rounded-md ${markedResult === platformId ? "bg-yellow-100" : "bg-gray-100"}`}
                >
                  <h4 className="font-semibold">{platforms.find((p) => p.id === platformId)?.name ?? "AI Tool"}</h4>
                  <p className="text-sm whitespace-pre-wrap">{result}</p>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => handleSave(platformId, result)} className="bg-blue-500 text-white">
                      Save
                    </Button>
                    <Button onClick={() => setMarkedResult(platformId)} className="bg-yellow-500 text-white">
                      Mark as Best
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Results */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">Saved Results</h3>
          {savedResults.length === 0 ? (
            <p className="text-gray-500">No saved results yet.</p>
          ) : (
            <ul className="grid gap-2">
              {savedResults.map((saved) => (
                <li key={saved._id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                  <strong>{platforms.find((p) => p.id === saved.platformId)?.name ?? "AI Tool"}</strong>:{" "}
                  {saved.result}
                  <Button
                    onClick={() => handleDeleteSavedResult(saved._id)}
                    className="bg-red-500 text-white"
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIQuery;
