// /Users/patrick/Projects/Teralynk/frontend/src/components/NotificationLog.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/components/NotificationLog.css';

const NotificationLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('/api/notifications/logs');
                setLogs(response.data);
            } catch (err) {
                setError('Failed to load notifications log.');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="notification-log">
            <h2>Notification Log</h2>
            {loading ? <p>Loading notifications...</p> : error ? <p>{error}</p> : (
                <ul>
                    {logs.length === 0 ? <p>No notifications available.</p> : logs.map((log, index) => (
                        <li key={index}>
                            <p><strong>Type:</strong> {log.type}</p>
                            <p><strong>Message:</strong> {log.message}</p>
                            <p className="timestamp">{new Date(log.timestamp).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NotificationLog;
