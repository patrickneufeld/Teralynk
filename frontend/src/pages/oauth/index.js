import { useState } from "react";

const OAuthForm = () => {
  const [repo, setRepo] = useState("dropbox");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/oauth/auth/${repo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, redirectUri }),
      });

      const data = await response.json();
      if (response.ok) {
        window.location.href = data.authUrl; // Redirect to repository's OAuth page
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating authorization URL:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <h1>Connect Your Repository</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Select Repository:
          <select value={repo} onChange={(e) => setRepo(e.target.value)} required>
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

        <button type="submit">Generate Authorization URL</button>
      </form>
    </div>
  );
};

export default OAuthForm;
