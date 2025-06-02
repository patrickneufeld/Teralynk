// File: /routes/auth.js

import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    GetUserCommand,
    GlobalSignOutCommand,
    ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { logInfo, logError, logWarn, logDebug } from '../utils/logging/index.mjs';

const router = express.Router();

// Initialize PostgreSQL client
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

// Initialize AWS Cognito Client
const cognito = new CognitoIdentityProviderClient({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header missing" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Token missing from header" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logError('Token verification failed', { error: error.message });
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
// Login endpoint
router.post("/login", async (req, res) => {
    const { email, password, clientInfo } = req.body;

    if (!email?.trim() || !password?.trim()) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        logInfo('Login attempt', { email, clientInfo });

        // Authenticate against AWS Cognito
        const authCommand = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            },
        });

        const authResult = await cognito.send(authCommand);

        // Look up user in Postgres
        const userQuery = `
            SELECT 
                id,
                email,
                name,
                role,
                preferences,
                is_active
            FROM users
            WHERE email = $1
        `;
        const userResult = await pool.query(userQuery, [email]);
        let user = userResult.rows[0];

        if (!user) {
            // User doesn't exist in Postgres yet — create it
            const createQuery = `
                INSERT INTO users (email, name, role, is_active)
                VALUES ($1, $2, $3, true)
                RETURNING id, email, name, role, preferences
            `;
            const createResult = await pool.query(createQuery, [
                email,
                email.split('@')[0],
                'user'
            ]);
            user = createResult.rows[0];
        }

        if (!user.is_active) {
            logWarn('Login attempt by inactive user', { email });
            return res.status(403).json({ error: "Account is inactive" });
        }

        // Generate JWT access and refresh tokens
        const accessToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
            {
                userId: user.id,
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Save session into auth_sessions table
        const sessionQuery = `
            INSERT INTO auth_sessions (user_id, token, refresh_token, client_info, expires_at)
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
        `;
        await pool.query(sessionQuery, [
            user.id,
            accessToken,
            refreshToken,
            JSON.stringify(clientInfo || {})
        ]);

        logInfo('Login successful', { userId: user.id, email: user.email });

        res.json({
            token: accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                preferences: user.preferences
            }
        });

    } catch (error) {
        logError('Login failed', { error: error.message });

        if (error.name === 'NotAuthorizedException') {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        res.status(500).json({ 
            error: "Authentication failed",
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Token validation endpoint
router.get("/validate", verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                email,
                name,
                role,
                preferences,
                is_active
            FROM users
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [req.user.userId]);
        const user = result.rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({ error: "User not found or inactive" });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                preferences: user.preferences
            }
        });

    } catch (error) {
        logError('Validation failed', { error: error.message });
        res.status(401).json({ error: "Invalid token" });
    }
});

// Logout endpoint
router.post("/logout", verifyToken, async (req, res) => {
    try {
        // Invalidate session
        const query = `
            UPDATE auth_sessions
            SET invalidated_at = NOW()
            WHERE user_id = $1 AND token = $2
        `;
        
        await pool.query(query, [
            req.user.userId,
            req.headers.authorization?.split(" ")[1]
        ]);

        // Optionally logout from Cognito
        try {
            const command = new GlobalSignOutCommand({
                AccessToken: req.headers.authorization?.split(" ")[1]
            });
            await cognito.send(command);
        } catch (cognitoError) {
            logWarn('Cognito logout failed', { error: cognitoError.message });
        }

        logInfo('Logout successful', { userId: req.user.userId });
        res.json({ message: "Logged out successfully" });

    } catch (error) {
        logError('Logout failed', { error: error.message });
        res.status(500).json({ error: "Logout failed" });
    }
});
// Token refresh endpoint
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Verify refresh token still valid
        const sessionQuery = `
            SELECT user_id
            FROM auth_sessions
            WHERE refresh_token = $1 
            AND invalidated_at IS NULL 
            AND expires_at > NOW()
        `;
        const sessionResult = await pool.query(sessionQuery, [refreshToken]);
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        // Get user
        const userQuery = `
            SELECT id, email, name, role
            FROM users
            WHERE id = $1 AND is_active = true
        `;
        const userResult = await pool.query(userQuery, [decoded.userId]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: "User not found or inactive" });
        }

        // Issue new tokens
        const newToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Update session
        const updateSessionQuery = `
            UPDATE auth_sessions
            SET token = $1,
                refresh_token = $2,
                expires_at = NOW() + INTERVAL '24 hours'
            WHERE refresh_token = $3
        `;
        await pool.query(updateSessionQuery, [newToken, newRefreshToken, refreshToken]);

        res.json({
            token: newToken,
            refreshToken: newRefreshToken,
            expiresIn: 24 * 60 * 60 // seconds
        });

    } catch (error) {
        logError('Token refresh failed', { error: error.message });
        res.status(401).json({ error: "Invalid refresh token" });
    }
});

// Password reset request
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email?.trim()) {
            return res.status(400).json({ error: "Email is required" });
        }

        const command = new ForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email
        });

        await cognito.send(command);

        logInfo('Password reset requested', { email });
        res.json({ message: "Password reset instructions sent" });

    } catch (error) {
        logError('Password reset request failed', { error: error.message });
        // Always return a success message to avoid account enumeration
        res.json({ message: "If an account exists, password reset instructions will be sent" });
    }
});
// Database schema notes (for reference, already applied):
/*
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cognito_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token TEXT NOT NULL,
    refresh_token TEXT,
    client_info JSONB,
    invalidated_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
*/

export default router;
