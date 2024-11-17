import React from 'react';

const Profile = ({ user }) => {
    return (
        <div className="profile">
            <h2>Profile</h2>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
            {/* Add more profile details as needed */}
        </div>
    );
};

export default Profile;
