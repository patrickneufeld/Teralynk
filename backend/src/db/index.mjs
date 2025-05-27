// File: /Users/patrick/Projects/Teralynk/backend/src/db/index.js
import pkg from 'pg';
const { Pool } = pkg;

// Configure the database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teralynk',
    password: 'postgres',
    port: 5432,
});

export const db = {
    /**
     * Log an AI interaction (request and response).
     * @param {Object} interaction - The interaction data.
     */
    async logInteraction(interaction) {
        const { userId, platform, request, response, timestamp } = interaction;

        const query = `
            INSERT INTO ai_interactions (user_id, platform, request_payload, response_payload, timestamp)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [userId, platform, request, response, timestamp || new Date()];

        try {
            await pool.query(query, values);
            console.log(`AI interaction logged for user ${userId}`);
        } catch (error) {
            console.error('Error logging AI interaction:', error);
        }
    },

    /**
     * Get the user-specific model data.
     * @param {string} userId - The user's unique identifier.
     * @returns {Object|null} - The user's model data or null if not found.
     */
    async getUserModel(userId) {
        const query = `SELECT model_data FROM user_models WHERE user_id = $1`;
        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0] ? result.rows[0].model_data : null;
        } catch (error) {
            console.error(`Error fetching user model for user ${userId}:`, error);
            return null;
        }
    },

    /**
     * Update the user-specific model data.
     * @param {string} userId - The user's unique identifier.
     * @param {Object} modelData - The updated model data.
     */
    async updateUserModel(userId, modelData) {
        const query = `
            INSERT INTO user_models (user_id, model_data, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET model_data = $2, updated_at = CURRENT_TIMESTAMP
        `;
        try {
            await pool.query(query, [userId, modelData]);
            console.log(`User model updated for user ${userId}`);
        } catch (error) {
            console.error(`Error updating user model for user ${userId}:`, error);
        }
    },

    /**
     * Get the platform-wide model data.
     * @returns {Object|null} - The platform-wide model data or null if not found.
     */
    async getPlatformModel() {
        const query = `SELECT model_data FROM platform_model LIMIT 1`;
        try {
            const result = await pool.query(query);
            return result.rows[0] ? result.rows[0].model_data : null;
        } catch (error) {
            console.error('Error fetching platform model:', error);
            return null;
        }
    },

    /**
     * Update the platform-wide model data.
     * @param {Object} modelData - The updated platform model data.
     */
    async updatePlatformModel(modelData) {
        const query = `
            INSERT INTO platform_model (id, model_data, updated_at)
            VALUES (1, $1, CURRENT_TIMESTAMP)
            ON CONFLICT (id)
            DO UPDATE SET model_data = $1, updated_at = CURRENT_TIMESTAMP
        `;
        try {
            await pool.query(query, [modelData]);
            console.log('Platform model updated');
        } catch (error) {
            console.error('Error updating platform model:', error);
        }
    },
};
// ✅ ADD THIS AT BOTTOM OF FILE
export default pool;
