// File: /frontend/src/components/AIWorkbench.jsx

import React from "react";
import "../styles/components/AIWorkbench.css";

const AIWorkbench = () => {
  return (
    <div className="ai-workbench">
      <h1 className="ai-title">🧠 AI Workbench</h1>
      <p className="ai-description">
        Welcome to your AI Workbench. This is where you’ll access training tools, experiment with models,
        and review intelligent recommendations.
      </p>

      <div className="ai-panel">
        <div className="ai-tool-card">
          <h3>AI Training</h3>
          <p>Train and evaluate your models with custom datasets.</p>
        </div>
        <div className="ai-tool-card">
          <h3>Inference Console</h3>
          <p>Test live predictions and fine-tune response behavior.</p>
        </div>
        <div className="ai-tool-card">
          <h3>Performance Logs</h3>
          <p>Track key metrics and monitor accuracy over time.</p>
        </div>
      </div>
    </div>
  );
};

export default AIWorkbench;
