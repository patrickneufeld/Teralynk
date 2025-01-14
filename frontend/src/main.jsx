import React from 'react';
import ReactDOM from 'react-dom/client'; // React 18+ entry point for rendering
import './styles/index.css'; // Global CSS file for app-wide styles
import App from './App'; // Main application component
import { BrowserRouter as Router } from 'react-router-dom'; // Provides routing capabilities
import './styles/global.css'; // Add this line to import global styles

// Verify the root DOM node exists
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Root element not found. Ensure there's an element with id='root' in your index.html.");
}

// Initialize the React app with React 18+ createRoot API
const root = ReactDOM.createRoot(rootElement);

// Render the App component wrapped in React.StrictMode and BrowserRouter
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
