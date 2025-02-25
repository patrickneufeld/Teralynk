// ✅ FILE: backend/routes/authRoutes.js

const express = require("express");
const {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    GetUserCommand,
    GlobalSignOutCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ResendConfirmationCodeCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const router = express.Router();

// ✅ Initialize AWS Cognito Client
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

/**
 * ✅ @route POST /api/auth/login
 * ✅ Authenticate user with AWS Cognito
 * ✅ Public Access
 */
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    console.log("🔹 Received login request:", { username });

    try {
        const params = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password
            },
        };

        console.log("🔹 Cognito Auth Request Params:", params);

        const command = new InitiateAuthCommand(params);
        const authResult = await cognito.send(command);

        console.log("✅ Cognito Response:", JSON.stringify(authResult, null, 2));

        res.status(200).json({
            message: "Login successful",
            accessToken: authResult.AuthenticationResult.AccessToken,
            idToken: authResult.AuthenticationResult.IdToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
        });
    } catch (error) {
        console.error("❌ Authentication Error:", error);
        console.error("🔹 AWS Error Response:", JSON.stringify(error, null, 2));

        return res.status(401).json({ error: "Authentication failed", details: error.message });
    }
});

/**
 * ✅ @route POST /api/auth/register
 * ✅ Register a new user in AWS Cognito
 * ✅ Public Access
 */
router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password, and email are required" });
    }

    try {
        // ✅ Step 1: Create user in Cognito
        const createUserCommand = new AdminCreateUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "email_verified", Value: "true" }
            ],
            MessageAction: "SUPPRESS",
        });

        await cognito.send(createUserCommand);

        // ✅ Step 2: Set the user's permanent password
        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            Password: password,
            Permanent: true,
        });

        await cognito.send(setPasswordCommand);

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "User registration failed", details: error.message });
    }
});

/**
 * ✅ @route POST /api/auth/logout
 * ✅ Logs out the user by invalidating the session
 * ✅ Requires Authorization Token
 */
router.post("/logout", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const command = new GlobalSignOutCommand({ AccessToken: token });
        await cognito.send(command);

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("❌ Logout Error:", error);
        res.status(500).json({ error: "Logout failed", details: error.message });
    }
});

/**
 * ✅ @route GET /api/auth/status
 * ✅ Checks the user's authentication status
 * ✅ Requires Authorization Token
 */
router.get("/status", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const command = new GetUserCommand({ AccessToken: token });
        const user = await cognito.send(command);

        res.status(200).json({ message: "User is authenticated", user });
    } catch (error) {
        console.error("❌ Auth Check Error:", error);
        res.status(500).json({ error: "Failed to verify authentication", details: error.message });
    }
});

/**
 * ✅ @route POST /api/auth/reset-password
 * ✅ Allows an admin to reset a user's password
 * ✅ Admin Access Required
 */
router.post("/reset-password", async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ error: "Username and new password are required" });
    }

    try {
        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: username,
            Password: newPassword,
            Permanent: true,
        });

        await cognito.send(setPasswordCommand);

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("❌ Password Reset Error:", error);
        res.status(500).json({ error: "Password reset failed", details: error.message });
    }
});

/**
 * ✅ @route POST /api/auth/forgot-password
 * ✅ Sends a password reset code to the user
 * ✅ Public Access
 */
router.post("/forgot-password", async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const command = new ForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: username,
        });

        await cognito.send(command);

        res.status(200).json({ message: "Password reset code sent" });
    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        res.status(500).json({ error: "Failed to send password reset code", details: error.message });
    }
});

module.exports = router;
