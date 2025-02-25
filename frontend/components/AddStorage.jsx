// File Path: frontend/components/AddStorage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AddStorage.css'; // Ensure the CSS file exists

const AddStorage = () => {
    const [platform, setPlatform] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddStorage = async () => {
        // Clear previous messages
        setError('');
        setSuccess('');
        setLoading(true);

        // Basic Validation
        if (!platform || !username || !password) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/api/storage/add', {
                platform,
                username,
                password,
            });
            setSuccess('Storage platform added successfully!');
            console.log(response.data);
        } catch (err) {
            setError('Error adding storage platform. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-storage-container">
            <h2>Add New Storage Platform</h2>
            <form onSubmit={(e) => e.preventDefault()} className="add-storage-form">
                <label htmlFor="platform">
                    Platform:
                    <select
                        id="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                    >
                        <option value="">Select a platform</option>
                        <option value="onedrive">OneDrive</option>
                        <option value="dropbox">Dropbox</option>
                        <option value="googleDrive">Google Drive</option>
                        <option value="mega">Mega</option>
                        <option value="pCloud">pCloud</option>
                        <option value="icloud">iCloud</option>
                    </select>
                </label>
                <br />
                <label htmlFor="username">
                    Username:
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                    />
                </label>
                <br />
                <label htmlFor="password">
                    Password:
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                    />
                </label>
                <br />
                <button
                    type="submit"
                    onClick={handleAddStorage}
                    disabled={loading}
                    className="add-storage-button"
                >
                    {loading ? 'Adding...' : 'Add Platform'}
                </button>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
            </form>
        </div>
    );
};

export default AddStorage;
