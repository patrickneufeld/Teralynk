// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/OAuthManager.jsx

import React, { useEffect, useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import Loader from "./ui/Loader";
import {
  fetchPlatforms,
  addPlatform,
  deletePlatform,
} from "../utils/platformService";
import "../styles/components/OAuthManager.css";

export default function OAuthManager() {
  const [platforms, setPlatforms] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState({
    platform: "",
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  });
  const [visibility, setVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch platforms and existing credentials
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [platformList, credentialRes] = await Promise.all([
          fetchPlatforms(),
          fetch("/api/oauth/credentials"),
        ]);

        const credentialData = await credentialRes.json();

        if (!credentialRes.ok) {
          throw new Error(credentialData.error || "Failed to load credentials");
        }

        setPlatforms(platformList);
        setCredentials(credentialData.credentials || []);
      } catch (err) {
        console.error("❌ Error loading OAuth data:", err);
        setError("Failed to load platforms or credentials.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.platform || !form.clientId || !form.clientSecret || !form.redirectUri) {
      setError("⚠️ All fields are required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/oauth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save credentials");

      setSuccess("✅ Credentials saved successfully.");
      setCredentials((prev) => [...prev, data.credential]);
      setForm({ platform: "", clientId: "", clientSecret: "", redirectUri: "" });
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError(err.message || "Failed to save credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this credential?");
    if (!confirm) return;

    try {
      const success = await deletePlatform(id);
      if (success) {
        setCredentials((prev) => prev.filter((c) => c.id !== id));
        setSuccess("🗑️ Credential deleted.");
      } else {
        throw new Error("Failed to delete credential.");
      }
    } catch (err) {
      setError(err.message || "Error deleting credential.");
    }
  };

  return (
    <div className="oauth-manager-container">
      <h2 className="text-2xl font-bold mb-4">🔐 OAuth Credential Manager</h2>

      {error && <Alert type="error" className="mb-2">{error}</Alert>}
      {success && <Alert type="success" className="mb-2">{success}</Alert>}
      {loading && <Loader className="mb-4" />}

      <form onSubmit={handleSubmit} className="oauth-form">
        <Select
          required
          value={form.platform}
          onChange={(e) => handleInputChange("platform", e.target.value)}
        >
          <option value="">Select a Platform</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </Select>

        <Input
          type="text"
          placeholder="Client ID"
          value={form.clientId}
          onChange={(e) => handleInputChange("clientId", e.target.value)}
          required
        />

        <div className="password-field">
          <Input
            type={visibility ? "text" : "password"}
            placeholder="Client Secret"
            value={form.clientSecret}
            onChange={(e) => handleInputChange("clientSecret", e.target.value)}
            required
          />
          <Button
            type="button"
            className="toggle-visibility"
            onClick={() => setVisibility((v) => !v)}
          >
            {visibility ? "🙈 Hide" : "👁 Show"}
          </Button>
        </div>

        <Input
          type="text"
          placeholder="Redirect URI"
          value={form.redirectUri}
          onChange={(e) => handleInputChange("redirectUri", e.target.value)}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "➕ Add Credential"}
        </Button>
      </form>

      <h3 className="text-xl mt-6 font-semibold">📦 Stored Credentials</h3>
      {credentials.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">No credentials saved yet.</p>
      ) : (
        <ul className="credentials-list mt-4">
          {credentials.map((c) => (
            <li key={c.id} className="credential-item">
              <div className="info">
                <strong>{c.repo}</strong>
                <span className="text-xs text-gray-500">Client ID: {c.clientId}</span>
              </div>
              <Button className="delete-button bg-red-500 text-white" onClick={() => handleDelete(c.id)}>
                🗑️ Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
