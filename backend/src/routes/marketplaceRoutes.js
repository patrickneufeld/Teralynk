// ✅ FILE PATH: backend/src/routes/marketplaceRoutes.js

const express = require("express");
const router = express.Router();
const {
    getAllAPIs,
    addAPI,
    purchaseAPI,
    rateAPI,
} = require("../controllers/marketplaceController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Route to Get All APIs Listed in the Marketplace
router.get("/list", getAllAPIs);

// ✅ Route to Add a New API (Requires Authentication)
router.post("/add", authMiddleware, addAPI);

// ✅ Route to Purchase an API (Requires Authentication)
router.post("/purchase/:apiId", authMiddleware, purchaseAPI);

// ✅ Route to Rate an API
router.post("/rate/:apiId", authMiddleware, rateAPI);

module.exports = router;
