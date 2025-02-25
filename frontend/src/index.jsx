// ✅ FILE: frontend/src/index.jsx

import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global/index.css"; // ✅ Ensure correct global styles import

// ✅ Error Boundary for robust error handling
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("❌ Error Caught in Boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h1>Something went wrong. Please try again later.</h1>
                    <p>{this.state.error?.message || "Unknown Error"}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

// ✅ Verify `#root` exists before rendering the React app
document.addEventListener("DOMContentLoaded", () => {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        console.error("❌ ERROR: Root element not found! Ensure there is an element with id='root' in index.html.");
        return;
    }

    // ✅ Initialize React App
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </BrowserRouter>
        </React.StrictMode>
    );
});
