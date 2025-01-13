// File Path: frontend/components/StorageForm.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/StorageForm.css'; // Updated to use a CSS file from the styles folder

const StorageForm = () => {
    const [platformName, setPlatformName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [shareWithEveryone, setShareWithEveryone] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!platformName || !username || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        const formData = {
            platform: platformName,
            username,
            password,
            shareWithEveryone,
        };

        try {
            const response = await axios.post('/api/storage/add', formData);
            setSuccess('Storage added successfully!');
            setError('');
            setPlatformName('');
            setUsername('');
            setPassword('');
            setShareWithEveryone(false);
        } catch (err) {
            setError('Error adding storage. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="storage-form">
            <h2>Add Storage Platform</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Storage Platform Name:
                    <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        required
                        aria-label="Storage Platform Name"
                    />
                </label>
                <label>
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        aria-label="Username"
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label="Password"
                    />
                </label>
                <label className="checkbox-label">
                    Share with Everyone:
                    <input
                        type="checkbox"
                        checked={shareWithEveryone}
                        onChange={(e) => setShareWithEveryone(e.target.checked)}
                        aria-label="Share with Everyone"
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Storage'}
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
        </div>
    );
};

export default StorageForm;
