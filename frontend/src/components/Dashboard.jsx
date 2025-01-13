// File Path: frontend/src/components/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css'; // Import the associated CSS file for styling

// Dashboard component to display user information and relevant data
function Dashboard({ user }) {
    const [userData, setUserData] = useState(null); // State to store user-specific data
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // State to store any error messages

    // Fetch user data when the component mounts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user-data', {
                    credentials: 'include', // Ensure cookies are sent for auth
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data = await response.json();
                setUserData(data);
                setError(null); // Clear any previous errors
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data. Please try again later.');
                setUserData(null); // Handle error gracefully
            } finally {
                setLoading(false); // Stop loading when data is fetched
            }
        };

        fetchUserData();
    }, []); // Empty dependency array, runs once when the component mounts

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>; // Display loading spinner or message
    }

    if (error) {
        return <div className="dashboard-error">{error}</div>; // Display error message
    }

    return (
        <div className="dashboard">
            <h2>Welcome, {user ? user.username : 'User'}!</h2>
            {userData ? (
                <div className="user-details">
                    <h3>Your Details:</h3>
                    <p><strong>Name:</strong> {userData.name}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Member Since:</strong> {new Date(userData.memberSince).toLocaleDateString()}</p>
                </div>
            ) : (
                <p>No user data available.</p>
            )}
        </div>
    );
}

export default Dashboard;
