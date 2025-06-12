// ================================================
// ✅ FILE: /frontend/src/main.jsx
// Hardened React 18 Entry Point with Providers
// ================================================

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/global/global.css";

// Add error handling for debugging
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Fallback UI for loading state
const LoadingFallback = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
);

// Global render-time error component
const ErrorComponent = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h2>Something went wrong</h2>
    <button onClick={() => window.location.reload()}>Refresh Page</button>
  </div>
);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("❌ Root element not found in index.html");

const root = createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <HelmetProvider>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} catch (error) {
  console.error("🚨 Fatal render error:", error);
  root.render(
    <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
      <h2>Fatal Error</h2>
      <pre>{error.toString()}</pre>
    </div>
  );
}
