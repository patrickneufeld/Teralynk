import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Simulate fetching user data from an API
        const fetchUserData = async () => {
            const data = await fetch('/api/user-data'); // Replace with actual API endpoint
            const result = await data.json();
            setUserData(result);
        };

        fetchUserData();
    }, []);

    return (
        <div className="dashboard">
            <h1>Welcome to Your Dashboard</h1>
            {userData ? (
                <div>
                    <h2>Hello, {userData.name}!</h2>
                    <p>Your email: {userData.email}</p>
                    <Link to="/settings">Account Settings</Link>
                </div>
            ) : (
                <p>Loading user data...</p>
            )}
        </div>
    );
};

export default Dashboard;
