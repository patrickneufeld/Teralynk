const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;

// Cognito configuration
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1', // Replace with your AWS region
});

// User Pool and App Client IDs
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

if (!JWT_SECRET) {
    console.error('❌ Environment variable JWT_SECRET is not set.');
    process.exit(1);
}

if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error('Cognito User Pool ID and Client ID must be set in environment variables.');
}

// JWT-based functions

/**
 * Generate a JWT token for a user
 * @param {object} user - The user object containing user details.
 * @param {string} user.id - The user's ID.
 * @param {string} user.role - The user's role.
 * @returns {string} - The generated JWT token.
 */
const generateToken = (user) => {
    try {
        return jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Error generating JWT token');
    }
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify.
 * @returns {object} - The decoded token payload.
 * @throws {Error} - If the token is invalid or expired.
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Error verifying token:', error);
        throw new Error('Invalid or expired token');
    }
};

/**
 * Check if a user has a specific role
 * @param {string} userRole - The role of the user.
 * @param {string} requiredRole - The required role for access.
 * @returns {boolean} - Whether the user has the required role.
 */
const hasRole = (userRole, requiredRole) => {
    return userRole === requiredRole;
};

// Cognito-based functions

/**
 * Sign Up a new user
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @param {string} email - The user's email.
 */
async function signUp(username, password, email) {
    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        Password: password,
        UserAttributes: [
            { Name: 'email', Value: email },
        ],
    };

    try {
        return await cognito.signUp(params).promise();
    } catch (error) {
        console.error('Error during sign up:', error);
        throw new Error('Error during sign up');
    }
}

/**
 * Confirm Sign Up
 * @param {string} username - The user's username.
 * @param {string} confirmationCode - The confirmation code sent by Cognito.
 */
async function confirmSignUp(username, confirmationCode) {
    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        ConfirmationCode: confirmationCode,
    };

    try {
        return await cognito.confirmSignUp(params).promise();
    } catch (error) {
        console.error('Error confirming sign up:', error);
        throw new Error('Error confirming sign up');
    }
}

/**
 * Sign In a user
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 */
async function signIn(username, password) {
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };

    try {
        return await cognito.initiateAuth(params).promise();
    } catch (error) {
        console.error('Error during sign in:', error);
        throw new Error('Error during sign in');
    }
}

/**
 * Forgot Password
 * @param {string} username - The user's username.
 */
async function forgotPassword(username) {
    const params = {
        ClientId: CLIENT_ID,
        Username: username,
    };

    try {
        return await cognito.forgotPassword(params).promise();
    } catch (error) {
        console.error('Error during forgot password:', error);
        throw new Error('Error during forgot password');
    }
}

/**
 * Confirm Password Reset
 * @param {string} username - The user's username.
 * @param {string} confirmationCode - The confirmation code sent by Cognito.
 * @param {string} newPassword - The new password to set.
 */
async function confirmForgotPassword(username, confirmationCode, newPassword) {
    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
    };

    try {
        return await cognito.confirmForgotPassword(params).promise();
    } catch (error) {
        console.error('Error confirming forgot password:', error);
        throw new Error('Error confirming forgot password');
    }
}

module.exports = {
    generateToken,
    verifyToken,
    hasRole,
    signUp,
    confirmSignUp,
    signIn,
    forgotPassword,
    confirmForgotPassword,
};
