// File Path: frontend/components/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FileUpload from './FileUpload'; // Assuming FileUpload component exists
import '../styles/Dashboard.css'; // Ensure this file exists for styling

const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [storageRecommendations, setStorageRecommendations] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Loading state for better UX

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Start loading
            setError(''); // Clear previous errors
            try {
                // Fetch user data from backend API
                const response = await axios.get('/api/user'); // Assuming an endpoint for user data
                setUserData(response.data);

                // Call the backend to check for storage recommendations
                const recommendationResponse = await axios.post('/api/storage/check', {
                    fileSize: 100, // example file size (you can dynamically change this later)
                    userStorage: response.data.storage, // assuming this is a key in the user object
                });

                setStorageRecommendations(recommendationResponse.data);
            } catch (error) {
                setError('Error fetching data. Please try again.');
            } finally {
                setLoading(false); // Stop loading
            }
        };

        fetchData();
    }, []);

    const retryFetch = () => {
        setUserData(null); // Clear existing data
        setStorageRecommendations([]); // Clear recommendations
        setError(''); // Clear error message
        fetchData(); // Retry fetching data
    };

    if (loading) {
        return (
            <div className="loading" aria-live="polite">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={retryFetch} aria-label="Retry loading dashboard">
                        Retry
                    </button>
                </div>
            )}
            {userData ? (
                <div className="user-info">
                    <h2>{userData.name}'s Dashboard</h2>
                    <p>Email: {userData.email}</p>
                    <div className="storage-info">
                        <h3>Storage Usage</h3>
                        <p>Total Storage: {userData.storage.total} GB</p>
                        <p>Used Storage: {userData.storage.used} GB</p>
                        <p>Free Storage: {userData.storage.free} GB</p>
                    </div>

                    {/* Display recommendation message if the system suggests adding a platform */}
                    {storageRecommendations?.recommendAddPlatform && (
                        <div className="storage-alert">
                            <p>{storageRecommendations.message}</p>
                        </div>
                    )}

                    {/* Display the best storage platform recommendation */}
                    {storageRecommendations?.recommendedPlatform && (
                        <p>Recommended Platform: {storageRecommendations.recommendedPlatform}</p>
                    )}

                    {/* File Upload Component */}
                    <FileUpload />
                </div>
            ) : (
                <p className="error-message">Unable to load user data. Please try again later.</p>
            )}
        </div>
    );
};

export default Dashboard;
