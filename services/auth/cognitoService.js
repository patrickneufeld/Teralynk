// File: /backend/services/cognitoService.js

const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const { recordActivity } = require('../activityLogService');

dotenv.config();

// **Initialize AWS Cognito Identity Provider**
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION || 'us-east-1',
});

// **Verify User Role**
const verifyUserRole = async (userId, role) => {
    try {
        const params = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID, // Cognito User Pool ID
            Username: userId, // Cognito User ID
        };

        const user = await cognitoIdentityServiceProvider.adminGetUser(params).promise();
        const userGroups = user.UserAttributes.find((attr) => attr.Name === 'cognito:groups')?.Value || '';

        const hasRole = userGroups.split(',').includes(role);

        await recordActivity(userId, 'verifyUserRole', null, { role, hasRole });

        console.log(`Role verification for user ${userId}: ${hasRole ? 'Success' : 'Failed'}`);
        return hasRole;
    } catch (error) {
        console.error(`Error verifying role ${role} for user ${userId}:`, error);
        throw new Error('Failed to verify user role.');
    }
};

// **Get User Attributes from Cognito**
const getUserAttributes = async (userId) => {
    try {
        const params = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID, // Cognito User Pool ID
            Username: userId, // Cognito User ID
        };

        const user = await cognitoIdentityServiceProvider.adminGetUser(params).promise();

        const attributes = user.UserAttributes.reduce((acc, attr) => {
            acc[attr.Name] = attr.Value;
            return acc;
        }, {});

        await recordActivity(userId, 'getUserAttributes', null, attributes);

        console.log(`Attributes retrieved for user ${userId}:`, attributes);
        return attributes;
    } catch (error) {
        console.error(`Error retrieving attributes for user ${userId}:`, error);
        throw new Error('Failed to retrieve user attributes.');
    }
};

// **List Users in a Cognito Group**
const listUsersInGroup = async (groupName) => {
    try {
        const params = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            GroupName: groupName,
        };

        const response = await cognitoIdentityServiceProvider.listUsersInGroup(params).promise();

        const users = response.Users.map((user) => ({
            username: user.Username,
            attributes: user.Attributes.reduce((acc, attr) => {
                acc[attr.Name] = attr.Value;
                return acc;
            }, {}),
        }));

        console.log(`Users in group ${groupName}:`, users);
        return users;
    } catch (error) {
        console.error(`Error listing users in group ${groupName}:`, error);
        throw new Error('Failed to list users in group.');
    }
};

module.exports = {
    verifyUserRole,
    getUserAttributes,
    listUsersInGroup,
};
