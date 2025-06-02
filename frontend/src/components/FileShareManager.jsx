// FILE: /frontend/src/components/FileShareManager.jsx

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { toast } from "react-toastify";
import { logInfo, logError } from "@/utils/logging/logging";
import api from "@/api/apiClient";
import { saveAs } from "file-saver"; // required for CSV export

const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" }
];

const FileShareManager = ({ fileKey, currentUserId }) => {
  const [shareList, setShareList] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [newShare, setNewShare] = useState({ email: "", role: "viewer", expiresAt: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (fileKey) {
      fetchShareList();
      fetchAuditHistory();
    }
  }, [fileKey]);

  const fetchShareList = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/shares/${encodeURIComponent(fileKey)}`);
      setShareList(res.data.shares || []);
    } catch (err) {
      logError(err, "FetchShareListError");
      setErrorMessage("Failed to load shared users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditHistory = async () => {
    try {
      const res = await api.get(`/api/shares/audit/${encodeURIComponent(fileKey)}`);
      setAuditHistory(res.data.audit || []);
    } catch (err) {
      logError(err, "FetchAuditHistoryError");
    }
  };

  const handleInputChange = (field, value) => {
    setNewShare(prev => ({ ...prev, [field]: value }));

    if (field === "email" && value.length >= 2) {
      api.get(`/api/users/suggest?query=${value}`)
        .then(res => setUserSuggestions(res.data || []))
        .catch(() => setUserSuggestions([]));
    }
  };

  const handleSuggestionClick = (email) => {
    setNewShare(prev => ({ ...prev, email }));
    setUserSuggestions([]);
  };

  const handleShare = async () => {
    const { email, role, expiresAt } = newShare;
    if (!email || !role) {
      toast.error("Email and role are required.");
      return;
    }

    if (shareList.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      toast.warning("User already has access.");
      return;
    }

    try {
      await api.post("/api/shares", { fileKey, email, role, expiresAt });
      logInfo("FileShared", { fileKey, sharedWith: email, role });
      setNewShare({ email: "", role: "viewer", expiresAt: "" });
      toast.success(`Access granted to ${email}`);
      fetchShareList();
      fetchAuditHistory();
    } catch (err) {
      logError(err, "ShareCreationError");
      toast.error("Failed to grant access.");
    }
  };

  const handleRevoke = async (shareId, email) => {
    if (!window.confirm(`Revoke access for ${email}?`)) return;

    try {
      await api.delete(`/api/shares/${shareId}`);
      logInfo("ShareRevoked", { fileKey, revokedFrom: email });
      toast.success(`Access revoked from ${email}`);
      fetchShareList();
      fetchAuditHistory();
    } catch (err) {
      logError(err, "RevokeShareError");
      toast.error("Failed to revoke access.");
    }
  };

  const handleRoleChange = async (shareId, newRole) => {
    try {
      await api.put(`/api/shares/${shareId}`, { role: newRole });
      logInfo("ShareRoleUpdated", { shareId, newRole });
      toast.success("Role updated.");
      fetchShareList();
    } catch (err) {
      logError(err, "RoleChangeError");
      toast.error("Failed to update role.");
    }
  };

  const handleCSVExport = () => {
    const header = "Email,Role,ExpiresAt\n";
    const rows = shareList.map(s => `${s.email},${s.role},${s.expiresAt || "N/A"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `shared_users_${fileKey}.csv`);
  };

  return (
    <div className="file-share-manager">
      <h3 className="text-lg font-semibold mb-4">🔗 Share File</h3>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {/* Share Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative w-full md:w-auto">
          <Input
            type="email"
            placeholder="Recipient Email"
            value={newShare.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
          {userSuggestions.length > 0 && (
            <ul className="absolute bg-white border rounded shadow-md z-10 w-full mt-1 max-h-40 overflow-y-auto">
              {userSuggestions.map(email => (
                <li
                  key={email}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSuggestionClick(email)}
                >
                  {email}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Select
          value={newShare.role}
          onChange={(e) => handleInputChange("role", e.target.value)}
          options={ROLES}
        />
        <Input
          type="date"
          value={newShare.expiresAt}
          onChange={(e) => handleInputChange("expiresAt", e.target.value)}
        />
        <Button onClick={handleShare} className="bg-blue-600 text-white">➕ Share</Button>
        <Button onClick={handleCSVExport} className="bg-gray-200 text-black">📤 Export CSV</Button>
      </div>

      {/* Shared Users Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-center">Role</th>
              <th className="px-4 py-2 text-center">Expires</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shareList.map((share) => (
              <tr key={share.id} className="border-t">
                <td className="px-4 py-2">{share.email}</td>
                <td className="px-4 py-2 text-center">
                  <Select
                    value={share.role}
                    onChange={(e) => handleRoleChange(share.id, e.target.value)}
                    options={ROLES}
                  />
                </td>
                <td className="px-4 py-2 text-center">{share.expiresAt || "—"}</td>
                <td className="px-4 py-2 text-center">
                  {share.userId !== currentUserId && (
                    <Button
                      onClick={() => handleRevoke(share.id, share.email)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs"
                    >
                      🗑 Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit History Panel */}
      <div className="mt-8 border-t pt-4">
        <h4 className="text-md font-semibold mb-3">📜 Audit History</h4>
        {auditHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-700">
            {auditHistory.map((event, idx) => (
              <li key={idx}>
                {event.timestamp} — {event.actor} {event.action} {event.target}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

FileShareManager.propTypes = {
  fileKey: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
};

export default FileShareManager;
