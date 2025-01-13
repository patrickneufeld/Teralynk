// File Path: frontend/components/AITools.jsx

import React, { useState, useEffect } from 'react';
import '../styles/AITools.css'; // Ensure the CSS file exists and is styled correctly

const AITools = () => {
    const [tools, setTools] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAITools = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('/api/ai-tools');
                if (response.ok) {
                    const data = await response.json();
                    setTools(data);
                } else {
                    setError('Failed to load AI tools.');
                }
            } catch (err) {
                setError('An unexpected error occurred. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAITools();
    }, []);

    const handleToolUse = (tool) => {
        alert(`Using ${tool.name}!`); // Replace with actual functionality
    };

    return (
        <div className="ai-tools">
            <h2>AI Tools</h2>
            {loading && <p className="loading-message">Loading AI tools...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && tools.length === 0 && !error && (
                <p className="empty-message">No AI tools available at the moment.</p>
            )}
            <ul>
                {tools.map((tool) => (
                    <li key={tool.id} className="ai-tool-item">
                        <h3>{tool.name}</h3>
                        <p>{tool.description}</p>
                        <button
                            onClick={() => handleToolUse(tool)}
                            aria-label={`Use ${tool.name}`}
                        >
                            Use {tool.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AITools;
