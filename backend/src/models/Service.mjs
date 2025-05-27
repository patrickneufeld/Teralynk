// ✅ FILE PATH: backend/src/models/Service.mjs

import { query } from '../config/db.mjs';

/**
 * @function getAllServices
 * @desc Retrieve all available AI or storage services from the database
 */
export async function getAllServices() {
  const sql = `
    SELECT id, platform, type, auth_options
    FROM services
    ORDER BY platform ASC;
  `;
  const { rows } = await query(sql);
  return rows;
}

/**
 * @function addServiceForUser
 * @desc Adds a new user service association to user_services table
 * @param {number} userId 
 * @param {string} servicePlatform 
 */
export async function addServiceForUser(userId, servicePlatform) {
  const sql = `
    INSERT INTO user_services (user_id, service_platform)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [userId, servicePlatform];
  const { rows } = await query(sql, values);
  return rows[0];
}
