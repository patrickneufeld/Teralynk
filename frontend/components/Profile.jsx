// File Path: frontend/components/Profile.jsx

import React from 'react';
import '../styles/Profile.css'; // Updated path to align with styles directory structure

const Profile = ({ user }) => {
    if (!user) {
        return <p className="loading-message">Loading user data...</p>;
    }

    return (
        <div className="profile-container">
            <h2 className="profile-header">Profile</h2>
            <div className="profile-details">
                <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                <p><strong>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="profile-actions">
                <button className="edit-button" aria-label="Edit Profile">Edit Profile</button>
                <button className="manage-account-button" aria-label="Manage Account">Manage Account</button>
            </div>
            <div className="profile-activity">
                <h3>Recent Activity</h3>
                {user.recentActivity && user.recentActivity.length > 0 ? (
                    <ul>
                        {user.recentActivity.map((activity, index) => (
                            <li key={index}>{activity}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-activity-message">No recent activity.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;
