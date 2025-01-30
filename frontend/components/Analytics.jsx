// File Path: frontend/components/Analytics.jsx

import React, { useState, useEffect } from 'react';
import '../styles/Analytics.css'; // Updated path for CSS file

const Analytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('/api/analytics');
                if (response.ok) {
                    const data = await response.json();
                    setAnalyticsData(data);
                } else {
                    setError('Failed to fetch analytics data.');
                }
            } catch (err) {
                setError('An unexpected error occurred. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const retryFetch = () => {
        setAnalyticsData(null); // Clear existing data before retry
        setError('');
        setLoading(true);
        fetchAnalytics();
    };

    if (error) {
        return (
            <div className="analytics error">
                <p className="error-message" aria-live="polite">{error}</p>
                <button onClick={retryFetch}>Retry</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading" aria-live="polite">
                Loading analytics...
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="analytics empty">
                <p>No analytics data available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="analytics">
            <h2>Analytics & Insights</h2>
            <div className="analytics-section">
                <h3>Activity</h3>
                <p>Files Uploaded: {analyticsData.filesUploaded || 0}</p>
                <p>Collaborations: {analyticsData.collaborations || 0}</p>
                <p>AI Tool Usage: {analyticsData.aiUsage || 0}</p>
            </div>
            <div className="analytics-section">
                <h3>Storage</h3>
                <p>Total Storage Used: {analyticsData.storageUsed || 0} MB</p>
            </div>
        </div>
    );
};

export default Analytics;
