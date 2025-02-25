import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";

// ✅ Corrected Global Styles Path (Ensure this file exists)
import "./styles/global/index.css"; 

// ✅ Verify `#root` exists before rendering
document.addEventListener("DOMContentLoaded", () => {
    const rootElement = document.getElementById("root");

    if (!rootElement) {
        console.error("❌ ERROR: Root element not found! Ensure there's an element with id='root' in index.html.");
        return;
    }

    // ✅ Initialize the React app with React 18+ createRoot API
    const root = ReactDOM.createRoot(rootElement);

    root.render(
        <React.StrictMode>
            <Router>
                <App />
            </Router>
        </React.StrictMode>
    );
});
