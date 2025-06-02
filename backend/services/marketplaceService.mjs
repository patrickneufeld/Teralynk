// ✅ FILE: backend/src/services/marketplaceService.js

const { db } = require("../config/database");

class MarketplaceService {
    static async getAllAddOns() {
        try {
            const result = await db.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
            return result.rows;
        } catch (err) {
            throw new Error("Database error: Unable to fetch add-ons.");
        }
    }

    static async addNewAddOn({ name, description, type, api_url, username, password, addedBy }) {
        try {
            const result = await db.query(
                "INSERT INTO marketplace_addons (name, description, type, api_url, username, password, added_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
                [name, description, type, api_url, username, password, addedBy]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error("Database error: Unable to add new service.");
        }
    }

    static async listForSale({ name, description, api_url, price, seller }) {
        try {
            const result = await db.query(
                "INSERT INTO marketplace_sales (name, description, api_url, price, seller) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [name, description, api_url, price, seller]
            );
            return result.rows[0];
        } catch (err) {
            throw new Error("Database error: Unable to list API for sale.");
        }
    }
}

module.exports = { MarketplaceService };
