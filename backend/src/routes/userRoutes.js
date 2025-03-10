import express from "express";
const router = express.Router();
const { storeUserService } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken"); // Import your authentication middleware

// Add a /user/profile route
router.get("/profile", authenticateToken, (req, res) => {
    try {
        const user = req.user; // Assuming req.user is populated by the middleware
        if (user) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
            });
        } else {
            res.status(404).json({ error: "User not found." });
        }
    } catch (err) {
        console.error("Error in /profile route:", err);
        res.status(500).json({ message: "An error occurred while fetching profile data." });
    }
});

// Existing routes
router.post("/add-service", storeUserService);
router.get("/storage", async (req, res) => {
    try {
        const totalStorage = await getUserTotalStorage(req.user.id);
        res.json({ totalStorage });
    } catch (err) {
        res.status(500).json({ message: "Error fetching storage data." });
    }
});

module.exports = router;
