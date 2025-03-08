import { dbClient } from "../config/db.js";

/**
 * ✅ Service Functions to Handle Marketplace Operations
 */

// ✅ Fetch All APIs
export const getAllAPIs = async () => {
  try {
    const result = await dbClient.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching APIs from marketplace:", error.message);
    throw new Error("Failed to fetch marketplace APIs.");
  }
};

// ✅ Fetch a Single API by ID
export const getAPIById = async (id) => {
  try {
    const result = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      throw new Error("API not found.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error fetching API by ID:", error.message);
    throw new Error("Failed to fetch API details.");
  }
};

// ✅ Add a New API to the Marketplace
export const addMarketplaceAddon = async ({ name, description, type, api_url, username, password, addedBy }) => {
  try {
    const query = `
      INSERT INTO marketplace_addons (name, description, type, api_url, username, password, added_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *;
    `;

    const result = await dbClient.query(query, [
      name,
      description,
      type,
      api_url || null,
      username || null,
      password || null,
      addedBy,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error adding API to marketplace:", error.message);
    throw new Error("Failed to add API to the marketplace.");
  }
};

// ✅ Update an Existing API
export const updateMarketplaceAddon = async (id, { name, description, type, api_url, username, password, updatedBy }) => {
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
      throw new Error("API not found.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error updating API:", error.message);
    throw new Error("Failed to update marketplace API.");
  }
};

// ✅ Delete an API from the Marketplace
export const deleteMarketplaceAddon = async (id) => {
  try {
    const result = await dbClient.query("DELETE FROM marketplace_addons WHERE id = $1 RETURNING *;", [id]);

    if (result.rowCount === 0) {
      throw new Error("API not found.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error deleting API:", error.message);
    throw new Error("Failed to delete marketplace API.");
  }
};

// ✅ Purchase an API
export const purchaseAPI = async (addonId, userId) => {
  try {
    // Check if the API exists
    const apiExists = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [addonId]);
    if (apiExists.rows.length === 0) {
      throw new Error("API not found.");
    }

    // Insert into purchases table
    const query = `
      INSERT INTO user_purchases (user_id, addon_id, purchased_at)
      VALUES ($1, $2, NOW()) RETURNING *;
    `;
    const result = await dbClient.query(query, [userId, addonId]);

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error purchasing API:", error.message);
    throw new Error("Failed to complete purchase.");
  }
};

// ✅ Rate an API
export const rateAPI = async (addonId, userId, { rating, review }) => {
  try {
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Invalid rating. Must be between 1 and 5.");
    }

    const query = `
      INSERT INTO marketplace_reviews (addon_id, user_id, rating, review, created_at)
      VALUES ($1, $2, $3, $4, NOW()) RETURNING *;
    `;

    const result = await dbClient.query(query, [addonId, userId, rating, review || null]);

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error submitting review:", error.message);
    throw new Error("Failed to submit review.");
  }
};

// ✅ Delete a Review
export const deleteReview = async (reviewId) => {
  try {
    const result = await dbClient.query("DELETE FROM marketplace_reviews WHERE id = $1 RETURNING *;", [reviewId]);

    if (result.rowCount === 0) {
      throw new Error("Review not found.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error deleting review:", error.message);
    throw new Error("Failed to delete review.");
  }
};

// ✅ Fetch All Reviews for a Specific Add-On
export const getAddonReviews = async (addonId) => {
  try {
    const result = await dbClient.query(
      `SELECT * FROM marketplace_reviews WHERE addon_id = $1 ORDER BY created_at DESC`,
      [addonId]
    );
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching reviews for add-on:", error.message);
    throw new Error("Failed to fetch reviews.");
  }
};

// ✅ Fetch All Reviews Across All Add-Ons
export const getAllReviews = async () => {
  try {
    const result = await dbClient.query(`SELECT * FROM marketplace_reviews ORDER BY created_at DESC`);
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching all reviews:", error.message);
    throw new Error("Failed to fetch reviews.");
  }
};
