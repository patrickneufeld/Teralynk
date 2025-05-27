// ✅ FILE: /frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

// ✅ Global Styles (Tailwind, theme, fonts)
import './index.css';

// ✅ Correct Logger Import - Fix the path and import
import logger from './utils/logger';
const { logInfo, logError } = logger;

// ✅ DOM Root Mount Point Validation
const rootElement = document.getElementById('root');
if (!rootElement) {
  logError("❌ Missing #root element in DOM. Check your index.html.", "main");
  throw new Error("Missing root DOM element");
}

// ✅ App Initialization Log
logInfo("🚀 Initializing React application...", {}, "main");

// ✅ Error Boundary Setup
const handleError = (error) => {
  logError("❌ Application error:", error);
};

// ✅ Render Application
const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
} catch (error) {
  handleError(error);
  // Render fallback UI if needed
  root.render(
    <div className="error-boundary">
      <h1>Something went wrong</h1>
      <p>Please refresh the page or contact support if the problem persists.</p>
    </div>
  );
}

// ✅ Add development checks
if (import.meta.env.DEV) {
  // Add development-only code here
  window.logger = logger; // For debugging
}
