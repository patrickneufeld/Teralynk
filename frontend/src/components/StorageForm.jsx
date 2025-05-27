// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/StorageForm.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/components/StorageForm.css';

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
        setError('');
        setSuccess('');

        if (!platformName.trim() || !username.trim() || !password.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!isValidPassword(password)) {
            setError('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/storage/add', {
                platform: platformName,
                username,
                password,
                shareWithEveryone,
            });

            if (response.status === 201) {
                setSuccess('Storage added successfully!');
                setPlatformName('');
                setUsername('');
                setPassword('');
                setShareWithEveryone(false);
            } else {
                setError('Unexpected response from server. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding storage. Please try again.');
            console.error('Error adding storage:', err);
        } finally {
            setLoading(false);
        }
    };

    const isValidPassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    return (
        <div className="storage-form">
            <h2>Add Storage Platform</h2>
            {error && <p className="error-message" role="alert">{error}</p>}
            {success && <p className="success-message" role="alert">{success}</p>}
            <form onSubmit={handleSubmit} aria-label="Storage platform form">
                <label htmlFor="platformName">
                    Storage Platform Name:
                    <input
                        type="text"
                        id="platformName"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        required
                        aria-label="Storage Platform Name"
                    />
                </label>
                <label htmlFor="username">
                    Username:
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        aria-label="Username"
                    />
                </label>
                <label htmlFor="password">
                    Password:
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="8"
                        placeholder="At least 8 characters with a number and uppercase letter"
                        aria-label="Password"
                    />
                </label>
                <label className="checkbox-label" htmlFor="shareWithEveryone">
                    Share with Everyone:
                    <input
                        type="checkbox"
                        id="shareWithEveryone"
                        checked={shareWithEveryone}
                        onChange={(e) => setShareWithEveryone(e.target.checked)}
                        aria-label="Share with Everyone"
                    />
                </label>
                <button type="submit" disabled={loading} aria-label="Add Storage Button">
                    {loading ? 'Adding...' : 'Add Storage'}
                </button>
            </form>
        </div>
    );
};

export default StorageForm;
