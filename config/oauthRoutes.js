// File Path: backend/src/api/oauthRoutes.js

const express = require("express");
const router = express.Router();
const RepoIntegration = require("../services/repoIntegration");

/**
 * Step 1: Generate Authorization URL (User-Specific)
 */
router.post("/auth/:repo", (req, res) => {
  const { repo } = req.params;
  const { clientId, redirectUri } = req.body;

  const authUrl = getAuthUrl(repo, clientId, redirectUri);

  if (!authUrl) {
    return res.status(400).json({ error: `Unsupported repository: ${repo}` });
  }

  res.status(200).json({ authUrl });
});

/**
 * Step 2: Exchange Authorization Code for Access Token
 */
router.post("/auth/:repo/callback", async (req, res) => {
  const { repo } = req.params;
  const { authCode, clientId, clientSecret, redirectUri } = req.body;

  try {
    const tokenData = await RepoIntegration[`connect${capitalize(repo)}`](authCode, {
      clientId,
      clientSecret,
      redirectUri,
    });

    res.status(200).json(tokenData);
  } catch (err) {
    res.status(500).json({ error: `OAuth failed for ${repo}: ${err.message}` });
  }
});

/**
 * Utility: Generate Authorization URL (Supports User Input)
 */
function getAuthUrl(repo, clientId, redirectUri) {
  const authUrls = {
    dropbox: `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`,
    google: `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=code&scope=https://www.googleapis.com/auth/drive&redirect_uri=${redirectUri}`,
    onedrive: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&scope=files.readwrite.all&redirect_uri=${redirectUri}`,
    box: `https://account.box.com/api/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`,
    // Add more repositories here
  };

  return authUrls[repo.toLowerCase()] || null;
}

/**
 * Utility: Capitalize First Letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = router;
