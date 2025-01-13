// File Path: frontend/components/StorageManagement.jsx

import React, { useState, useEffect } from 'react';
import { getStorageUsage, upgradeStorage } from '../services/storageService'; // Assume these functions exist for API calls
import '../styles/StorageManagement.css'; // CSS for this component

const StorageManagement = () => {
    const [storageData, setStorageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const fetchStorageData = async () => {
            try {
                const response = await getStorageUsage();
                setStorageData(response.data);
                checkStorageLimits(response.data);
            } catch (error) {
                setError('Error fetching storage data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStorageData();
    }, []);

    const checkStorageLimits = (data) => {
        data.forEach((platform) => {
            if (platform.used >= platform.limit * 0.9) {
                setNotification(`Warning: Your storage for ${platform.name} is nearing the limit.`);
            }
        });
    };

    const handleUpgradeStorage = async (platformId) => {
        try {
            await upgradeStorage(platformId);
            setNotification('Storage upgraded successfully.');
            // Re-fetch storage data after upgrade
            const response = await getStorageUsage();
            setStorageData(response.data);
        } catch (error) {
            setError('Error upgrading storage.');
        }
    };

    return (
        <div className="storage-management">
            <h2>Storage Management</h2>
            {loading ? (
                <p className="loading-message">Loading storage information...</p>
            ) : (
                <div>
                    {storageData.length === 0 ? (
                        <p>No storage data available.</p>
                    ) : (
                        <ul>
                            {storageData.map((platform) => (
                                <li key={platform.id}>
                                    <strong>{platform.name}</strong> - {platform.used} GB used of {platform.limit} GB
                                    {platform.used >= platform.limit && <span> (Limit reached)</span>}
                                    <button
                                        className="upgrade-button"
                                        onClick={() => handleUpgradeStorage(platform.id)}
                                        aria-label={`Upgrade storage for ${platform.name}`}
                                    >
                                        Upgrade Storage
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {notification && <p className="notification">{notification}</p>}
                </div>
            )}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default StorageManagement;
