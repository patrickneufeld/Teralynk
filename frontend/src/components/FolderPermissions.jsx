// File: /frontend/src/components/FolderPermissions.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  getFolderPermissions,
  updateFolderPermissions,
  createFolderPermission,
  deleteFolderPermission,
  searchUsersByEmail,
} from "../services/folderPermissionsService";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { toast } from "react-toastify"; // ✅ UX Improvements
import { logInfo, logError } from "@/utils/logging/logging"; // ✅ Audit Trail

const ROLES = ["Owner", "Editor", "Viewer"]; // ✅ Locked roles only

const FolderPermissions = ({ folderId }) => {
  const [permissions, setPermissions] = useState([]);
  const [newPermission, setNewPermission] = useState({ email: "", role: "Viewer" });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchPermissions = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getFolderPermissions(folderId);
      setPermissions(response.data || []);
    } catch (err) {
      logError(err, "FetchPermissions");
      setError("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleUserSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await searchUsersByEmail(query.trim());
      setSearchResults(response.data || []);
    } catch (err) {
      logError(err, "UserSearch");
      setSearchResults([]);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermission.email || !newPermission.role) {
      setError("Both email and role are required.");
      return;
    }

    if (permissions.some((perm) => perm.userEmail === newPermission.email)) {
      setError("This user already has a permission assigned.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await createFolderPermission(folderId, newPermission.email, newPermission.role);
      toast.success(`Permission assigned to ${newPermission.email} as ${newPermission.role}`);
      logInfo("PermissionCreated", { folderId, email: newPermission.email, role: newPermission.role });
      setNewPermission({ email: "", role: "Viewer" });
      setSearchResults([]);
      fetchPermissions();
    } catch (err) {
      logError(err, "CreatePermission");
      setError(err.message || "Failed to create permission.");
    } finally {
      setSaving(false);
    }
  };
  const handleUpdatePermission = async (permissionId, currentRole, updatedRole) => {
    if (!updatedRole || updatedRole === currentRole) return;

    if (!ROLES.includes(updatedRole)) {
      setError("Invalid role selected.");
      return;
    }

    const targetPermission = permissions.find((perm) => perm.id === permissionId);
    if (!targetPermission) {
      setError("Permission record not found.");
      return;
    }

    // 🔥 Protect the Owner Role from being downgraded accidentally
    if (targetPermission.role === "Owner" && updatedRole !== "Owner") {
      setError("Cannot downgrade an Owner. Ownership must be transferred explicitly.");
      return;
    }

    if (!window.confirm(`Are you sure you want to change role to ${updatedRole}?`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateFolderPermissions(folderId, permissionId, updatedRole);
      toast.success(`Permission updated to ${updatedRole}`);
      logInfo("PermissionUpdated", { folderId, permissionId, updatedRole });
      fetchPermissions();
    } catch (err) {
      logError(err, "UpdatePermission");
      setError(err.message || "Failed to update permission.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePermission = async (permissionId) => {
    const targetPermission = permissions.find((perm) => perm.id === permissionId);

    if (!targetPermission) {
      setError("Permission record not found.");
      return;
    }

    if (targetPermission.role === "Owner") {
      setError("Cannot remove the Owner of the folder.");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this user"s access? This cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteFolderPermission(folderId, permissionId);
      toast.success(`Permission for ${targetPermission.userEmail} removed.`);
      logInfo("PermissionDeleted", { folderId, permissionId });
      fetchPermissions();
    } catch (err) {
      logError(err, "DeletePermission");
      setError(err.message || "Failed to delete permission.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPermission((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      handleUserSearch(value);
    }
  };
  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🔒 Folder Permissions</h2>

      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}
      {(loading || saving) && <Loader className="mb-4" />}

      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Assign New Permission</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="email"
              name="email"
              placeholder="Search user by email"
              value={newPermission.email}
              onChange={handleChange}
              className="w-full"
            />
            <Select
              name="role"
              value={newPermission.role}
              onChange={handleChange}
              options={ROLES.map((r) => ({ value: r, label: r }))}
              className="w-full"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Matching Users:
              <ul className="list-disc list-inside">
                {searchResults.map((user) => (
                  <li key={user.id}>
                    {user.email}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleCreatePermission}
            disabled={!newPermission.email.trim() || !newPermission.role}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white"
          >
            Assign Permission
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Existing Permissions</h3>

          {permissions.length === 0 ? (
            <p className="text-gray-600">No permissions set yet.</p>
          ) : (
            <ul className="space-y-4">
              {permissions.map((perm) => (
                <li
                  key={perm.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-100 p-4 rounded-md"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">{perm.userEmail}</p>
                    <p className="text-sm text-gray-600">Role: {perm.role}</p>
                  </div>

                  <div className="flex space-x-3 mt-3 md:mt-0">
                    <Select
                      value={perm.role}
                      options={ROLES.map((r) => ({ value: r, label: r }))}
                      onChange={(e) => handleUpdatePermission(perm.id, perm.role, e.target.value)}
                      className="w-40"
                      disabled={perm.role === "Owner"} // 🔥 Protect Owner role from casual editing
                    />
                    <Button
                      onClick={() => handleDeletePermission(perm.id)}
                      disabled={perm.role === "Owner"} // 🔥 Protect Owner from deletion
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FolderPermissions;
