// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Settings.css'; // Ensure the path matches your folder structure

function Settings() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [theme, setTheme] = useState('light');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load current user settings on component mount
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/user/settings');
                const { emailNotifications, theme } = response.data;
                setEmailNotifications(emailNotifications);
                setTheme(theme);
            } catch (err) {
                setError('Failed to load settings. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSaveSettings = async () => {
        const settings = { emailNotifications, theme };
        setLoading(true);
        try {
            await axios.post('/api/user/settings', settings);
            alert('Settings saved successfully!');
            setError(null);
        } catch {
            setError('Error saving settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="settings-container">Loading...</div>;
    }

    return (
        <div className="settings-container">
            <h2>User Settings</h2>
            {error && <p className="error">{error}</p>}
            <div className="settings-option">
                <label>Email Notifications</label>
                <input 
                    type="checkbox" 
                    checked={emailNotifications} 
                    onChange={() => setEmailNotifications(!emailNotifications)} 
                />
            </div>
            <div className="settings-option">
                <label>Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>
            <button 
                className="save-button" 
                onClick={handleSaveSettings}
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
}

export default Settings;
