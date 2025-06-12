// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/CredentialManager.jsx

import React, { useEffect, useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Select from "./ui/Select";
import Loader from "./ui/Loader";
import Modal from "./ui/Modal";
import { Card, CardContent } from "./ui/Card";
import {
  fetchCredentials,
  saveCredential,
  deleteCredential,
  updateCredential,
} from "../utils/credentialService";
import "../styles/components/CredentialManager.css";

const CredentialManager = () => {
  const [credentials, setCredentials] = useState([]);
  const [formData, setFormData] = useState({
    platform: "",
    type: "apiKey",
    fields: {
      apiKey: "",
      username: "",
      password: "",
      clientId: "",
      clientSecret: "",
      redirectUri: "",
    },
  });
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const data = await fetchCredentials();
      setCredentials(data);
    } catch (err) {
      setErrorMsg("Failed to load credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    if (["platform", "type"].includes(field)) {
      setFormData({ ...formData, [field]: value });
    } else {
      setFormData({
        ...formData,
        fields: { ...formData.fields, [field]: value },
      });
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const payload = {
      ...formData,
      fields: Object.fromEntries(
        Object.entries(formData.fields).filter(([k, v]) => v)
      ),
    };

    try {
      if (editingId) {
        await updateCredential(editingId, payload);
        setSuccessMsg("✅ Credential updated.");
      } else {
        await saveCredential(payload);
        setSuccessMsg("✅ Credential saved.");
      }
      resetForm();
      await loadCredentials();
    } catch (err) {
      console.error("❌ Save error:", err);
      setErrorMsg("Failed to save credential.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cred) => {
    setEditingId(cred._id);
    setFormData({
      platform: cred.platform,
      type: cred.type,
      fields: {
        ...cred.fields,
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      await deleteCredential(deleteTargetId);
      setSuccessMsg("🗑️ Credential deleted.");
      await loadCredentials();
    } catch (err) {
      setErrorMsg("Failed to delete credential.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      platform: "",
      type: "apiKey",
      fields: {
        apiKey: "",
        username: "",
        password: "",
        clientId: "",
        clientSecret: "",
        redirectUri: "",
      },
    });
  };

  const CREDENTIAL_TYPES = {
    apiKey: ["apiKey"],
    credentials: ["username", "password"],
    oauth: ["clientId", "clientSecret", "redirectUri"],
  };

  return (
    <div className="credential-manager">
      <h2>🔐 Credential Manager</h2>

      {errorMsg && <Alert type="error">{errorMsg}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}
      {loading && <Loader className="mb-4" />}

      <Card className="mb-4">
        <CardContent>
          <h3>{editingId ? "✏️ Edit Credential" : "➕ Add New Credential"}</h3>
          <Input
            placeholder="Platform (e.g., OpenAI)"
            value={formData.platform}
            onChange={(e) => handleChange("platform", e.target.value)}
            required
          />
          <Select
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="mt-2"
          >
            <option value="apiKey">API Key</option>
            <option value="credentials">Username/Password</option>
            <option value="oauth">OAuth</option>
          </Select>

          {CREDENTIAL_TYPES[formData.type].map((field) => (
            <Input
              key={field}
              type={field.toLowerCase().includes("password") ? "password" : "text"}
              placeholder={field}
              className="mt-2"
              value={formData.fields[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          ))}

          <Button onClick={handleSubmit} className="mt-3">
            {editingId ? "💾 Update Credential" : "Save Credential"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3>🗂️ Saved Credentials</h3>
          {credentials.length === 0 ? (
            <p>No credentials saved yet.</p>
          ) : (
            <ul className="grid gap-2 mt-3">
              {credentials.map((cred) => (
                <li
                  key={cred._id}
                  className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
                >
                  <div>
                    <strong>{cred.platform}</strong> ({cred.type})
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(cred)}>Edit</Button>
                    <Button
                      className="bg-red-500 text-white"
                      onClick={() => confirmDelete(cred._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {showDeleteModal && (
        <Modal
          title="🗑️ Confirm Deletion"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={executeDelete}
          confirmText="Yes, Delete"
        >
          <p>Are you sure you want to delete this credential?</p>
        </Modal>
      )}
    </div>
  );
};

export default CredentialManager;
