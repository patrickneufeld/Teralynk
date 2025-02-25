// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/authController.js

const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");

dotenv.config();

const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.COGNITO_REGION,
});

// ✅ Initialize PostgreSQL Client
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

// ✅ SIGNUP - Register User (Cognito + PostgreSQL)
const signup = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // ✅ Check if user already exists in Cognito
        const existingUsers = await cognito.listUsers({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Filter: `email = "${email}"`,
        }).promise();

        if (existingUsers.Users.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        // ✅ Register User in Cognito
        const params = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: username,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        };

        const cognitoResponse = await cognito.signUp(params).promise();
        const cognitoId = cognitoResponse.UserSub; // ✅ Extract Cognito User ID

        // ✅ Insert into PostgreSQL Database
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (cognito_id, email, name, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, name, created_at;
        `;

        const result = await dbClient.query(query, [cognitoId, email, username, hashedPassword]);

        res.json({
            message: "Signup successful. Please check your email to verify your account.",
            user: result.rows[0],
        });

    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(400).json({ error: error.message });
    }
};

// ✅ LOGIN - Authenticate User (Cognito)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

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
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        });

        res.json({
            message: "Login successful",
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
};

// ✅ REFRESH TOKEN
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        const params = {
            AuthFlow: "REFRESH_TOKEN_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        };

        const response = await cognito.initiateAuth(params).promise();

        res.json({
            accessToken: response.AuthenticationResult.AccessToken,
        });
    } catch (error) {
        console.error("❌ Refresh Token Error:", error);
        res.clearCookie("refreshToken");
        res.status(401).json({ error: "Invalid refresh token" });
    }
};

// ✅ LOGOUT - Clear Refresh Token
const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("❌ Logout Error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
};

// ✅ CHECK AUTH STATUS
const status = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = jwt.decode(token);
        res.json({ message: "Authenticated", user: decoded });
    } catch (error) {
        console.error("❌ Status Check Error:", error);
        res.status(500).json({ error: "Authentication check failed" });
    }
};

// ✅ PASSWORD RESET REQUEST
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const params = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
        };

        await cognito.forgotPassword(params).promise();
        res.json({ message: "Password reset instructions sent to email" });

    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        res.status(500).json({ error: "Failed to initiate password reset" });
    }
};

// ✅ PASSWORD RESET CONFIRMATION
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: "Email, code, and new password are required" });
        }

        const params = {
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
        };

        await cognito.confirmForgotPassword(params).promise();
        res.json({ message: "Password reset successful. You can now login with your new password." });

    } catch (error) {
        console.error("❌ Reset Password Error:", error);
        res.status(500).json({ error: "Password reset failed" });
    }
};

// ✅ DELETE USER
const deleteUser = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        await cognito.adminDeleteUser({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
        }).promise();

        await dbClient.query("DELETE FROM users WHERE name = $1", [username]);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("❌ Delete User Error:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

module.exports = { signup, login, refresh, logout, status, forgotPassword, resetPassword, deleteUser };
