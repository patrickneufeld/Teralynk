import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async"; // ✅ For managing SEO
import App from "./App.jsx";
import "./styles/global/index.css"; // ✅ Global styles imported

/**
 * ✅ Safely initializes the root element with enhanced error handling.
 * @returns {HTMLElement|null} - The root DOM element or null if not found.
 */
const initializeRootElement = () => {
  try {
    const rootElement = document.getElementById("root");

    if (!rootElement) {
      throw new Error(
        "Root element not found! Ensure your index.html contains an element with id='root'."
      );
    }

    console.log("✅ Root element found successfully.");
    return rootElement;
  } catch (error) {
    console.error("❌ ERROR: Failed to initialize root element:", error);

    // Display a critical error message to the user
    const fallbackDiv = document.createElement("div");
    fallbackDiv.textContent = "Critical Error: Application could not be loaded.";
    fallbackDiv.style.cssText =
      "color: red; font-size: 20px; text-align: center; padding: 20px; margin: 2rem;";
    document.body.appendChild(fallbackDiv);

    return null; // Prevent further execution
  }
};

/**
 * ✅ Handles rendering the React application with enhanced error handling.
 * @param {HTMLElement} rootElement - The root DOM element to render the application into.
 */
const renderApplication = (rootElement) => {
  if (!rootElement) {
    console.error("❌ ERROR: No valid root element to render the application.");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <HelmetProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </React.StrictMode>
    );

    console.log("✅ Application rendered successfully!");
  } catch (error) {
    console.error("❌ ERROR: Failed to render the application:", error);

    // Display an error fallback in the UI
    const fallbackDiv = document.createElement("div");
    fallbackDiv.textContent =
      "An unexpected error occurred while rendering the application.";
    fallbackDiv.style.cssText =
      "color: red; font-size: 20px; text-align: center; padding: 20px; margin: 2rem;";
    document.body.appendChild(fallbackDiv);
  }
};

/**
 * ✅ Registers the service worker to enable PWA functionality.
 */
const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "✅ Service Worker registered successfully with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("❌ ERROR: Service Worker registration failed:", error);
        });
    });
  } else {
    console.warn("⚠️ Service Workers are not supported in this browser.");
  }
};

/**
 * ✅ Main entry point for application initialization, rendering, and service worker registration.
 */
const main = () => {
  try {
    const rootElement = initializeRootElement();
    if (rootElement) {
      renderApplication(rootElement);

      // Register the service worker after application initialization
      registerServiceWorker();
    }
  } catch (error) {
    console.error("❌ ERROR: Critical failure in the application lifecycle:", error);

    // Notify the user about a critical failure
    const fallbackDiv = document.createElement("div");
    fallbackDiv.textContent =
      "A critical failure occurred. Please contact support for assistance.";
    fallbackDiv.style.cssText =
      "color: red; font-size: 18px; text-align: center; padding: 20px; margin: 2rem;";
    document.body.appendChild(fallbackDiv);
  }
};

// ✅ Execute the main function
main();
