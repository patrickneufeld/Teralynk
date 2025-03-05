// ✅ FILE PATH: backend/src/routes/marketplaceRoutes.js

import express from "express";
const router = express.Router();
import { getAllAPIs, addAPI, purchaseAPI, rateAPI } from "../controllers/marketplaceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

// ✅ Route to Get All APIs Listed in the Marketplace
router.get("/list", getAllAPIs);

// ✅ Route to Add a New API (Requires Authentication)
router.post("/add", requireAuth, addAPI);

// ✅ Route to Purchase an API (Requires Authentication)
router.post("/purchase/:apiId", requireAuth, purchaseAPI);

// ✅ Route to Rate an API
router.post("/rate/:apiId", requireAuth, rateAPI);

export default router;
