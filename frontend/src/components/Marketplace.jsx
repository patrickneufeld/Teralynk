// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Marketplace.jsx

import React from "react";
import marketplaceData from "../data/marketplaceData";
import "../styles/components/Marketplace.css";

const Marketplace = () => {
  return (
    <div className="marketplace-container">
      <h1 className="marketplace-title">🛒 AI Tool Marketplace</h1>
      <p className="marketplace-subtitle">Explore and install AI tools to enhance your workflows</p>

      <div className="marketplace-grid">
        {marketplaceData.map((tool, index) => (
          <div key={index} className="marketplace-card">
            <div className="tool-category">{tool.category}</div>
            <h2 className="tool-name">{tool.name}</h2>
            <p className="tool-description">{tool.description}</p>
            <button className="install-button" onClick={() => alert(`🔧 Coming soon: ${tool.name}`)}>
              {tool.installed ? "✔ Installed" : "Install"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
