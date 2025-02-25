// /Users/patrick/Projects/Teralynk/frontend/src/components/UserRoles.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/components/UserRoles.css';

const UserRoles = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users');
                setUsers(response.data);
            } catch (err) {
                setError('Failed to fetch users.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, role) => {
        try {
            await axios.put(`/api/users/${userId}/role`, { role });
            setRoles((prevRoles) => ({ ...prevRoles, [userId]: role }));
        } catch (err) {
            setError('Failed to update role.');
        }
    };

    return (
        <div className="user-roles">
            <h2>Manage User Roles</h2>
            {loading ? <p>Loading users...</p> : error ? <p>{error}</p> : (
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            <span>{user.name} ({user.email})</span>
                            <select
                                value={roles[user.id] || user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserRoles;
