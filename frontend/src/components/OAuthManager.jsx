import React, { useEffect, useState, useCallback } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import Loader from "./ui/Loader";
import { fetchPlatforms } from "../utils/platformService";
import "../styles/components/OAuthManager.css";

export default function OAuthManager() {
  const initialFormState = {
    platform: "",
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  };

  const [platforms, setPlatforms] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [visibility, setVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  // Fetch initial data with proper cleanup
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      setLoading(true);
      clearMessages();

      try {
        // Fetch platforms with signal
        const platformList = await fetchPlatforms(controller.signal);
        if (!mounted) return;
        setPlatforms(platformList);

        // Fetch credentials with signal
        const credentialRes = await fetch("/api/oauth/credentials", {
          signal: controller.signal
        });
        if (!mounted) return;

        if (!credentialRes.ok) {
          throw new Error("Failed to fetch credentials");
        }

        const credentialData = await credentialRes.json();
        if (!mounted) return;
        setCredentials(credentialData.credentials || []);

      } catch (err) {
        if (err.name === 'AbortError') return;
        if (mounted) {
          console.error("Error loading data:", err);
          setError("Failed to load required data");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [clearMessages]);

  const handleInputChange = useCallback((field, value) => {
    clearMessages();
    setForm(prev => ({ ...prev, [field]: value }));
  }, [clearMessages]);

  const validateForm = useCallback(() => {
    const { platform, clientId, clientSecret, redirectUri } = form;
    if (!platform || !clientId || !clientSecret || !redirectUri) {
      setError("All fields are required");
      return false;
    }
    return true;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    clearMessages();
    setLoading(true);

    try {
      const res = await fetch("/api/oauth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save credentials");
      }

      const data = await res.json();
      setCredentials(prev => [...prev, data.credential]);
      setSuccess("Credentials saved successfully");
      setForm(initialFormState);

    } catch (err) {
      setError(err.message || "An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (credentialId) => {
    if (!window.confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    clearMessages();

    try {
      const res = await fetch(`/api/oauth/credentials/${credentialId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete credential");
      }

      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      setSuccess("Credential deleted successfully");

    } catch (err) {
      setError(err.message || "Failed to delete credential");
    }
  };

  return (
    <div className="oauth-manager-container">
      <h2 className="text-2xl font-bold mb-4">OAuth Credential Manager</h2>

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
            <option key={p.id} value={p.id}>{p.name}</option>
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
            onClick={() => setVisibility(prev => !prev)}
          >
            {visibility ? "Hide" : "Show"}
          </Button>
        </div>

        <Input
          type="url"
          placeholder="Redirect URI"
          value={form.redirectUri}
          onChange={(e) => handleInputChange("redirectUri", e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? "Saving..." : "Add Credential"}
        </Button>
      </form>

      <h3 className="text-xl mt-6 font-semibold">Stored Credentials</h3>
      {credentials.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">No credentials saved yet.</p>
      ) : (
        <ul className="credentials-list mt-4">
          {credentials.map((credential) => (
            <li key={credential.id} className="credential-item">
              <div className="info">
                <strong>{credential.platform}</strong>
                <span className="text-xs text-gray-500">
                  Client ID: {credential.clientId}
                </span>
              </div>
              <Button
                className="delete-button"
                onClick={() => handleDelete(credential.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}