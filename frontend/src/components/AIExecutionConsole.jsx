// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/AIExecutionConsole.jsx

import React, { useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import TextArea from "./ui/TextArea";
import Select from "./ui/Select";
import { logError, getErrorMessage } from "../utils/ErrorHandler";
import axios from "axios";
import "../styles/components/AIExecutionConsole.css";

const AIExecutionConsole = ({ availableGroups = [] }) => {
  const [prompt, setPrompt] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRunPrompt = async () => {
    setError("");
    setResult("");
    setLoading(true);

    try {
      const response = await axios.post("/api/ai/execute", {
        prompt,
        groupId: selectedGroup,
      });

      if (!response.data?.output) {
        throw new Error("No output returned.");
      }

      setResult(response.data.output);
    } catch (err) {
      logError(err, "AIExecutionConsole - handleRunPrompt");
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-console-container">
      <h2 className="title">🧠 AI Execution Console</h2>

      <div className="console-section">
        <label htmlFor="ai-group">Select AI Group</label>
        <Select
          id="ai-group"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Select Group</option>
          {availableGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="console-section">
        <label htmlFor="ai-prompt">Enter Prompt</label>
        <TextArea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want the AI group to do?"
        />
      </div>

      <Button onClick={handleRunPrompt} disabled={loading || !prompt || !selectedGroup}>
        {loading ? "Running..." : "Execute Prompt"}
      </Button>

      {error && <div className="error-output">❌ {error}</div>}

      {result && (
        <div className="result-output">
          <h3>✅ Result</h3>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default AIExecutionConsole;
