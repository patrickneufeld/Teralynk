import { db } from "../db/index.mjs";

/**
 * Update the storage usage for a user.
 * @param {string} userId - ID of the user whose storage is being updated.
 * @param {number} sizeDelta - Change in storage size (positive for additions, negative for deletions).
 * @returns {Promise<void>}
 */
export const updateStorageUsage = async (userId, sizeDelta) => {
    try {
        const query = `
            INSERT INTO storage_usage (user_id, storage_used, last_updated)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                storage_used = storage_usage.storage_used + $2,
                last_updated = NOW();
        `;
        await db.query(query, [userId, sizeDelta]);
    } catch (error) {
        throw new Error(`Failed to update storage usage: ${error.message}`);
    }
};

/**
 * Retrieve a user's storage usage.
 * @param {string} userId - ID of the user.
 * @returns {Promise<Object>} User's storage details, including storage used and quota.
 */
export const getStorageUsage = async (userId) => {
    try {
        const query = `
            SELECT user_id, storage_used, storage_quota
            FROM storage_usage
            WHERE user_id = $1;
        `;
        const result = await db.query(query, [userId]);
        if (result.rows.length === 0) {
            throw new Error("Storage usage record not found for the user.");
        }
        return result.rows[0];
    } catch (error) {
        throw new Error(`Failed to retrieve storage usage: ${error.message}`);
    }
};

/**
 * Check if a user has sufficient storage quota for an operation.
 * @param {string} userId - ID of the user.
 * @param {number} sizeDelta - Size of the operation in bytes.
 * @returns {Promise<boolean>} True if the user has enough quota, otherwise false.
 */
export const hasSufficientStorage = async (userId, sizeDelta) => {
    try {
        const usage = await getStorageUsage(userId);
        const remainingQuota = usage.storage_quota - usage.storage_used;
        return remainingQuota >= sizeDelta;
    } catch (error) {
        throw new Error(`Failed to check storage quota: ${error.message}`);
    }
};
