// File Path: /Users/patrick/Teralynk/frontend/src/components/Profile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Profile.css'; // Ensure correct path to CSS file

function Profile() {
    const [userData, setUserData] = useState(null); // State to hold user data
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(''); // Error message state

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get('/api/profile'); // Replace with actual API endpoint
                if (response.data) {
                    setUserData(response.data);
                    setError('');
                } else {
                    setError('No user data found');
                }
            } catch (err) {
                setError('Error fetching profile information');
                console.error(err);
            } finally {
                setLoading(false); // Set loading to false regardless of the outcome
            }
        };

        fetchUserProfile();
    }, []);

    if (loading) {
        return <div className="profile-container">Loading profile...</div>;
    }

    if (error) {
        return <div className="profile-container error">{error}</div>;
    }

    return (
        <div className="profile-container">
            <h2>User Profile</h2>
            <div className="profile-field">
                <strong>Name:</strong> {userData.name || 'Not available'}
            </div>
            <div className="profile-field">
                <strong>Email:</strong> {userData.email || 'Not available'}
            </div>
            <div className="profile-field">
                <strong>Joined:</strong> {userData.joined ? new Date(userData.joined).toLocaleDateString() : 'Not available'}
            </div>
        </div>
    );
}

export default Profile;
