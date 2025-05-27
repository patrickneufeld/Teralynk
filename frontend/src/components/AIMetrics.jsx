// File Path: frontend/src/components/AIMetrics.jsx

import { useState, useEffect } from "react";

export default function AIMetrics() {
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        fetch("/api/performance")
            .then(res => res.json())
            .then(data => setMetrics(data));
    }, []);

    return (
        <div className="ai-metrics">
            <h2>AI Performance Metrics</h2>
            <ul>
                {metrics.map((entry, index) => (
                    <li key={index}>
                        {entry.timestamp} - MSE: {entry.mse}, MAE: {entry.mae}, RSE: {entry.rse}
                    </li>
                ))}
            </ul>
        </div>
    );
}
