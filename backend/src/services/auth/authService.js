// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/services/authService.js

import cognito from "../config/cognitoConfig.js";
import dotenv from "dotenv";

dotenv.config();

const { COGNITO_APP_CLIENT_ID, COGNITO_USER_POOL_ID } = process.env;

if (!COGNITO_APP_CLIENT_ID || !COGNITO_USER_POOL_ID) {
    console.error("❌ ERROR: Missing required Cognito environment variables.");
    process.exit(1);
}

/**
 * ✅ Sign Up a New User
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} - Cognito signup response
 */
export async function signUpUser(email, password) {
    const params = {
        ClientId: COGNITO_APP_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
    };

    try {
        const result = await cognito.signUp(params).promise();
        return result;
    } catch (error) {
        console.error("❌ Sign Up Error:", error);
        throw new Error(`Sign up failed: ${error.code || "Unknown error"}`);
    }
}

/**
 * ✅ Authenticate User (Login)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - Access & refresh tokens
 */
export async function authenticateUser(email, password) {
    const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_APP_CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    };

    try {
        const result = await cognito.initiateAuth(params).promise();
        return result.AuthenticationResult; // Access Token, Refresh Token
    } catch (error) {
        console.error("❌ Authentication Error:", error);
        throw new Error(`Authentication failed: ${error.code || "Unknown error"}`);
    }
}

/**
 * ✅ Store API Key as a Custom Cognito Attribute
 * @param {string} userSub - Cognito User Sub (Unique ID)
 * @param {string} apiKey - API Key to store
 * @returns {Promise<void>}
 */
export async function storeApiKey(userSub, apiKey) {
    const params = {
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: userSub,
        UserAttributes: [{ Name: "custom:api_key", Value: apiKey }],
    };

    try {
        await cognito.adminUpdateUserAttributes(params).promise();
    } catch (error) {
        console.error("❌ Store API Key Error:", error);
        throw new Error(`Failed to store API key: ${error.code || "Unknown error"}`);
    }
}
