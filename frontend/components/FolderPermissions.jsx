// File Path: frontend/components/FolderPermissions.jsx

import React, { useState, useEffect } from 'react';
import {
    getFolderPermissions,
    updateFolderPermissions,
    createFolderPermission,
} from '../services/folderPermissionsService'; // Assume these functions exist for API calls
import '../styles/FolderPermissions.css'; // Ensure the CSS file exists

const FolderPermissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newPermission, setNewPermission] = useState({});

    useEffect(() => {
        const fetchPermissions = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getFolderPermissions();
                setPermissions(response.data);
            } catch (error) {
                setError('Error fetching permissions.');
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    const handleCreatePermission = async () => {
        setError('');
        setSuccess('');
        try {
            await createFolderPermission(newPermission);
            setSuccess('Permission created successfully!');
            // Reload permissions
            const updatedPermissions = await getFolderPermissions();
            setPermissions(updatedPermissions.data);
            setNewPermission({});
        } catch (error) {
            setError('Error creating permission.');
        }
    };

    const handleUpdatePermission = async (permissionId, updatedPermission) => {
        setError('');
        setSuccess('');
        try {
            await updateFolderPermissions(permissionId, updatedPermission);
            setSuccess('Permission updated successfully!');
            // Reload permissions
            const updatedPermissions = await getFolderPermissions();
            setPermissions(updatedPermissions.data);
        } catch (error) {
            setError('Error updating permission.');
        }
    };

    return (
        <div className="folder-permissions">
            <h2>Folder Permissions</h2>
            {loading ? (
                <p className="loading-message" aria-live="polite">
                    Loading...
                </p>
            ) : (
                <div>
                    {permissions.length === 0 ? (
                        <p className="empty-message">No permissions found.</p>
                    ) : (
                        <ul className="permissions-list">
                            {permissions.map((permission) => (
                                <li key={permission.id} className="permission-item">
                                    {permission.name} - {permission.role}
                                    <button
                                        onClick={() =>
                                            handleUpdatePermission(permission.id, {
                                                role: 'newRole',
                                            })
                                        }
                                    >
                                        Update
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="create-permission">
                        <h3>Create New Permission</h3>
                        <input
                            type="text"
                            placeholder="Permission Name"
                            value={newPermission.name || ''}
                            onChange={(e) =>
                                setNewPermission({ ...newPermission, name: e.target.value })
                            }
                            aria-label="Permission Name"
                        />
                        <input
                            type="text"
                            placeholder="Role"
                            value={newPermission.role || ''}
                            onChange={(e) =>
                                setNewPermission({ ...newPermission, role: e.target.value })
                            }
                            aria-label="Role"
                        />
                        <button onClick={handleCreatePermission}>Create Permission</button>
                    </div>
                </div>
            )}
            {error && <p className="error-message" aria-live="polite">{error}</p>}
            {success && <p className="success-message" aria-live="polite">{success}</p>}
        </div>
    );
};

export default FolderPermissions;
