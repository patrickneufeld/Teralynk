// File: /Users/patrick/Projects/Teralynk/frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import SecretsFetcher from "./components/SecretsFetcher";
import "./styles/global/index.css";

/**
 * Initializes the app and handles rendering with error fallback.
 */
const initializeApp = () => {
  const rootElement = document.getElementById("root");

  // Root element check
  if (!rootElement) {
    console.error("❌ Root element not found.");
    const fallback = document.createElement("div");
    fallback.innerText = "Critical Error: Root not found. Please ensure your index.html contains an element with id='root'.";
    fallback.style.cssText = "color: red; font-size: 18px; text-align: center;";
    document.body.appendChild(fallback);
    return;
  }

  console.log("✅ Root element found. Initializing the application...");

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <SecretsFetcher>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SecretsFetcher>
      </React.StrictMode>
    );

    console.log("✅ Application rendered successfully!");
  } catch (error) {
    console.error("❌ Failed to render application:", error);
    const fallback = document.createElement("div");
    fallback.innerText = "Unexpected error occurred while loading the app.";
    fallback.style.cssText = "color: red; font-size: 18px; text-align: center;";
    document.body.appendChild(fallback);
  }
};

// Initialize app once the DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
