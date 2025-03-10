import React, { useState, useEffect } from "react";
import { fetchPlatforms, addPlatform, deletePlatform } from "../utils/platformService"; // Import service functions

const OAuthForm = () => {
  const [repo, setRepo] = useState(""); // Selected repository
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [credentials, setCredentials] = useState([]); // User-defined credentials
  const [platforms, setPlatforms] = useState([]); // Dynamically fetched platforms
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all available platforms and user credentials on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Fetch available platforms for the dropdown
        const availablePlatforms = await fetchPlatforms();
        setPlatforms(availablePlatforms);

        // Fetch existing user credentials
        const response = await fetch("/api/oauth/credentials");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch credentials");
        setCredentials(data.credentials || []);
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Unable to load data.");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handle form submission to add credentials
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/oauth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, clientId, clientSecret, redirectUri }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add credentials");

      setCredentials([...credentials, data.credential]);
      setClientId("");
      setClientSecret("");
      setRedirectUri("");
    } catch (error) {
      console.error("Error adding credentials:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting credentials
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const success = await deletePlatform(id); // Call delete function from `platformService`
      if (success) {
        setCredentials(credentials.filter((credential) => credential.id !== id));
      } else {
        throw new Error("Failed to delete credentials.");
      }
    } catch (error) {
      console.error("Error deleting credentials:", error);
      setError("Unable to delete credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oauth-form">
      <h1>Manage Repository Credentials</h1>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Form to add new credentials */}
      <form onSubmit={handleSubmit}>
        <label>
          Select Repository:
          <select value={repo} onChange={(e) => setRepo(e.target.value)} required>
            <option value="" disabled>
              Choose a Platform
            </option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.name}>
                {platform.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Client ID:
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          />
        </label>

        <label>
          Client Secret:
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            required
          />
        </label>

        <label>
          Redirect URI:
          <input
            type="text"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Credentials"}
        </button>
      </form>

      {/* List of existing credentials */}
      <h2>Existing Credentials</h2>
      <ul className="credentials-list">
        {credentials.map((credential) => (
          <li key={credential.id}>
            <strong>{credential.repo}</strong>: {credential.clientId}
            <button onClick={() => handleDelete(credential.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OAuthForm;
