import RepoIntegration from "../../../services/repoIntegration";

export default async function handler(req, res) {
  const { repo } = req.query; // Extract the repository from the URL
  const { method } = req;

  if (method === "POST") {
    try {
      const { clientId, clientSecret, redirectUri, authCode } = req.body;

      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(400).json({ error: "Missing required parameters." });
      }

      if (authCode) {
        // Handle OAuth callback and exchange authCode for tokens
        const tokenData = await RepoIntegration[`connect${capitalize(repo)}`](authCode, {
          clientId,
          clientSecret,
          redirectUri,
        });
        return res.status(200).json(tokenData);
      } else {
        // Generate Authorization URL
        const authUrl = getAuthUrl(repo, clientId, redirectUri);
        if (!authUrl) {
          return res.status(400).json({ error: `Unsupported repository: ${repo}` });
        }
        return res.status(200).json({ authUrl });
      }
    } catch (error) {
      return res.status(500).json({ error: `OAuth failed: ${error.message}` });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}

/**
 * Generate Authorization URL for OAuth
 */
function getAuthUrl(repo, clientId, redirectUri) {
  const authUrls = {
    dropbox: `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`,
    google: `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=code&scope=https://www.googleapis.com/auth/drive&redirect_uri=${redirectUri}`,
    onedrive: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&scope=files.readwrite.all&redirect_uri=${redirectUri}`,
    box: `https://account.box.com/api/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`,
    // Add other repositories as needed
  };

  return authUrls[repo.toLowerCase()] || null;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
