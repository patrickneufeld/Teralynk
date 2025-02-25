// ✅ FILE PATH: backend/src/routes/serviceRoutes.js

const express = require("express");
const router = express.Router();
const { addUserService, getAvailableServices } = require("../controllers/serviceController");

// ✅ Route to Add a New AI or Storage Service (Global)
router.post("/add-service", addUserService);

// ✅ Route to Get All Available AI & Storage Services
router.get("/available-services", getAvailableServices);

module.exports = router;
