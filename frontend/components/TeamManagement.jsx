// File Path: frontend/components/TeamManagement.jsx

import React, { useState } from 'react';
import '../styles/TeamManagement.css';

const TeamManagement = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleAddMember = async () => {
        setError('');
        setSuccess('');

        if (!newMemberEmail.trim()) {
            setError('Email is required.');
            return;
        }

        if (!validateEmail(newMemberEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (teamMembers.some((member) => member.email === newMemberEmail)) {
            setError('This member is already part of the team.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: newMemberEmail }),
            });

            if (response.ok) {
                const member = await response.json();
                setTeamMembers((prev) => [...prev, member]);
                setNewMemberEmail('');
                setSuccess('Team member added successfully!');
            } else {
                setError('Failed to add team member.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="team-management">
            <h2>Team Management</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <div className="add-member">
                <input
                    type="email"
                    placeholder="Enter team member's email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    aria-label="Team Member Email"
                />
                <button
                    onClick={handleAddMember}
                    disabled={loading}
                    aria-disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Member'}
                </button>
            </div>
            <ul className="team-list">
                {teamMembers.map((member, index) => (
                    <li key={index} className="team-member">
                        <span>{member.email}</span>
                        <span className="member-role">{member.role || 'Member'}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TeamManagement;
