// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/FileSearch.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import Loader from "./ui/Loader";
import { Card, CardContent } from "./ui/Card";
import "../styles/components/FileSearch.css";

export default function FileSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({ type: "all", platform: "all", tag: "all" });
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSuggestions = useCallback(async (q) => {
    try {
      const res = await axios.get("/api/files/suggest", {
        params: { query: q },
        withCredentials: true,
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.warn("Suggestion fetch failed.");
    }
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, fetchSuggestions]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search term.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setResults([]);

    try {
      const response = await axios.post("/api/files/search", {
        query,
        filters,
        useAI: aiMode,
      }, { withCredentials: true });

      if (response.data?.results?.length > 0) {
        setResults(response.data.results);
        setSuccessMsg(`Found ${response.data.results.length} result(s).`);
      } else {
        setSuccessMsg("No results found.");
      }
    } catch (err) {
      console.error("❌ Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSuggestionClick = (text) => {
    setQuery(text);
    handleSearch();
  };

  return (
    <div className="file-search-container">
      <h2 className="file-search-title">🔍 Advanced File Search</h2>

      {error && <Alert type="error" className="mb-3">{error}</Alert>}
      {successMsg && <Alert type="success" className="mb-3">{successMsg}</Alert>}
      {loading && <Loader className="mb-3" />}

      {/* 🔧 Filters */}
      <div className="filters-row mb-4">
        <Select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
          <option value="all">📄 All Types</option>
          <option value="pdf">📕 PDFs</option>
          <option value="image">🖼️ Images</option>
          <option value="video">📹 Videos</option>
          <option value="doc">📃 Documents</option>
        </Select>
        <Select value={filters.platform} onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}>
          <option value="all">🌐 All Platforms</option>
          <option value="gdrive">Google Drive</option>
          <option value="dropbox">Dropbox</option>
          <option value="onedrive">OneDrive</option>
        </Select>
        <Select value={filters.tag} onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}>
          <option value="all">🏷️ All Tags</option>
          <option value="proposal">Proposal</option>
          <option value="client">Client</option>
          <option value="archive">Archive</option>
        </Select>
        <label className="ai-toggle">
          <input type="checkbox" checked={aiMode} onChange={() => setAiMode(!aiMode)} />
          🤖 Use AI Search
        </label>
      </div>

      {/* 🔍 Query Bar */}
      <div className="search-bar">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter file name, tag, keyword..."
          aria-label="Search input"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* 🔮 Suggestions */}
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => handleSuggestionClick(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}

      {/* 📁 Results */}
      {results.length > 0 && (
        <div className="results-grid mt-4">
          {results.map((file, idx) => (
            <Card key={file.id || idx} className="file-card">
              <CardContent className="p-4">
                <h4 className="font-semibold">{file.name}</h4>
                {file.path && <p className="text-sm text-gray-600">📁 {file.path}</p>}
                <p className="text-xs text-gray-500">Size: {(file.size / 1024 / 1024).toFixed(2)}MB</p>
                {file.tags?.length > 0 && (
                  <div className="file-tags mt-2">
                    {file.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="file-actions mt-3 flex gap-2">
                  <Button onClick={() => window.open(file.previewUrl, "_blank")}>👁️ Preview</Button>
                  <Button onClick={() => window.location.href = file.downloadUrl}>⬇️ Download</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
