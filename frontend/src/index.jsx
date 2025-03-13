// ✅ File: /Users/patrick/Projects/Teralynk/frontend/src/index.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import SecretsFetcher from "./components/SecretsFetcher";

// ✅ Import Vite-injected CSS (global)
import "./styles/global/index.css";

/**
 * Initializes the root element with full fallback in case of failure.
 */
const initializeRoot = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("❌ Root element with id='root' not found in index.html");
    const fallback = document.createElement("div");
    fallback.innerText = "Critical Error: Root element not found.";
    fallback.style.cssText = "color: red; font-size: 18px; text-align: center; padding: 2rem;";
    document.body.appendChild(fallback);
    return null;
  }

  console.log("✅ Root element found. Initializing app...");
  return rootElement;
};

/**
 * Renders the main React application with all providers.
 */
const renderApp = (rootElement) => {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <HelmetProvider>
          <SecretsFetcher>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SecretsFetcher>
        </HelmetProvider>
      </React.StrictMode>
    );
    console.log("✅ Application rendered successfully.");
  } catch (err) {
    console.error("❌ Failed to render application:", err);
    const fallback = document.createElement("div");
    fallback.innerText = "Unexpected rendering error occurred.";
    fallback.style.cssText = "color: red; font-size: 18px; text-align: center; padding: 2rem;";
    document.body.appendChild(fallback);
  }
};

// ✅ DOMContentLoaded ensures root element is available
document.addEventListener("DOMContentLoaded", () => {
  const rootElement = initializeRoot();
  if (rootElement) renderApp(rootElement);
});
