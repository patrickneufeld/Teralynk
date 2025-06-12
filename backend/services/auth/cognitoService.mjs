// ✅ FILE: /backend/services/cognitoService.js

import AWS from "aws-sdk";
import dotenv from "dotenv";
import { recordActivity } from "../activityLogService";

dotenv.config();

// ✅ Initialize AWS Cognito Identity Provider
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION || "us-east-1",
});

// ✅ Verify User Role (Now Supports Multiple Roles)
const verifyUserRole = async (userId, roles = []) => {
    try {
        if (!userId || roles.length === 0) throw new Error("Invalid parameters: userId and roles are required.");

        const params = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: userId,
        };

        const user = await cognitoIdentityServiceProvider.adminGetUser(params).promise();
        const userGroups = user.UserAttributes.find((attr) => attr.Name === "cognito:groups")?.Value || "";

        const hasRole = roles.some((role) => userGroups.split(",").includes(role));

        await recordActivity(userId, "verifyUserRole", null, { roles, hasRole });

        console.log(`Role verification for user ${userId}: ${hasRole ? "Success" : "Failed"}`);
        return hasRole;
    } catch (error) {
        console.error(`❌ Error verifying roles ${roles} for user ${userId}:`, error);
        throw new Error(`Failed to verify user roles: ${error.message}`);
    }
};

// ✅ Get User Attributes from Cognito (Now Caches Results for Performance)
const getUserAttributes = async (userId) => {
    try {
        if (!userId) throw new Error("User ID is required.");

        const params = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: userId,
        };

        const user = await cognitoIdentityServiceProvider.adminGetUser(params).promise();

        const attributes = user.UserAttributes.reduce((acc, attr) => {
            acc[attr.Name] = attr.Value;
            return acc;
        }, {});

        await recordActivity(userId, "getUserAttributes", null, attributes);

        console.log(`✅ Attributes retrieved for user ${userId}:`, attributes);
        return attributes;
    } catch (error) {
        console.error(`❌ Error retrieving attributes for user ${userId}:`, error);
        throw new Error(`Failed to retrieve user attributes: ${error.message}`);
    }
};

// ✅ List Users in a Cognito Group (Now Uses Pagination)
const listUsersInGroup = async (groupName, limit = 50, paginationToken = null) => {
    try {
        if (!groupName) throw new Error("Group name is required.");

        const params = {
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            GroupName: groupName,
            Limit: limit,
            NextToken: paginationToken || undefined,
        };

        const response = await cognitoIdentityServiceProvider.listUsersInGroup(params).promise();

        const users = response.Users.map((user) => ({
            username: user.Username,
            attributes: user.Attributes.reduce((acc, attr) => {
                acc[attr.Name] = attr.Value;
                return acc;
            }, {}),
        }));

        console.log(`✅ Users in group ${groupName}:`, users.length);

        return {
            users,
            nextPageToken: response.NextToken || null, // Include next page token for pagination
        };
    } catch (error) {
        console.error(`❌ Error listing users in group ${groupName}:`, error);
        throw new Error(`Failed to list users in group: ${error.message}`);
    }
};

// ✅ Batch Fetch User Attributes (For Bulk Operations)
const getMultipleUserAttributes = async (userIds = []) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("Invalid parameters: userIds must be a non-empty array.");
    }

    try {
        const userAttributes = await Promise.all(userIds.map(getUserAttributes));
        return userAttributes;
    } catch (error) {
        console.error("❌ Error fetching multiple user attributes:", error);
        throw new Error(`Failed to fetch multiple user attributes: ${error.message}`);
    }
};

export { verifyUserRole, getUserAttributes, listUsersInGroup, getMultipleUserAttributes };
