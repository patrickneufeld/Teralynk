// File Path: frontend/components/Notifications.jsx

import React, { useState, useEffect } from 'react';
import '../styles/Notifications.css'; // Updated path to match the styles directory

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Added loading state

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true); // Start loading
            try {
                const response = await fetch('/api/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                } else {
                    setError('Failed to load notifications.');
                }
            } catch (err) {
                setError('An unexpected error occurred. Please try again later.');
            } finally {
                setLoading(false); // Stop loading
            }
        };

        fetchNotifications();
    }, []);

    return (
        <div className="notifications">
            <h2>Notifications</h2>
            {loading && <p className="loading-message">Loading notifications...</p>}
            {error && <p className="error-message">{error}</p>}
            {notifications.length > 0 ? (
                <ul>
                    {notifications.map((notification, index) => (
                        <li key={index} className="notification-item">
                            <p>{notification.message}</p>
                            <span className="timestamp">
                                {new Date(notification.date).toLocaleString()}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                !loading && <p className="no-notifications">No notifications available.</p>
            )}
        </div>
    );
};

export default Notifications;
