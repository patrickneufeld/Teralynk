import { getUserRole, revokeToken } from "../services/auth/authService.mjs";
import { getUserById, updateUserDetails, createUser, deleteUserById } from "../services/userService.mjs";

/**
 * @route POST /api/users
 * @desc Store a new user
 * @access Private (requires authentication)
 */
export const storeUserService = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({ 
                error: "Email, username and password are required" 
            });
        }

        // Check if user already exists
        const existingUser = await getUserById(email);
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        // Create new user
        const newUser = await createUser({ email, username, password });
        res.status(201).json(newUser);
    } catch (error) {
        console.error("❌ Error creating user:", error.message);
        res.status(500).json({ error: "Failed to create user" });
    }
};

/**
 * @route GET /api/users/:id
 * @desc Get user details by ID
 * @access Private (requires authentication)
 */
export const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove sensitive information
        const sanitizedUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json(sanitizedUser);
    } catch (error) {
        console.error("❌ Error fetching user details:", error.message);
        res.status(500).json({ error: "Failed to fetch user details" });
    }
};

/**
 * @route PUT /api/users/:id
 * @desc Update user details
 * @access Private (requires authentication)
 */
export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, username, password } = req.body;

        // Validate at least one field to update
        if (!email && !username && !password) {
            return res.status(400).json({ 
                error: "At least one field (email, username, or password) is required" 
            });
        }

        // Check if user exists
        const existingUser = await getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify user has permission to update
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized to update this user" });
        }

        const updatedUser = await updateUserDetails(userId, { email, username, password });
        res.json(updatedUser);
    } catch (error) {
        console.error("❌ Error updating user details:", error.message);
        res.status(500).json({ error: "Failed to update user details" });
    }
};

/**
 * @route DELETE /api/users/:id
 * @desc Delete a user
 * @access Private (requires authentication and admin rights)
 */
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Verify admin rights
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized to delete users" });
        }

        const result = await deleteUserById(userId);
        if (!result) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User successfully deleted" });
    } catch (error) {
        console.error("❌ Error deleting user:", error.message);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

/**
 * @route POST /api/users/logout
 * @desc Log the user out and revoke their token
 * @access Private (requires authentication)
 */
export const logoutUser = (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (token) {
            revokeToken(token);
        }

        res.json({ message: "Logout successful, token revoked" });
    } catch (error) {
        console.error("❌ Logout Error:", error.message);
        res.status(500).json({ error: "Failed to log out" });
    }
};

/**
 * @route GET /api/users/role/:id
 * @desc Fetch the role of a user by their ID
 * @access Private (requires authentication)
 */
export const getUserRoleById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const role = getUserRole(user);
        res.json({ role });
    } catch (error) {
        console.error("❌ Error fetching user role:", error.message);
        res.status(500).json({ error: "Failed to fetch user role" });
    }
};