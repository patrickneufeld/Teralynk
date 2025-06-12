//Users/patrick/Projects/Teralynk_Old/backend/src/models/userFiles.js
import { db } from "../db/index.mjs";

/**
 * Insert a new file record into the database.
 * @param {string} fileId - Unique file identifier.
 * @param {string} userId - ID of the user uploading the file.
 * @param {string} fileName - Name of the file.
 * @param {string} filePath - S3 path of the uploaded file.
 * @param {number} fileSize - Size of the file in bytes.
 * @param {string} mimeType - MIME type of the file.
 * @returns {Promise<Object>} File metadata record.
 */
export const insertFile = async (fileId, userId, fileName, filePath, fileSize, mimeType) => {
    const query = `
        INSERT INTO user_files (id, user_id, file_name, file_path, file_size, mime_type, upload_date, last_accessed)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *;
    `;
    const result = await db.query(query, [fileId, userId, fileName, filePath, fileSize, mimeType]);
    return result.rows[0];
};

/**
 * Delete a file record by ID.
 * @param {string} fileId - File ID to delete.
 * @param {string} userId - ID of the user requesting deletion.
 * @returns {Promise<void>}
 */
export const deleteFileById = async (fileId, userId) => {
    const query = `
        DELETE FROM user_files
        WHERE id = $1 AND user_id = $2;
    `;
    await db.query(query, [fileId, userId]);
};

/**
 * Retrieve paginated files for a user.
 * @param {string} userId - ID of the user requesting files.
 * @param {number} page - Current page number for pagination.
 * @param {number} limit - Number of records per page.
 * @returns {Promise<Object>} Files and metadata (pagination info).
 */
export const getUserFiles = async (userId, page, limit) => {
    const offset = (page - 1) * limit;

    const filesQuery = `
        SELECT *
        FROM user_files
        WHERE user_id = $1
        ORDER BY upload_date DESC
        LIMIT $2 OFFSET $3;
    `;
    const countQuery = `SELECT COUNT(*) FROM user_files WHERE user_id = $1;`;

    const [files, totalCount] = await Promise.all([
        db.query(filesQuery, [userId, limit, offset]),
        db.query(countQuery, [userId]),
    ]);

    return {
        files: files.rows,
        total: parseInt(totalCount.rows[0].count),
    };
};

/**
 * Search user files by name or MIME type.
 * @param {string} userId - ID of the user requesting the search.
 * @param {string} query - Search query string.
 * @returns {Promise<Object[]>} Matching file records.
 */
export const searchUserFiles = async (userId, query) => {
    const searchQuery = `
        SELECT *
        FROM user_files
        WHERE user_id = $1
          AND (file_name ILIKE $2 OR mime_type ILIKE $2)
        ORDER BY upload_date DESC;
    `;
    const result = await db.query(searchQuery, [userId, `%${query}%`]);
    return result.rows;
};

/**
 * Update a file's metadata.
 * @param {string} fileId - File ID to update.
 * @param {string} userId - ID of the user requesting the update.
 * @param {string} fileName - New file name.
 * @returns {Promise<Object>} Updated file record.
 */
export const updateFileMetadata = async (fileId, userId, fileName) => {
    const query = `
        UPDATE user_files
        SET file_name = $1, last_accessed = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *;
    `;
    const result = await db.query(query, [fileName, fileId, userId]);
    if (result.rows.length === 0) {
        throw new Error("File not found or permission denied.");
    }
    return result.rows[0];
};
