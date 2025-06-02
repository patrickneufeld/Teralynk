import { dbClient } from "../config/db.mjs";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

// Fetch All APIs
export const getAllAPIs = async (req, res) => {
  try {
    const result = await dbClient.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
    res.json({ apis: result.rows });
  } catch (error) {
    console.error("❌ Error fetching APIs from marketplace:", error.message);
    res.status(500).json({ error: "Failed to fetch marketplace APIs" });
  }
};

// Fetch a Single API by ID
export const getAPIById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "API not found" });
    }

    res.json({ api: result.rows[0] });
  } catch (error) {
    console.error("❌ Error fetching API by ID:", error.message);
    res.status(500).json({ error: "Failed to fetch API details" });
  }
};

// Add a New API to the Marketplace
export const addMarketplaceAddon = async (req, res) => {
  const { name, description, type, api_url, username, password, addedBy } = req.body;
  try {
    const query = `
      INSERT INTO marketplace_addons (id, name, description, type, api_url, username, password, added_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *;
    `;

    const result = await dbClient.query(query, [
      uuidv4(),
      name,
      description,
      type,
      api_url || null,
      username || null,
      password || null,
      addedBy,
    ]);

    res.json({ message: "API added to marketplace successfully", api: result.rows[0] });
  } catch (error) {
    console.error("❌ Error adding API to marketplace:", error.message);
    res.status(500).json({ error: "Failed to add API to the marketplace" });
  }
};

// Update an Existing API
export const updateMarketplaceAddon = async (req, res) => {
  const { id } = req.params;
  const { name, description, type, api_url, username, password, updatedBy } = req.body;
  try {
    const query = `
      UPDATE marketplace_addons 
      SET name = $1, description = $2, type = $3, api_url = $4, username = $5, 
          password = $6, updated_by = $7, updated_at = NOW()
      WHERE id = $8 
      RETURNING *;
    `;

    const result = await dbClient.query(query, [
      name,
      description,
      type,
      api_url || null,
      username || null,
      password || null,
      updatedBy,
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "API not found" });
    }

    res.json({ message: "API updated successfully", api: result.rows[0] });
  } catch (error) {
    console.error("❌ Error updating API:", error.message);
    res.status(500).json({ error: "Failed to update marketplace API" });
  }
};

// Delete an API from the Marketplace
export const deleteMarketplaceAddon = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbClient.query("DELETE FROM marketplace_addons WHERE id = $1 RETURNING *;", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "API not found" });
    }

    res.json({ message: "API deleted successfully", api: result.rows[0] });
  } catch (error) {
    console.error("❌ Error deleting API:", error.message);
    res.status(500).json({ error: "Failed to delete marketplace API" });
  }
};

// Purchase an API
export const purchaseAPI = async (req, res) => {
  const { addonId, userId } = req.body;
  try {
    // Check if the API exists
    const apiExists = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [addonId]);
    if (apiExists.rows.length === 0) {
      return res.status(404).json({ error: "API not found" });
    }

    // Insert into purchases table
    const query = `
      INSERT INTO user_purchases (id, user_id, addon_id, purchased_at)
      VALUES ($1, $2, $3, NOW()) RETURNING *;
    `;
    const result = await dbClient.query(query, [uuidv4(), userId, addonId]);

    res.json({ message: "API purchased successfully", purchase: result.rows[0] });
  } catch (error) {
    console.error("❌ Error purchasing API:", error.message);
    res.status(500).json({ error: "Failed to complete purchase" });
  }
};

// Rate an API
export const rateAPI = async (req, res) => {
  const { addonId, userId, rating, review } = req.body;
  try {
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5" });
    }

    const query = `
      INSERT INTO marketplace_reviews (id, addon_id, user_id, rating, review, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *;
    `;

    const result = await dbClient.query(query, [uuidv4(), addonId, userId, rating, review || null]);

    res.json({ message: "Review submitted successfully", review: result.rows[0] });
  } catch (error) {
    console.error("❌ Error submitting review:", error.message);
    res.status(500).json({ error: "Failed to submit review" });
  }
};

// Delete a Review
export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbClient.query("DELETE FROM marketplace_reviews WHERE id = $1 RETURNING *;", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ message: "Review deleted successfully", review: result.rows[0] });
  } catch (error) {
    console.error("❌ Error deleting review:", error.message);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

// Fetch All Reviews for a Specific Add-On
export const getAddonReviews = async (req, res) => {
  const { addonId } = req.params;
  try {
    const result = await dbClient.query(
      `SELECT * FROM marketplace_reviews WHERE addon_id = $1 ORDER BY created_at DESC`,
      [addonId]
    );
    res.json({ reviews: result.rows });
  } catch (error) {
    console.error("❌ Error fetching reviews for add-on:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Fetch All Reviews Across All Add-Ons
export const getAllReviews = async (req, res) => {
  try {
    const result = await dbClient.query(`SELECT * FROM marketplace_reviews ORDER BY created_at DESC`);
    res.json({ reviews: result.rows });
  } catch (error) {
    console.error("❌ Error fetching all reviews:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};
