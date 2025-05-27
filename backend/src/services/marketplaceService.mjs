import { dbClient } from "../config/db.mjs";

/**
 * ✅ Marketplace Service Class
 * Handles all marketplace-related database operations.
 */
class MarketplaceService {
  /**
   * ✅ Fetch All AI Add-Ons from the Marketplace
   * @returns {Promise<Array>} - List of all marketplace add-ons
   */
  static async getAllAddOns() {
    try {
      const result = await dbClient.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
      return result.rows;
    } catch (error) {
      console.error("❌ Database error: Unable to fetch add-ons:", error.message);
      return [];
    }
  }

  /**
   * ✅ Fetch All Purchases by a User
   * @param {string} userId - The ID of the user
   * @returns {Promise<Array>} - List of purchases made by the user
   */
  static async fetchUserPurchases(userId) {
    try {
      const result = await dbClient.query(
        `SELECT * FROM user_purchases 
         JOIN marketplace_addons ON user_purchases.addon_id = marketplace_addons.id 
         WHERE user_purchases.user_id = $1
         ORDER BY user_purchases.purchased_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching user purchases:", error.message);
      return [];
    }
  }

  /**
   * ✅ Fetch AI Add-Ons in Bulk
   * @returns {Promise<Array>} - List of marketplace add-ons
   */
  static async fetchMarketplaceAddons() {
    try {
      const result = await dbClient.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching marketplace add-ons:", error.message);
      return [];
    }
  }

  /**
   * ✅ Fetch Most Popular AI Add-Ons
   * @returns {Promise<Array>} - List of popular marketplace add-ons
   */
  static async fetchPopularAddons() {
    try {
      const result = await dbClient.query(`
        SELECT * FROM marketplace_addons 
        ORDER BY (SELECT COUNT(*) FROM marketplace_purchases WHERE marketplace_purchases.addon_id = marketplace_addons.id) DESC
        LIMIT 5;
      `);
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching popular AI add-ons:", error.message);
      return [];
    }
  }

  /**
   * ✅ Fetch AI Add-On Recommendations for a User
   * @param {string} userId - The ID of the user
   * @returns {Promise<Array>} - Recommended add-ons based on user history
   */
  static async fetchRecommendedAddons(userId) {
    try {
      const result = await dbClient.query(`
        SELECT * FROM marketplace_addons 
        WHERE type IN (SELECT type FROM marketplace_purchases 
                       JOIN marketplace_addons ON marketplace_purchases.addon_id = marketplace_addons.id
                       WHERE user_id = $1)
        LIMIT 5;
      `, [userId]);
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching recommended AI add-ons:", error.message);
      return [];
    }
  }

  /**
   * ✅ Fetch Marketplace Analytics
   * @returns {Promise<Object>} - Marketplace statistics
   */
  static async fetchMarketplaceAnalytics() {
    try {
      const result = await dbClient.query(`
        SELECT COUNT(*) AS total_addons, 
               (SELECT COUNT(*) FROM marketplace_purchases) AS total_purchases 
        FROM marketplace_addons;
      `);
      return result.rows[0];
    } catch (error) {
      console.error("❌ Error fetching marketplace analytics:", error.message);
      return null;
    }
  }

  /**
   * ✅ Add a New AI Add-On to the Marketplace
   * @param {Object} addonData - Add-on details
   * @returns {Promise<Object>} - Newly added add-on
   */
  static async addNewAddOn({ name, description, type, api_url, username, password, addedBy }) {
    try {
      const result = await dbClient.query(
        `INSERT INTO marketplace_addons (name, description, type, api_url, username, password, added_by, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
        [name, description, type, api_url, username, password, addedBy]
      );
      return result.rows[0];
    } catch (error) {
      console.error("❌ Database error: Unable to add new service:", error.message);
      throw new Error("Database error: Unable to add new service.");
    }
  }

  /**
   * ✅ Fetch a Single Add-On by ID
   * @param {string} addonId - The ID of the add-on
   * @returns {Promise<Object|null>} - Add-on details
   */
  static async fetchMarketplaceAddonById(addonId) {
    try {
      const result = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [addonId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("❌ Error fetching add-on by ID:", error.message);
      return null;
    }
  }

  /**
   * ✅ Fetch Reviews for a Specific Add-On
   * @param {string} addonId - The ID of the add-on
   * @returns {Promise<Array>} - List of reviews
   */
  static async fetchAddonReviews(addonId) {
    try {
      const result = await dbClient.query(
        `SELECT * FROM marketplace_reviews WHERE addon_id = $1 ORDER BY created_at DESC`,
        [addonId]
      );
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching add-on reviews:", error.message);
      return [];
    }
  }

  /**
   * ✅ Fetch All Reviews for All Add-Ons
   * @returns {Promise<Array>} - List of all reviews
   */
  static async fetchAllReviews() {
    try {
      const result = await dbClient.query("SELECT * FROM marketplace_reviews ORDER BY created_at DESC");
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching all reviews:", error.message);
      return [];
    }
  }

  /**
   * ✅ Submit a Review for an Add-On
   * @param {string} userId - ID of the user submitting the review
   * @param {string} addonId - ID of the add-on being reviewed
   * @param {number} rating - Rating between 1 and 5
   * @param {string} review - Review content
   * @returns {Promise<Object>} - Submitted review
   */
  static async submitReview(userId, addonId, rating, review) {
    try {
      const result = await dbClient.query(
        `INSERT INTO marketplace_reviews (addon_id, user_id, rating, review, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [addonId, userId, rating, review || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error("❌ Error submitting review:", error.message);
      throw new Error("Failed to add review.");
    }
  }

  /**
   * ✅ Delete a Review
   * @param {string} reviewId - ID of the review to delete
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  static async deleteReview(reviewId) {
    try {
      const result = await dbClient.query("DELETE FROM marketplace_reviews WHERE id = $1 RETURNING *", [reviewId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting review:", error.message);
      return false;
    }
  }

  /**
   * ✅ Delete an Add-On
   * @param {string} addonId - ID of the add-on to delete
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  static async deleteMarketplaceAddon(addonId) {
    try {
      const result = await dbClient.query("DELETE FROM marketplace_addons WHERE id = $1 RETURNING *", [addonId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting add-on:", error.message);
      return false;
    }
  }
}

// ✅ Standalone Exports for Routes and Controllers
export const getAllAddOns = MarketplaceService.getAllAddOns;
export const fetchMarketplaceAddons = MarketplaceService.fetchMarketplaceAddons;
export const fetchUserPurchases = MarketplaceService.fetchUserPurchases;
export const fetchPopularAddons = MarketplaceService.fetchPopularAddons;
export const fetchRecommendedAddons = MarketplaceService.fetchRecommendedAddons;
export const fetchMarketplaceAnalytics = MarketplaceService.fetchMarketplaceAnalytics;
export const fetchMarketplaceAddonById = MarketplaceService.fetchMarketplaceAddonById;
export const fetchAddonReviews = MarketplaceService.fetchAddonReviews;
export const fetchAllReviews = MarketplaceService.fetchAllReviews;
export const addMarketplaceAddon = MarketplaceService.addNewAddOn;
export const purchaseAddon = MarketplaceService.purchaseAddon;
export const submitReview = MarketplaceService.submitReview;
export const deleteReview = MarketplaceService.deleteReview;
export const deleteMarketplaceAddon = MarketplaceService.deleteMarketplaceAddon;

// ✅ Default Export for Class
export default MarketplaceService;
