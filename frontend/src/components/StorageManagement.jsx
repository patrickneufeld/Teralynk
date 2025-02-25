// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/StorageManagement.jsx

import React, { useState, useEffect } from 'react';
import { getStorageUsage, upgradeStorage } from '../services/storageService';
import '../styles/components/StorageManagement.css';

const StorageManagement = () => {
    const [storageData, setStorageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');

    useEffect(() => {
        fetchStorageData();
    }, []);

    const fetchStorageData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getStorageUsage();
            setStorageData(response.data);
            setNotification(checkStorageLimits(response.data));
        } catch (err) {
            setError('Error fetching storage data. Please try again.');
            console.error('Storage fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkStorageLimits = (data) => {
        const exceedingStorage = data.filter((platform) => platform.used >= platform.limit * 0.9);
        if (exceedingStorage.length > 0) {
            return `Warning: Your storage for ${exceedingStorage.map(p => p.name).join(', ')} is nearing the limit. Consider upgrading.`;
        }
        return '';
    };

    const handleUpgradeStorage = async (platformId) => {
        setError('');
        try {
            await upgradeStorage(platformId);
            fetchStorageData();
        } catch (err) {
            setError('Error upgrading storage. Please try again.');
            console.error('Storage upgrade error:', err);
        }
    };

    return (
        <div className="storage-management">
            <h2>Storage Management</h2>
            
            {error && <p className="error-message" role="alert">{error}</p>}
            {notification && <p className="notification" role="alert">{notification}</p>}
            
            {loading ? (
                <p className="loading-message" aria-live="polite">Loading storage information...</p>
            ) : (
                storageData.length > 0 ? (
                    <ul className="storage-list">
                        {storageData.map((platform) => (
                            <li key={platform.id} className="storage-item">
                                <strong>{platform.name}</strong> - {platform.used} GB used of {platform.limit} GB
                                {platform.used >= platform.limit && <span className="limit-warning"> (Limit reached)</span>}
                                <button
                                    className="upgrade-button"
                                    onClick={() => handleUpgradeStorage(platform.id)}
                                    aria-label={`Upgrade storage for ${platform.name}`}
                                    disabled={platform.used < platform.limit}
                                >
                                    Upgrade Storage
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No storage data available.</p>
                )
            )}
        </div>
    );
};

export default StorageManagement;
