// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/services/userService.js

import { User } from "../models/userModel.js"; // Assuming you're using a Mongoose model or Sequelize model for your DB

/**
 * ✅ Get User by ID
 * @param {string} userId - The user's unique ID (Cognito userSub)
 * @returns {Promise<Object|null>} - The user object or null if not found
 */
export const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId); // Adjust for your DB model (MongoDB or SQL)
        return user;
    } catch (error) {
        console.error("❌ Error getting user by ID:", error);
        throw new Error("Failed to retrieve user.");
    }
};

/**
 * ✅ Update User Details
 * @param {string} userId - The user's unique ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} - The updated user object
 */
export const updateUserDetails = async (userId, updates) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }); // Adjust for your DB model
        if (!updatedUser) {
            throw new Error("User not found");
        }
        return updatedUser;
    } catch (error) {
        console.error("❌ Error updating user details:", error);
        throw new Error("Failed to update user.");
    }
};

/**
 * ✅ Delete User by ID
 * @param {string} userId - The user's unique ID
 * @returns {Promise<boolean>} - True if the user was deleted, false otherwise
 */
export const deleteUserById = async (userId) => {
    try {
        const result = await User.findByIdAndDelete(userId); // Adjust for your DB model
        if (!result) {
            throw new Error("User not found");
        }
        return true;
    } catch (error) {
        console.error("❌ Error deleting user by ID:", error);
        throw new Error("Failed to delete user.");
    }
};
