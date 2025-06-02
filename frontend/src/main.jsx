// ================================================
// ✅ FILE: /frontend/src/main.jsx
// Teralynk Frontend Entry Point — React + Tailwind + Routing
// ================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ✅ App Core
import App from './App';

// ✅ Global CSS: Tailwind + Custom Styling
import './styles/global/index.css'; // <- FIXED: Correct path to include global Tailwind+custom styles

// ✅ Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SecretsProvider } from './contexts/SecretsContext'; // <- FIXED: corrected from hook path to real context

// ✅ Logging (from correct logging path)
import logger from './utils/logging/index.js'; // <- FIXED: correct import path to match your shared logger
const { logInfo, logError } = logger;

// ✅ Validate DOM Mount Point
const rootElement = document.getElementById('root');
if (!rootElement) {
  logError("❌ Missing #root element in DOM. Check your index.html.", {}, "main");
  throw new Error("Missing #root DOM element");
}

logInfo("🚀 Initializing React application...", {}, "main");

// ✅ Create Root Renderer
const root = ReactDOM.createRoot(rootElement);

// ✅ Main Render Cycle
try {
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <SecretsProvider>
              <App />
            </SecretsProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
} catch (error) {
  logError("❌ Application error during render", error, "main");

  root.render(
    <div className="flex flex-col items-center justify-center h-screen text-center text-red-600 p-4">
      <h1 className="text-2xl font-bold mb-2">🚨 Something went wrong</h1>
      <p className="text-sm">Please refresh the page or contact support if the problem persists.</p>
    </div>
  );
}

// ✅ Dev Tools
if (import.meta.env.DEV) {
  window.logger = logger;
  logInfo("🧪 Dev mode enabled", {}, "main");
}
