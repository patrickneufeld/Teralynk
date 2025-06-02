import { useState } from "react";

const OAuthForm = () => {
  const [formData, setFormData] = useState({
    repo: "dropbox",
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Dynamically retrieve API URL based on environment
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  /**
   * ✅ Handle input changes dynamically, similar to Signup.jsx
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * ✅ Enhanced Input Validation with detailed feedback
   */
  const validateInputs = () => {
    if (!formData.clientId.trim()) {
      return "Client ID is required.";
    }
    if (!formData.clientSecret.trim()) {
      return "Client Secret is required.";
    }
    if (!formData.redirectUri.startsWith("http")) {
      return "Redirect URI must be a valid HTTP or HTTPS URL.";
    }
    if (!["dropbox", "google", "onedrive", "box"].includes(formData.repo)) {
      return "Please select a valid repository.";
    }
    return null; // No validation errors
  };

  /**
   * ✅ Handle Submit with robust error management
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input validation
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      console.log("🔄 Sending OAuth request to backend...");
      const response = await fetch(`${API_URL}/oauth/auth/${formData.repo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          redirectUri: formData.redirectUri,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate the authorization URL.");
      }

      console.log("✅ Authorization URL generated successfully:", data.authUrl);
      setSuccessMessage("Authorization URL generated successfully! Redirecting...");
      setTimeout(() => {
        // Redirect the user to the OAuth URL
        window.location.href = data.authUrl;
      }, 2000);
    } catch (error) {
      console.error("❌ Error generating authorization URL:", error.message || error);
      setError(error.message || "Unexpected error occurred while generating the authorization URL.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Reset Form State
   */
  const resetForm = () => {
    setFormData({
      repo: "dropbox",
      clientId: "",
      clientSecret: "",
      redirectUri: "",
    });
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="oauth-form">
      <h1>Connect Your Repository</h1>
      {error && <p className="error-message" role="alert">⚠️ {error}</p>}
      {successMessage && <p className="success-message" role="alert">✅ {successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Select Repository:
          <select
            name="repo"
            value={formData.repo}
            onChange={handleChange}
            required
            aria-label="Select repository for OAuth"
          >
            <option value="dropbox">Dropbox</option>
            <option value="google">Google Drive</option>
            <option value="onedrive">OneDrive</option>
            <option value="box">Box</option>
          </select>
        </label>

        <label>
          Client ID:
          <input
            type="text"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            placeholder="Enter Client ID"
            required
            aria-label="Client ID"
          />
        </label>

        <label>
          Client Secret:
          <input
            type="password"
            name="clientSecret"
            value={formData.clientSecret}
            onChange={handleChange}
            placeholder="Enter Client Secret"
            required
            aria-label="Client Secret"
          />
        </label>

        <label>
          Redirect URI:
          <input
            type="url"
            name="redirectUri"
            value={formData.redirectUri}
            onChange={handleChange}
            placeholder="Enter Redirect URI"
            required
            aria-label="Redirect URI"
          />
        </label>

        <div className="form-actions">
          <button type="submit" disabled={loading} aria-disabled={loading}>
            {loading ? "Generating..." : "Generate Authorization URL"}
          </button>
          <button type="button" onClick={resetForm} disabled={loading} aria-disabled={loading}>
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default OAuthForm;
