import React from 'react';
import '../styles/components/Profile.css';

const Profile = ({ user }) => {
    if (!user) {
        return <p className="loading-message">Loading user data...</p>;
    }

    const handleEditProfile = () => {
        console.log('Edit Profile clicked');
        // Implement edit profile functionality
    };

    const handleManageAccount = () => {
        console.log('Manage Account clicked');
        // Implement manage account functionality
    };

    return (
        <div className="profile-container" aria-label="User Profile">
            <h2 className="profile-header">Profile</h2>
            <div className="profile-details">
                <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                <p><strong>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="profile-actions">
                <button className="edit-button" onClick={handleEditProfile}>Edit Profile</button>
                <button className="manage-account-button" onClick={handleManageAccount}>Manage Account</button>
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
