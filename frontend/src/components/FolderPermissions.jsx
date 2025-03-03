// /Users/patrick/Projects/Teralynk/frontend/src/components/FolderPermissions.jsx

import React, { useState, useEffect } from "react";
import {
    getFolderPermissions,
    updateFolderPermissions,
    createFolderPermission,
} from "../services/folderPermissionsService";
import { Card, CardContent } from "..components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";

const FolderPermissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [newPermission, setNewPermission] = useState({ name: "", role: "" });

    useEffect(() => {
        const fetchPermissions = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getFolderPermissions();
                setPermissions(response.data);
            } catch (error) {
                setError("Error fetching permissions: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    const handleCreatePermission = async () => {
        setError(null);
        setSuccess(null);
        try {
            await createFolderPermission(newPermission);
            setSuccess("Permission created successfully!");
            const updatedPermissions = await getFolderPermissions();
            setPermissions(updatedPermissions.data);
            setNewPermission({ name: "", role: "" });
        } catch (error) {
            setError("Error creating permission: " + error.message);
        }
    };

    const handleUpdatePermission = async (permissionId, updatedPermission) => {
        setError(null);
        setSuccess(null);
        try {
            await updateFolderPermissions(permissionId, updatedPermission);
            setSuccess("Permission updated successfully!");
            const updatedPermissions = await getFolderPermissions();
            setPermissions(updatedPermissions.data);
        } catch (error) {
            setError("Error updating permission: " + error.message);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Folder Permissions</h2>

            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}
            {success && <Alert className="mb-4 text-green-500">{success}</Alert>}
            {loading && <Loader className="mb-4" />}

            <Card className="mb-4">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Existing Permissions</h3>
                    {permissions.length === 0 ? (
                        <p className="text-gray-600">No permissions found.</p>
                    ) : (
                        <ul className="grid gap-2">
                            {permissions.map((permission) => (
                                <li
                                    key={permission.id}
                                    className="text-gray-700 bg-gray-100 p-3 rounded-md flex justify-between items-center"
                                >
                                    {permission.name} - {permission.role}
                                    <Button
                                        onClick={() => {
                                            const newRole = prompt("Enter new role:", permission.role);
                                            if (newRole !== null) {
                                                handleUpdatePermission(permission.id, {
                                                    role: newRole.trim() || permission.role,
                                                });
                                            }
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        Update
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Create New Permission</h3>
                    <Input
                        type="text"
                        placeholder="Permission Name"
                        value={newPermission.name}
                        onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                        className="mt-2 w-full"
                        required
                    />
                    <Input
                        type="text"
                        placeholder="Role"
                        value={newPermission.role}
                        onChange={(e) => setNewPermission({ ...newPermission, role: e.target.value })}
                        className="mt-2 w-full"
                        required
                    />
                    <Button
                        onClick={handleCreatePermission}
                        disabled={!newPermission.name.trim() || !newPermission.role.trim()}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                        Create Permission
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default FolderPermissions;
