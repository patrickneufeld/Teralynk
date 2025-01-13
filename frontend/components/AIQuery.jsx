// File Path: frontend/components/AIQuery.jsx

import React, { useState, useEffect } from 'react';
import '../styles/AIQuery.css';

const AIQuery = ({ platforms }) => {
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({});
    const [savedResults, setSavedResults] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch saved results on component mount
        const fetchSavedResults = async () => {
            try {
                const response = await fetch('/api/saved-results');
                if (response.ok) {
                    const data = await response.json();
                    setSavedResults(data);
                } else {
                    setError('Failed to fetch saved results.');
                }
            } catch (err) {
                setError('An unexpected error occurred while fetching saved results.');
            }
        };

        fetchSavedResults();
    }, []);

    const handlePlatformToggle = (platformId) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platformId)
                ? prev.filter((id) => id !== platformId)
                : [...prev, platformId]
        );
    };

    const executeQuery = async () => {
        if (!query.trim()) {
            setError('Query cannot be empty.');
            return;
        }

        if (selectedPlatforms.length === 0) {
            setError('Please select at least one AI platform.');
            return;
        }

        setError('');
        setLoading(true);
        setResults({});
        try {
            const response = await fetch('/api/ai/query-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, platforms: selectedPlatforms }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data.results);
            } else {
                setError('Failed to fetch results. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (platformId, result) => {
        try {
            const response = await fetch('/api/saved-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ platformId, result }),
            });

            if (response.ok) {
                const savedResult = await response.json();
                setSavedResults((prev) => [...prev, savedResult]);
                alert('Result saved!');
            } else {
                alert('Failed to save result.');
            }
        } catch (err) {
            alert('An unexpected error occurred. Please try again.');
        }
    };

    const handleDeleteSavedResult = async (id) => {
        try {
            const response = await fetch(`/api/saved-results/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSavedResults((prev) => prev.filter((result) => result._id !== id));
                alert('Saved result deleted!');
            } else {
                alert('Failed to delete saved result.');
            }
        } catch (err) {
            alert('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="ai-query">
            <h2>AI Query Tool</h2>
            {error && <p className="error-message">{error}</p>}
            {loading && <p className="loading-message">Loading...</p>}

            {/* Platform Selector */}
            <div className="platform-selector">
                <h3>Select Platforms</h3>
                <ul>
                    {platforms.map((platform) => (
                        <li key={platform.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedPlatforms.includes(platform.id)}
                                    onChange={() => handlePlatformToggle(platform.id)}
                                />
                                {platform.name}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Query Input */}
            <div className="query-input">
                <h3>Enter Query</h3>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your query here..."
                ></textarea>
                <button onClick={executeQuery} disabled={loading}>
                    Execute Query
                </button>
            </div>

            {/* Results Display */}
            <div className="results-display">
                <h3>Results</h3>
                {Object.keys(results).length === 0 ? (
                    <p>No results yet.</p>
                ) : (
                    <div className="results-container">
                        {Object.entries(results).map(([platformId, result]) => (
                            <div
                                key={platformId}
                                className={`result-item ${
                                    markedResult === platformId ? 'marked-best' : ''
                                }`}
                            >
                                <h4>{platforms.find((p) => p.id === platformId)?.name}</h4>
                                <p>{result}</p>
                                <div className="result-actions">
                                    <button onClick={() => handleSave(platformId, result)}>
                                        Save
                                    </button>
                                    <button onClick={() => setMarkedResult(platformId)}>
                                        Mark as Best
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Saved Results */}
            <div className="saved-results">
                <h3>Saved Results</h3>
                {savedResults.length === 0 ? (
                    <p>No saved results yet.</p>
                ) : (
                    <ul>
                        {savedResults.map((saved) => (
                            <li key={saved._id}>
                                <strong>
                                    {platforms.find((p) => p.id === saved.platformId)?.name}
                                </strong>
                                : {saved.result}
                                <button onClick={() => handleDeleteSavedResult(saved._id)}>
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AIQuery;
