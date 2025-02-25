// File Path: frontend/src/components/AIOptimizationPanel.jsx

import { useState } from "react";

export default function AIOptimizationPanel() {
    const [status, setStatus] = useState("Pending");

    function approveOptimization() {
        setStatus("Approved");
        fetch("/api/optimize", { method: "POST" });
    }

    return (
        <div className="ai-optimization-panel">
            <h2>AI Optimization Panel</h2>
            <p>Status: {status}</p>
            <button onClick={approveOptimization}>Approve Optimization</button>
        </div>
    );
}
