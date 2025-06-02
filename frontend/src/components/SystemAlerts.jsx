// /Users/patrick/Projects/Teralynk/frontend/src/components/SystemAlerts.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/components/SystemAlerts.css';

const SystemAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await axios.get('/api/alerts');
                setAlerts(response.data);
            } catch (err) {
                setError('Failed to load alerts.');
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    return (
        <div className="system-alerts">
            <h2>System Alerts</h2>
            {loading ? <p>Loading alerts...</p> : error ? <p>{error}</p> : (
                <ul>
                    {alerts.length === 0 ? <p>No active alerts.</p> : alerts.map((alert, index) => (
                        <li key={index} className={`alert ${alert.type}`}>
                            <p><strong>{alert.type}:</strong> {alert.message}</p>
                            <p className="timestamp">{new Date(alert.timestamp).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SystemAlerts;
