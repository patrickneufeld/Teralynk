// ✅ FILE PATH: backend/src/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const { storeUserService } = require("../controllers/userController");

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
