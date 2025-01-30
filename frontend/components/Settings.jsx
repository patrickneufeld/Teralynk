// File Path: frontend/components/Settings.jsx

import React, { useState, useEffect } from 'react';
import '../styles/Settings.css'; // Ensure correct path to the CSS file

const Settings = () => {
    const [settings, setSettings] = useState({
        emailNotifications: false,
        darkMode: false,
        integrations: [],
    });
    const [newIntegration, setNewIntegration] = useState({
        type: '',
        name: '',
        details: {},
        shareWithEveryone: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch user settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                } else {
                    setError('Failed to load settings.');
                }
            } catch {
                setError('An unexpected error occurred. Please try again later.');
            }
        };
        fetchSettings();
    }, []);

    // Handle general settings toggles
    const handleToggle = (e) => {
        const { name, checked } = e.target;
        setSettings((prev) => ({ ...prev, [name]: checked }));
    };

    // Save settings to the backend
    const handleSave = async () => {
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setSuccess('Settings saved successfully!');
            } else {
                setError('Failed to save settings.');
            }
        } catch {
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    // Add a new integration
    const handleAddIntegration = () => {
        if (!newIntegration.type || !newIntegration.name) {
            setError('Please provide both type and name for the integration.');
            return;
        }

        setSettings((prev) => ({
            ...prev,
            integrations: [...prev.integrations, { ...newIntegration }],
        }));

        // Reset new integration state
        setNewIntegration({ type: '', name: '', details: {}, shareWithEveryone: false });
        setError('');
    };

    // Delete an integration
    const handleDeleteIntegration = (index) => {
        setSettings((prev) => ({
            ...prev,
            integrations: prev.integrations.filter((_, i) => i !== index),
        }));
    };

    // Update integration details
    const handleDetailsChange = (key, value) => {
        setNewIntegration((prev) => ({
            ...prev,
            details: {
                ...prev.details,
                [key]: value,
            },
        }));
    };

    return (
        <div className="settings">
            <h2>Settings</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            {/* General Settings */}
            <div className="settings-option">
                <label>
                    Email Notifications:
                    <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={handleToggle}
                    />
                </label>
                <label>
                    Dark Mode:
                    <input
                        type="checkbox"
                        name="darkMode"
                        checked={settings.darkMode}
                        onChange={handleToggle}
                    />
                </label>
            </div>

            {/* Integrations Section */}
            <div className="settings-section">
                <h3>Integrations</h3>
                <ul>
                    {settings.integrations.map((integration, index) => (
                        <li key={index}>
                            <strong>{integration.name}</strong> ({integration.type})
                            <button
                                className="delete-button"
                                onClick={() => handleDeleteIntegration(index)}
                            >
                                Remove
                            </button>
                            <ul>
                                {Object.entries(integration.details).map(([key, value]) => (
                                    <li key={key}>
                                        {key}: {value}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>

                {/* Add New Integration */}
                <div className="add-integration">
                    <h4>Add New Integration</h4>
                    <select
                        value={newIntegration.type}
                        onChange={(e) =>
                            setNewIntegration((prev) => ({ ...prev, type: e.target.value }))
                        }
                    >
                        <option value="" disabled>
                            Select Type
                        </option>
                        <option value="storage">Storage</option>
                        <option value="ai">AI Tool</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Integration Name"
                        value={newIntegration.name}
                        onChange={(e) =>
                            setNewIntegration((prev) => ({ ...prev, name: e.target.value }))
                        }
                    />
                    <div className="integration-details">
                        <input
                            type="text"
                            placeholder="Detail Key (e.g., API Key)"
                            onBlur={(e) => handleDetailsChange('key', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Detail Value"
                            onBlur={(e) => handleDetailsChange('value', e.target.value)}
                        />
                    </div>
                    <label>
                        Share with everyone:
                        <input
                            type="checkbox"
                            checked={newIntegration.shareWithEveryone}
                            onChange={(e) =>
                                setNewIntegration((prev) => ({
                                    ...prev,
                                    shareWithEveryone: e.target.checked,
                                }))
                            }
                        />
                    </label>
                    <button onClick={handleAddIntegration}>Add Integration</button>
                </div>
            </div>

            <button className="save-button" onClick={handleSave}>
                Save Settings
            </button>
        </div>
    );
};

export default Settings;
