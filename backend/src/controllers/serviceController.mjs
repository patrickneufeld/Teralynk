// ✅ FILE: /backend/src/controllers/serviceController.mjs

/**
 * Service Controller
 * Handles global service metadata and per-user service linking (PostgreSQL).
 */

import {
  getAllServices,
  addServiceForUser
} from '../models/Service.mjs';

/**
 * @desc Registers a new service for a user (must exist in `services` table).
 *       You must pre-create services before users can attach them.
 * @route POST /api/services
 */
export const addUserService = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { servicePlatform } = req.body;

    if (!userId || !servicePlatform) {
      return res.status(400).json({ error: 'Missing user ID or service platform' });
    }

    const record = await addServiceForUser(userId, servicePlatform);
    res.status(201).json({
      message: `✅ Service '${servicePlatform}' successfully added for user ${userId}`,
      result: record,
    });
  } catch (error) {
    console.error('❌ Error adding user service:', error);
    res.status(500).json({ error: 'Failed to add service for user' });
  }
};

/**
 * @desc Retrieves all globally registered services from the `services` table
 * @route GET /api/services
 */
export const getAvailableServices = async (req, res) => {
  try {
    const services = await getAllServices();
    res.status(200).json({ services });
  } catch (error) {
    console.error('❌ Error fetching available services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};
