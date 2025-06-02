// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiAccessControl.js

import { getAllStorageProviders } from "../config/dynamicStorageManager.mjs";
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

// Default access roles
const defaultRoles = ["owner", "editor", "viewer", "restricted"];

/**
 * Grants or updates storage access permissions for a user.
 * @param {string} ownerId - The owner of the storage.
 * @param {string} userId - The user receiving permissions.
 * @param {string} provider - The storage provider.
 * @param {string} accessLevel - The access level (owner, editor, viewer, restricted).
 * @returns {object} - AI-driven access permission status.
 */
const setUserStorageAccess = async (ownerId, userId, provider, accessLevel) => {
  console.log(`🔑 AI granting '${accessLevel}' access to user: ${userId} on provider: ${provider}`);

  if (!defaultRoles.includes(accessLevel)) {
    throw new Error(`❌ Invalid access level: ${accessLevel}. Available roles: ${defaultRoles.join(", ")}`);
  }

  const storageProviders = getAllStorageProviders();

  if (!storageProviders[provider]) {
    throw new Error(`❌ Storage provider '${provider}' does not exist.`);
  }

  let accessResponse = {};

  // AI-generated permission granting strategy
  const aiPrompt = `Grant '${accessLevel}' access to user:
  - Owner ID: ${ownerId}
  - User ID: ${userId}
  - Storage Provider: ${provider}
  - Available Roles: ${JSON.stringify(defaultRoles)}

  Validate the access level, update permissions accordingly, and return a confirmation message in JSON format.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    accessResponse = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store access control actions
    await aiLearningManager.logAILearning(ownerId, "storage_access_granted", { userId, provider, accessLevel });

    console.log(`✅ AI Access Control Update: ${JSON.stringify(accessResponse)}`);
    return accessResponse;
  } catch (error) {
    console.error("❌ Error setting user storage access:", error.message);
    throw new Error("AI access control update failed.");
  }
};

/**
 * Revokes storage access permissions from a user.
 * @param {string} ownerId - The owner revoking access.
 * @param {string} userId - The user losing access.
 * @param {string} provider - The storage provider.
 * @returns {object} - AI-driven access revocation status.
 */
const revokeUserStorageAccess = async (ownerId, userId, provider) => {
  console.log(`🚫 AI revoking storage access for user: ${userId} on provider: ${provider}`);

  const storageProviders = getAllStorageProviders();

  if (!storageProviders[provider]) {
    throw new Error(`❌ Storage provider '${provider}' does not exist.`);
  }

  let revocationResponse = {};

  // AI-generated access revocation strategy
  const aiPrompt = `Revoke access from user:
  - Owner ID: ${ownerId}
  - User ID: ${userId}
  - Storage Provider: ${provider}

  Validate the request, remove access, and confirm the revocation in JSON format.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    revocationResponse = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store access revocation event
    await aiLearningManager.logAILearning(ownerId, "storage_access_revoked", { userId, provider });

    console.log(`✅ AI Access Revocation Update: ${JSON.stringify(revocationResponse)}`);
    return revocationResponse;
  } catch (error) {
    console.error("❌ Error revoking user storage access:", error.message);
    throw new Error("AI access revocation failed.");
  }
};

/**
 * Retrieves the current storage access permissions for a user.
 * @param {string} userId - The user requesting access details.
 * @returns {object} - AI-driven access summary.
 */
const getUserStoragePermissions = async (userId) => {
  console.log(`📜 AI retrieving storage permissions for user: ${userId}`);

  const storageProviders = getAllStorageProviders();
  let permissionsReport = {};

  // AI-generated permissions report strategy
  const aiPrompt = `Retrieve storage permissions:
  - User ID: ${userId}
  - Storage Providers: ${JSON.stringify(storageProviders, null, 2)}

  List all storage access rights, including assigned roles. Respond in JSON format.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    permissionsReport = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store user access permissions
    await aiLearningManager.logAILearning(userId, "storage_permissions_checked", { permissionsReport });

    console.log(`✅ AI Storage Permission Report: ${JSON.stringify(permissionsReport)}`);
    return permissionsReport;
  } catch (error) {
    console.error("❌ Error retrieving storage permissions:", error.message);
    throw new Error("AI storage permission retrieval failed.");
  }
};

/**
 * Generates AI-driven access recommendations based on usage patterns.
 * @param {string} userId - The user receiving recommendations.
 * @returns {object} - AI-generated access recommendations.
 */
const recommendStorageAccessChanges = async (userId) => {
  console.log(`📊 AI analyzing access control recommendations for user: ${userId}`);

  const currentPermissions = await getUserStoragePermissions(userId);
  let recommendationPlan = {};

  // AI-generated recommendation strategy
  const aiPrompt = `Recommend storage access adjustments:
  - User ID: ${userId}
  - Current Permissions: ${JSON.stringify(currentPermissions, null, 2)}

  Suggest improvements to access levels, role-based permissions, and security enhancements.
  Respond in JSON format.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    recommendationPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store access recommendations
    await aiLearningManager.logAILearning(userId, "storage_access_recommendations", { recommendationPlan });

    console.log(`✅ AI Access Recommendation Report: ${JSON.stringify(recommendationPlan)}`);
    return recommendationPlan;
  } catch (error) {
    console.error("❌ Error generating storage access recommendations:", error.message);
    throw new Error("AI access recommendation failed.");
  }
};

export {
  setUserStorageAccess,
  revokeUserStorageAccess,
  getUserStoragePermissions,
  recommendStorageAccessChanges,
};
