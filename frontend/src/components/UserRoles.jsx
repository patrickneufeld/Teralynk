// ✅ File: /Users/patrick/Projects/Teralynk/frontend/src/components/UserRoles.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/components/UserRoles.css";

const UserRoles = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");

    /**
     * ✅ Fetch Users from API with enhanced error handling.
     */
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError("");
            try {
                console.log("🔄 Fetching users...");
                const response = await axios.get("/api/users");
                setUsers(response.data);
                // Preload roles for all users
                const initialRoles = response.data.reduce(
                    (acc, user) => ({ ...acc, [user.id]: user.role }),
                    {}
                );
                setRoles(initialRoles);
            } catch (err) {
                console.error("❌ Error fetching users:", err.message || err);
                setError(
                    err.response?.data?.message || "Failed to fetch users. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    /**
     * ✅ Handle Role Changes and API updates
     * Includes real-time UI feedback and validation.
     */
    const handleRoleChange = async (userId, role) => {
        if (!role) {
            setError("Please select a valid role.");
            return;
        }

        try {
            console.log(`🔄 Updating role for user ID: ${userId}...`);
            setSuccessMessage("");
            setError("");
            await axios.put(`/api/users/${userId}/role`, { role });
            setRoles((prevRoles) => ({ ...prevRoles, [userId]: role }));
            setSuccessMessage(`Role updated successfully for user ID: ${userId}.`);
        } catch (err) {
            console.error("❌ Error updating role:", err.message || err);
            setError(
                err.response?.data?.message || `Failed to update role for user ID: ${userId}.`
            );
        }
    };

    /**
     * ✅ Render the user roles list with dynamic loading/error states.
     */
    return (
        <div className="user-roles">
            <h2>Manage User Roles</h2>
            {loading && <p>Loading users...</p>}
            {error && <p className="error-message" role="alert">⚠️ {error}</p>}
            {successMessage && <p className="success-message" role="alert">✅ {successMessage}</p>}
            {!loading && !error && (
                <ul>
                    {users.length > 0 ? (
                        users.map((user) => (
                            <li key={user.id} className="user-role-item">
                                <span>
                                    {user.name} ({user.email})
                                </span>
                                <select
                                    value={roles[user.id] || ""}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    aria-label={`Role selector for ${user.name}`}
                                >
                                    <option value="" disabled>
                                        Select Role
                                    </option>
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </li>
                        ))
                    ) : (
                        <p>No users found.</p>
                    )}
                </ul>
            )}
        </div>
    );
};

export default UserRoles;
