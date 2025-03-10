// File: /frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./styles/global/index.css";
import SecretsFetcher from "./components/SecretsFetcher"; // ✅ Import context provider

/**
 * ✅ Initialize the React Application
 * Ensures the root element exists and renders the React app.
 */
const initializeApp = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("❌ ERROR: Root element not found! Make sure your index.html contains an element with id='root'.");
    const fallbackDiv = document.createElement("div");
    fallbackDiv.textContent = "Critical Error: Unable to load the application. Please contact support.";
    fallbackDiv.style.cssText = "color: red; font-size: 20px; text-align: center; padding: 20px;";
    document.body.appendChild(fallbackDiv);
    return;
  }

  console.log("✅ Root element found. Initializing the application...");

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <SecretsFetcher> {/* ✅ Must wrap around Router + App */}
          <Router>
            <App />
          </Router>
        </SecretsFetcher>
      </React.StrictMode>
    );

    console.log("✅ Application rendered successfully!");
  } catch (error) {
    console.error("❌ ERROR: Failed to render the application:", error);
    const fallbackDiv = document.createElement("div");
    fallbackDiv.textContent = "An unexpected error occurred while rendering the application. Please try again later.";
    fallbackDiv.style.cssText = "color: red; font-size: 20px; text-align: center; padding: 20px;";
    document.body.appendChild(fallbackDiv);
  }
};

document.addEventListener("DOMContentLoaded", initializeApp);
