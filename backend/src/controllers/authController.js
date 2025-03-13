import AWS from "aws-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pkg from 'pg'; // Import pg as CommonJS module
const { Client } = pkg; // Destructure Client from 'pg'
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

// AWS Cognito Setup
const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.COGNITO_REGION,
});

// PostgreSQL Initialization
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect().catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
});

// Rate Limiting (Prevents Brute-Force Attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: "Too many login attempts. Please try again later.",
});

// Token Blacklist (For Revocation)
const tokenBlacklist = new Set();

// SIGNUP (Cognito + PostgreSQL Transaction)
const signup = async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const client = await dbClient.connect();

    try {
        await client.query("BEGIN");

        const existingUsers = await cognito.listUsers({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Filter: `email = "${email}"`,
        }).promise();

        if (existingUsers.Users.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const cognitoResponse = await cognito.signUp({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: username,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        }).promise();

        const cognitoId = cognitoResponse.UserSub;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (cognito_id, email, name, password_hash, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, email, name, created_at;
        `;

        const result = await client.query(query, [cognitoId, email, username, hashedPassword]);
        await client.query("COMMIT");

        res.json({
            message: "Signup successful. Please verify your email.",
            user: result.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("❌ Signup Error:", error.message);
        res.status(500).json({ error: "Signup failed. Please try again." });
    } finally {
        client.release();
    }
};

// LOGIN - Authenticate User (Cognito)
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
    }

    try {
        const params = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        };

        const response = await cognito.initiateAuth(params).promise();

        res.cookie("refreshToken", response.AuthenticationResult.RefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            message: "Login successful",
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
        });
    } catch (error) {
        console.error("❌ Login Error:", error.message);
        res.status(401).json({ error: "Authentication failed" });
    }
};

// REFRESH TOKEN
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken || tokenBlacklist.has(refreshToken)) {
            return res.status(401).json({ error: "Invalid or revoked refresh token" });
        }

        const response = await cognito.initiateAuth({
            AuthFlow: "REFRESH_TOKEN_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: { REFRESH_TOKEN: refreshToken },
        }).promise();

        res.json({ accessToken: response.AuthenticationResult.AccessToken });
    } catch (error) {
        console.error("❌ Refresh Token Error:", error.message);
        res.clearCookie("refreshToken");
        res.status(401).json({ error: "Invalid refresh token" });
    }
};

// LOGOUT - Revoke Refresh Token
const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) tokenBlacklist.add(refreshToken); // Revoke token
    res.clearCookie("refreshToken");
    res.json({ message: "Logout successful" });
};

// DELETE USER (With Transaction)
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
        console.error("❌ Delete User Error:", error.message);
        res.status(500).json({ error: "Failed to delete user" });
    } finally {
        client.release();
    }
};

// STATUS (New Endpoint to Check Authentication Status)
const status = async (req, res) => {
    try {
        const user = req.user;
        res.json({ status: "Authenticated", user: user });
    } catch (error) {
        console.error("❌ Status Check Error:", error.message);
        res.status(500).json({ error: "Failed to fetch status" });
    }
};

export {
    signup,
    login,
    refresh,
    logout,
    deleteUser,
    status,  // Add status to the exports
    authLimiter,
};
