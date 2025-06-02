// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/TeamManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import '../styles/components/TeamManagement.css';

const TeamManagement = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchTeamMembers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/team');
            if (!response.ok) {
                throw new Error('Failed to load team members.');
            }
            const data = await response.json();
            setTeamMembers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const validateEmail = useCallback((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const handleAddMember = useCallback(async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const trimmedEmail = newMemberEmail.trim();

            if (!trimmedEmail) {
                setError('Email is required.');
                return;
            }

            if (!validateEmail(trimmedEmail)) {
                setError('Please enter a valid email address.');
                return;
            }

            if (teamMembers.some((member) => member.email === trimmedEmail)) {
                setError('This member is already part of the team.');
                return;
            }

            const response = await fetch('/api/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: trimmedEmail }),
            });

            if (response.ok) {
                const member = await response.json();
                setTeamMembers((prev) => [...prev, member]);
                setNewMemberEmail('');
                setSuccess('Team member added successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to add team member.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [newMemberEmail, teamMembers, validateEmail]);

    const handleRemoveMember = async (email) => {
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`/api/team/${email}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to remove team member.');
            }
            setTeamMembers((prev) => prev.filter((member) => member.email !== email));
            setSuccess('Team member removed successfully!');
        } catch (err) {
            setError(err.message || 'Error removing team member.');
        }
    };

    return (
        <div className="team-management">
            <h2>Team Management</h2>

            {error && <p className="error-message" role="alert">{error}</p>}
            {success && <p className="success-message" role="alert">{success}</p>}

            <div className="add-member">
                <input
                    type="email"
                    placeholder="Enter team member's email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    aria-label="Team Member Email"
                    required
                />
                <button
                    onClick={handleAddMember}
                    disabled={loading}
                    aria-disabled={loading}
                    className="add-member-button"
                    aria-label={loading ? 'Adding team member...' : 'Add team member'}
                >
                    {loading ? 'Adding...' : 'Add Member'}
                </button>
            </div>

            {loading ? (
                <p className="loading-message">Loading team members...</p>
            ) : (
                <ul className="team-list" aria-label="Team Members List">
                    {teamMembers.length === 0 ? (
                        <li className="empty-message">No team members added yet.</li>
                    ) : (
                        teamMembers.map((member) => (
                            <li key={member.email} className="team-member">
                                <span className="member-email">{member.email}</span>
                                <span className="member-role">{member.role || 'Member'}</span>
                                <button
                                    className="remove-button"
                                    onClick={() => handleRemoveMember(member.email)}
                                    aria-label={`Remove ${member.email} from team`}
                                >
                                    Remove
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default TeamManagement;
