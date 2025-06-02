// File Path: frontend/src/components/AITrainingPanel.jsx

import { useState } from "react";
import "../styles/components/AITrainingPanel.css";

export default function AITrainingPanel() {
    const [status, setStatus] = useState("Idle");

    const startTraining = () => {
        setStatus("Training in Progress...");
        setTimeout(() => setStatus("Training Completed"), 3000);
    };

    return (
        <div className="ai-training-panel">
            <h2>AI Training Panel</h2>
            <p>Status: {status}</p>
            <button onClick={startTraining}>Start Training</button>
        </div>
    );
}
