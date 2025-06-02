// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/marketplace.js

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.mjs";
import { validateAdmin } from "../middleware/adminMiddleware.mjs";
import {
  fetchMarketplaceAddons,
  fetchPopularAddons,
  fetchRecommendedAddons,
  addMarketplaceAddon,
  fetchMarketplaceAddonById,
  deleteMarketplaceAddon,
  fetchAddonReviews,
  fetchAllReviews,
  submitReview,
  deleteReview,
  purchaseAddon,
  fetchUserPurchases,
  fetchMarketplaceAnalytics,
} from "../services/marketplaceService.mjs";

const router = express.Router();

/**
 * ✅ GET: Fetch All AI Add-Ons in the Marketplace
 */
router.get("/addons", async (req, res) => {
  try {
    const addons = await fetchMarketplaceAddons();
    res.status(200).json(addons);
  } catch (error) {
    console.error("❌ Error fetching marketplace add-ons:", error.message);
    res.status(500).json({ error: "Failed to retrieve add-ons." });
  }
});

/**
 * ✅ GET: Fetch Most Popular AI Add-Ons
 */
router.get("/addons/popular", async (req, res) => {
  try {
    const addons = await fetchPopularAddons();
    res.status(200).json(addons);
  } catch (error) {
    console.error("❌ Error fetching popular add-ons:", error.message);
    res.status(500).json({ error: "Failed to retrieve popular add-ons." });
  }
});

/**
 * ✅ GET: Fetch AI-Powered Add-On Recommendations for User
 */
router.get("/addons/recommended", requireAuth, async (req, res) => {
  try {
    const recommendations = await fetchRecommendedAddons(req.user.id);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error("❌ Error fetching recommended add-ons:", error.message);
    res.status(500).json({ error: "Failed to retrieve recommendations." });
  }
});

/**
 * ✅ POST: Add a New AI Add-On (Authenticated)
 */
router.post("/addons", requireAuth, async (req, res) => {
  try {
    const { name, description, type, api_url, username, password } = req.body;
    const added_by = req.user?.id || "unknown_user";

    if (!name || !description || !type) {
      return res.status(400).json({ error: "Missing required fields: name, description, or type." });
    }

    const addon = await addMarketplaceAddon({
      name, description, type, api_url, username, password, added_by
    });

    res.status(201).json({ message: "Add-on created successfully!", addon });
  } catch (error) {
    console.error("❌ Error adding marketplace add-on:", error.message);
    res.status(500).json({ error: "Failed to create add-on." });
  }
});

/**
 * ✅ GET: Fetch a Single Add-on by ID
 */
router.get("/addons/:id", async (req, res) => {
  try {
    const addon = await fetchMarketplaceAddonById(req.params.id);
    if (!addon) {
      return res.status(404).json({ error: "Add-on not found." });
    }
    res.status(200).json(addon);
  } catch (error) {
    console.error("❌ Error fetching add-on:", error.message);
    res.status(500).json({ error: "Failed to retrieve add-on." });
  }
});

/**
 * ✅ DELETE: Remove an Add-on (Admin Only)
 */
router.delete("/addons/:id", requireAuth, validateAdmin, async (req, res) => {
  try {
    const success = await deleteMarketplaceAddon(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Add-on not found." });
    }
    res.status(200).json({ message: "Add-on removed successfully." });
  } catch (error) {
    console.error("❌ Error deleting add-on:", error.message);
    res.status(500).json({ error: "Failed to delete add-on." });
  }
});

/**
 * ✅ POST: Purchase an AI Add-On (Authenticated)
 */
router.post("/addons/:id/purchase", requireAuth, async (req, res) => {
  try {
    const success = await purchaseAddon(req.user.id, req.params.id);
    if (!success) {
      return res.status(400).json({ error: "Purchase failed." });
    }
    res.status(200).json({ message: "Add-on purchased successfully." });
  } catch (error) {
    console.error("❌ Error purchasing add-on:", error.message);
    res.status(500).json({ error: "Failed to complete purchase." });
  }
});

/**
 * ✅ GET: Fetch User Purchase History (Authenticated)
 */
router.get("/purchases", requireAuth, async (req, res) => {
  try {
    const purchases = await fetchUserPurchases(req.user.id);
    res.status(200).json(purchases);
  } catch (error) {
    console.error("❌ Error fetching purchase history:", error.message);
    res.status(500).json({ error: "Failed to retrieve purchases." });
  }
});

/**
 * ✅ GET: Fetch Marketplace Analytics (Admin Only)
 */
router.get("/analytics", requireAuth, validateAdmin, async (req, res) => {
  try {
    const analytics = await fetchMarketplaceAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    console.error("❌ Error fetching marketplace analytics:", error.message);
    res.status(500).json({ error: "Failed to retrieve analytics." });
  }
});

/**
 * ✅ GET: Fetch Reviews for a Specific Add-On
 */
router.get("/addons/:id/reviews", async (req, res) => {
  try {
    const reviews = await fetchAddonReviews(req.params.id);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("❌ Error fetching reviews:", error.message);
    res.status(500).json({ error: "Failed to retrieve reviews." });
  }
});

/**
 * ✅ GET: Fetch All Reviews for All Add-ons
 */
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await fetchAllReviews();
    res.status(200).json(reviews);
  } catch (error) {
    console.error("❌ Error fetching all reviews:", error.message);
    res.status(500).json({ error: "Failed to retrieve reviews." });
  }
});

/**
 * ✅ POST: Submit a Review for an Add-On (Authenticated)
 */
router.post("/addons/:id/reviews", requireAuth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5." });
    }

    const submittedReview = await submitReview(req.user.id, req.params.id, rating, review);
    res.status(201).json({ message: "Review added successfully!", review: submittedReview });
  } catch (error) {
    console.error("❌ Error submitting review:", error.message);
    res.status(500).json({ error: "Failed to add review." });
  }
});

/**
 * ✅ DELETE: Remove a Review (Admin Only)
 */
router.delete("/reviews/:id", requireAuth, validateAdmin, async (req, res) => {
  try {
    const success = await deleteReview(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Review not found." });
    }
    res.status(200).json({ message: "Review deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting review:", error.message);
    res.status(500).json({ error: "Failed to delete review." });
  }
});

export default router;
