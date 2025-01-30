// File Path: frontend/components/Credentials.jsx

import React, { useState, useEffect } from 'react';
import '../styles/Credentials.css'; // Ensure the CSS file exists

const Credentials = () => {
    const [credentials, setCredentials] = useState([]);
    const [platform, setPlatform] = useState('');
    const [type, setType] = useState('apiKey');
    const [apiKey, setApiKey] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/credentials');
            if (response.ok) {
                const data = await response.json();
                setCredentials(data);
            } else {
                setError('Failed to fetch credentials.');
            }
        } catch (err) {
            setError('An unexpected error occurred while fetching credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCredential = async () => {
        setError('');
        setSuccess('');

        if (!platform.trim() || (type === 'apiKey' && !apiKey.trim()) || (type === 'credentials' && (!username.trim() || !password.trim()))) {
            setError('All fields are required.');
            return;
        }

        setLoading(true);

        const payload = {
            platform,
            type,
            apiKey: type === 'apiKey' ? apiKey : undefined,
            username: type === 'credentials' ? username : undefined,
            password: type === 'credentials' ? password : undefined,
        };

        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const newCredential = await response.json();
                setCredentials((prev) => [...prev, newCredential]);
                setPlatform('');
                setType('apiKey');
                setApiKey('');
                setUsername('');
                setPassword('');
                setSuccess('Credential saved successfully!');
            } else {
                setError('Failed to save credential.');
            }
        } catch (err) {
            setError('An unexpected error occurred while saving the credential.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCredential = async (id) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch(`/api/credentials/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCredentials((prev) => prev.filter((cred) => cred._id !== id));
                setSuccess('Credential deleted successfully!');
            } else {
                setError('Failed to delete credential.');
            }
        } catch (err) {
            setError('An unexpected error occurred while deleting the credential.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="credentials">
            <h2>Manage Credentials</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            {loading && <p className="loading-message">Loading...</p>}

            {/* Add Credential */}
            <div className="add-credential">
                <h3>Add New Credential</h3>
                <input
                    type="text"
                    placeholder="Platform (e.g., OpenAI)"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    aria-label="Platform Name"
                />
                <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Credential Type">
                    <option value="apiKey">API Key</option>
                    <option value="credentials">Username/Password</option>
                </select>
                {type === 'apiKey' && (
                    <input
                        type="text"
                        placeholder="API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        aria-label="API Key"
                    />
                )}
                {type === 'credentials' && (
                    <>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            aria-label="Username"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-label="Password"
                        />
                    </>
                )}
                <button onClick={handleSaveCredential} disabled={loading} aria-label="Save Credential">
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Credential List */}
            <div className="credential-list">
                <h3>Saved Credentials</h3>
                {credentials.length === 0 ? (
                    <p>No credentials saved yet.</p>
                ) : (
                    <ul>
                        {credentials.map((cred) => (
                            <li key={cred._id}>
                                <strong>{cred.platform}</strong> ({cred.type})
                                <button
                                    onClick={() => handleDeleteCredential(cred._id)}
                                    aria-label={`Delete credential for ${cred.platform}`}
                                >
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

export default Credentials;
