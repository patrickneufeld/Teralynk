// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/AIAssistant.jsx

import React, { useState, useEffect, useRef } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import Loader from "./ui/Loader";
import FeedbackForm from "./ui/FeedbackForm";
import {
  getSuggestions,
  getPersonalizedResponse,
  logUsageAnalytics,
  syncPlatformImprovements,
  fetchWithTimeout,
  estimateTokens,
} from "../utils/AIUtils";
import { getToken } from "../utils/tokenUtils";
import { logError, getErrorMessage } from "../utils/ErrorHandler";
import "../styles/components/AIAssistant.css";

const AIAssistant = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [responseId, setResponseId] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [context, setContext] = useState([]);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [tokenEstimate, setTokenEstimate] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [intentTag, setIntentTag] = useState("general");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);

  const inputRef = useRef(null);
  const startTime = useRef(Date.now());
  const debounceRef = useRef(null);

  // 🎙️ Voice Support Detection
  useEffect(() => {
    setVoiceSupported("webkitSpeechRecognition" in window);
  }, []);

  // 🚀 Load Models, User, Session
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const [modelRes, userRes] = await Promise.all([
          fetch("/api/ai/models", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const modelData = await modelRes.json();
        const userData = await userRes.json();

        if (!modelRes.ok) throw new Error(modelData.error || "Model load failed");
        if (!userRes.ok) throw new Error(userData.error || "User load failed");

        setModels(modelData.models || []);
        setSelectedModel(modelData.models[0]?.id || "");
        setUser(userData);
      } catch (err) {
        logError(err, "Assistant - fetchData");
        setError(getErrorMessage(err));
      }
    };

    const restoreSession = () => {
      try {
        const session = JSON.parse(localStorage.getItem("ai-session"));
        if (session) {
          setQuery(session.query || "");
          setContext(session.context || []);
          setHistory(session.history || []);
        }
      } catch (err) {
        console.warn("❌ Failed to restore AI session:", err);
      }
    };

    fetchData();
    restoreSession();
  }, []);

  // 🔢 Token Estimate
  useEffect(() => {
    if (query.trim()) {
      setTokenEstimate(estimateTokens(query));
    } else {
      setTokenEstimate(null);
    }
  }, [query]);

  // 💬 Suggestions Debounced
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 3) return setSuggestions([]);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await getSuggestions(query);
        setSuggestions(results || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [query]);

  const handleAsk = async () => {
    if (!query.trim() || !selectedModel) {
      setError("Please enter a question and select a model.");
      return;
    }

    setLoading(true);
    setTyping(true);
    setResponse("");
    setError("");
    setFollowUps([]);
    setSuggestions([]);

    try {
      const token = getToken();
      const res = await fetchWithTimeout("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modelId: selectedModel,
          prompt: query,
          context,
          user,
          intentTag,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed to respond");

      const personalized = user ? await getPersonalizedResponse(data.response, user) : data.response;
      const ctx = { id: data.responseId, query, response: personalized };

      setResponse(personalized);
      setResponseId(data.responseId);
      setContext((prev) => [...prev, ctx]);
      setHistory((prev) => [ctx, ...prev]);
      setFollowUps(data.followUpSuggestions || []);
      setTotalTokens((prev) => prev + estimateTokens(query + personalized));

      logUsageAnalytics({ userId: user?.id, prompt: query, model: selectedModel, intent: intentTag });
      syncPlatformImprovements({ query, response: personalized, userId: user?.id });

      localStorage.setItem("ai-session", JSON.stringify({
        query: "",
        context: [...context, ctx],
        history: [ctx, ...history],
      }));
    } catch (err) {
      logError(err, "Assistant - handleAsk");
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const handleFeedback = async (feedback) => {
    try {
      const token = getToken();
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedback, userId: user?.id, responseId }),
      });
    } catch (err) {
      logError(err, "Assistant - handleFeedback");
    }
  };

  const startVoiceInput = () => {
    if (!voiceSupported) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript;
      setQuery(speech);
    };
    recognition.onerror = (e) => logError(e, "Voice Recognition");
    recognition.start();
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(context, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-history.json";
    a.click();
  };

  const clearChat = () => {
    setQuery("");
    setResponse("");
    setContext([]);
    setHistory([]);
    localStorage.removeItem("ai-session");
  };

  const getSessionTime = () => {
    const minutes = Math.floor((Date.now() - startTime.current) / 60000);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  };

  return (
    <div className="ai-assistant-container">
      <h1 className="ai-title">🤖 Smart AI Assistant</h1>

      {error && <Alert type="error">{error}</Alert>}

      <div className="ai-meta mb-4">
        <p>🧭 Session Time: {getSessionTime()}</p>
        <p>📊 Total Tokens Used: {totalTokens}</p>
      </div>

      <div className="ai-form-group">
        <label htmlFor="model">Model</label>
        <Select id="model" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </div>

      <div className="ai-form-group">
        <label htmlFor="intent">Intent</label>
        <Select id="intent" value={intentTag} onChange={(e) => setIntentTag(e.target.value)}>
          <option value="general">General</option>
          <option value="summarize">Summarize</option>
          <option value="generate_code">Generate Code</option>
          <option value="rewrite">Rewrite</option>
        </Select>
      </div>

      <div className="ai-form-group">
        <label htmlFor="query">Prompt</label>
        <div className="flex items-center">
          <Input
            id="query"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything..."
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          {voiceSupported && <Button onClick={startVoiceInput}>🎙️</Button>}
        </div>
        {tokenEstimate && <p className="text-sm text-gray-500">Token Estimate: {tokenEstimate}</p>}
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((s, idx) => (
              <li key={idx} onClick={() => setQuery(s)}>{s}</li>
            ))}
          </ul>
        )}
      </div>

      <Button onClick={handleAsk} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </Button>

      {typing && <Loader className="mt-4" />}
      {response && (
        <div className="ai-response-box">
          <h3>📥 AI Response</h3>
          <p>{response}</p>
          <FeedbackForm onSubmit={handleFeedback} />
          {followUps.length > 0 && (
            <div className="mt-4">
              <h4>Suggested Follow-Ups</h4>
              <ul>
                {followUps.map((s, i) => (
                  <li key={i}><Button onClick={() => setQuery(s)}>{s}</Button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="ai-toolbar mt-6">
        <Button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Hide" : "Show"} History
        </Button>
        {history.length > 0 && (
          <>
            <Button className="ml-2 bg-yellow-500" onClick={exportHistory}>📁 Export</Button>
            <Button className="ml-2 bg-red-500" onClick={clearChat}>🗑️ Clear</Button>
          </>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div className="ai-history mt-4">
          <h3>🧠 Chat History</h3>
          <ul>
            {history.map((item, idx) => (
              <li key={idx}>
                <strong>Q:</strong> {item.query}<br />
                <strong>A:</strong> {item.response}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
