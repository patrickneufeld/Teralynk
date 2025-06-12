import { User } from "../models/UserModel.mjs"; // Adjust the import path as necessary

/**
 * ✅ Create New User
 * @param {Object} userData - User data including email, username, and password
 * @returns {Promise<Object>} - The created user object
 */
export const createUser = async (userData) => {
    try {
        const newUser = new User(userData);
        const savedUser = await newUser.save();
        
        if (!savedUser) {
            throw new Error("Failed to create user");
        }
        
        return savedUser;
    } catch (error) {
        console.error("❌ Error creating user:", error);
        if (error.code === 11000) { // MongoDB duplicate key error
            throw new Error("User with this email already exists");
        }
        throw new Error("Failed to create user");
    }
};

/**
 * ✅ Get User by ID
 * @param {string} userId - The user's unique ID (Cognito userSub)
 * @returns {Promise<Object|null>} - The user object or null if not found
 */
export const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
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
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updates, 
            { new: true, runValidators: true }
        );
        
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
        const result = await User.findByIdAndDelete(userId);
        if (!result) {
            throw new Error("User not found");
        }
        return true;
    } catch (error) {
        console.error("❌ Error deleting user by ID:", error);
        throw new Error("Failed to delete user.");
    }
};