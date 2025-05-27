import AWS from "aws-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pkg from 'pg';
const { Client } = pkg;
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";

dotenv.config();

// AWS Cognito Setup
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.COGNITO_REGION,
});

// PostgreSQL Client
const dbClient = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false, require: true },
});

// Connect to DB
dbClient.connect().catch(err => {
  console.error("❌ PostgreSQL Connection Error:", err.message);
});

// Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});

// Token Blacklist
const tokenBlacklist = new Set();

// ========================
// HELPER FUNCTIONS (NEW)
// ========================

const ensurePermissions = (user) => {
  return {
    ...user,
    permissions: user.permissions || ['admin:self'] // Default permission
  };
};

const getUserWithPermissions = async (identifier) => {
  const result = await dbClient.query(
    'SELECT id, email, name, permissions FROM users WHERE email = $1 OR name = $1 LIMIT 1',
    [identifier]
  );
  return result.rows[0] ? ensurePermissions(result.rows[0]) : null;
};

// ========================
// EXISTING AUTH CONTROLLERS (UPDATED)
// ========================

const signup = async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const client = await dbClient.connect();

  try {
    await client.query("BEGIN");

    // Check if user exists
    const existing = await cognito.listUsers({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Filter: `email = "${email}"`,
    }).promise();

    if (existing.Users.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Cognito registration
    const cognitoResponse = await cognito.signUp({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    }).promise();

    // Database insertion
    const query = `
      INSERT INTO users (
        cognito_id, email, name, password_hash, permissions, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, email, name, permissions;
    `;

    const result = await client.query(query, [
      cognitoResponse.UserSub,
      email,
      username,
      await bcrypt.hash(password, 10),
      ['admin:self'] // Force self-admin permissions
    ]);

    await client.query("COMMIT");

    const user = ensurePermissions(result.rows[0]);
    const token = jwt.sign(
      { id: user.id, email: user.email, permissions: user.permissions },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "Signup successful",
      user,
      token
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Signup Error:", error.message);
    res.status(500).json({ error: "Signup failed" });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Cognito authentication
    const response = await cognito.initiateAuth({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password }
    }).promise();

    // Get user with permissions
    const user = await getUserWithPermissions(username);
    if (!user) {
      throw new Error("User not found");
    }

    // Create JWT with permissions
    const tokenPayload = {
      id: user.id,
      email: user.email,
      permissions: user.permissions
    };
    
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user,
      accessToken,
      idToken: response.AuthenticationResult.IdToken
    });

  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// ========================
// COMPLETE OAUTH LOGIC (RETAINED)
// ========================

const loginWithProvider = async (req, res) => {
  const { provider, token } = req.body;

  try {
    let providerUser;
    
    if (provider === "Google") {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      providerUser = ticket.getPayload();
    } else if (provider === "Facebook") {
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
      );
      if (!fbResponse.ok) throw new Error("Facebook token validation failed");
      providerUser = await fbResponse.json();
    } else {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    if (!providerUser?.email) {
      return res.status(401).json({ error: "Invalid provider token" });
    }

    const client = await dbClient.connect();
    try {
      await client.query("BEGIN");

      const upsertQuery = `
        INSERT INTO users (
          email, name, provider, provider_id, profile_image, permissions
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          profile_image = EXCLUDED.profile_image
        RETURNING *;
      `;

      const result = await client.query(upsertQuery, [
        providerUser.email,
        providerUser.name || providerUser.email,
        provider,
        providerUser.sub || providerUser.id,
        providerUser.picture || providerUser.picture?.data?.url,
        ['admin:self'] // Default permissions
      ]);

      await client.query("COMMIT");

      const user = ensurePermissions(result.rows[0]);
      const tokenPayload = {
        id: user.id,
        email: user.email,
        permissions: user.permissions
      };

      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
      const refreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        user,
        accessToken,
        expiresIn: 3600
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Provider Login Error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};

// ========================
// COMPLETE OTHER AUTH FUNCTIONS (RETAINED)
// ========================

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken || tokenBlacklist.has(refreshToken)) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const response = await cognito.initiateAuth({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    }).promise();

    res.json({ 
      accessToken: response.AuthenticationResult.AccessToken 
    });
  } catch (error) {
    console.error("❌ Refresh Error:", error.message);
    res.clearCookie("refreshToken");
    res.status(401).json({ error: "Token refresh failed" });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    tokenBlacklist.add(refreshToken);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logout successful" });
};

const deleteUser = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const client = await dbClient.connect();
  try {
    await client.query("BEGIN");

    await cognito.adminDeleteUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    }).promise();

    await client.query("DELETE FROM users WHERE name = $1", [username]);
    await client.query("COMMIT");

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Delete Error:", error.message);
    res.status(500).json({ error: "Deletion failed" });
  } finally {
    client.release();
  }
};

// ========================
// NEW VALIDATION ENDPOINT (FIXES 404s)
// ========================

const validate = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserWithPermissions(decoded.email);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      user: ensurePermissions(user),
      valid: true
    });
  } catch (error) {
    console.error("❌ Validation Error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

export {
  signup,
  login,
  loginWithProvider,
  refresh,
  logout,
  deleteUser,
  validate,
  authLimiter
};