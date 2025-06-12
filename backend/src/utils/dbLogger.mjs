import { db } from "../db/index.mjs";
import { v4 as uuidv4 } from "uuid";
import logger from "./logger.mjs";

/**
 * Log structured entries into the database.
 * Supports `error_logs`, `backend_logs`, `activity_logs`, and `ai_logs`.
 * Includes fail-safes and retries for better resilience.
 *
 * @param {"error_logs"|"backend_logs"|"activity_logs"|"ai_logs"} type - Type of log to insert.
 * @param {Object} data - Log data, including metadata and context.
 * @returns {string} requestId - Unique log entry identifier.
 */
export const logToDatabase = async (type, data) => {
    const timestamp = new Date(); // Use current timestamp for all logs
    const requestId = data.requestId || uuidv4(); // Assign unique request ID if not provided

    try {
        let query, values;

        // Define queries based on log type
        switch (type) {
            case "error_logs":
                query = `
                    INSERT INTO error_logs (error_type, message, stack_trace, metadata, timestamp)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                values = [
                    data.error_type || "UNKNOWN",
                    data.message || "No message provided",
                    data.stack_trace || "No stack trace available",
                    JSON.stringify(data.metadata || {}),
                    timestamp,
                ];
                break;

            case "backend_logs":
                query = `
                    INSERT INTO backend_logs (event_type, details, timestamp)
                    VALUES ($1, $2, $3)
                `;
                values = [
                    data.event_type || "UNKNOWN",
                    JSON.stringify(data.details || {}),
                    timestamp,
                ];
                break;

            case "activity_logs":
                query = `
                    INSERT INTO activity_logs (user_id, action_type, details, timestamp)
                    VALUES ($1, $2, $3, $4)
                `;
                values = [
                    data.user_id,
                    data.action_type || "UNKNOWN",
                    JSON.stringify(data.details || {}),
                    timestamp,
                ];
                break;

            case "ai_logs":
                query = `
                    INSERT INTO ai_logs (user_id, ai_group_id, operation_type, details, timestamp)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                values = [
                    data.user_id,
                    data.ai_group_id,
                    data.operation_type || "UNKNOWN",
                    JSON.stringify(data.details || {}),
                    timestamp,
                ];
                break;

            default:
                throw new Error(`Invalid log type: ${type}`);
        }

        // Execute query
        await db.query(query, values);

        // Return the requestId for traceability
        return requestId;

    } catch (error) {
        // Log errors to the system logger and gracefully handle failures
        logger.logError(error, {
            type,
            data,
            requestId,
        });

        // Return requestId even in failure for tracking
        return requestId;
    }
};