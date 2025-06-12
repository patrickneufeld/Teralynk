// ✅ FILE: /backend/src/api/StorageLocationDetails.mjs

import express from 'express';
import {
  getUserStorageLocations,
  addStorageLocation,
  updateStorageLocation,
  deleteStorageLocation
} from '../services/storageService.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/storage/locations
 * @desc Get all active storage locations for the authenticated user
 */
router.get('/locations', requireAuth, validateRequestContext, async (req, res) => {
  try {
    const userId = req.user?.id;
    const locations = await getUserStorageLocations(userId);
    res.status(200).json({ locations });
  } catch (err) {
    console.error('[StorageLocationDetails] GET /locations failed:', err);
    res.status(500).json({ error: 'Failed to fetch storage locations' });
  }
});

/**
 * @route POST /api/storage/locations
 * @desc Add a new storage location for the user
 */
router.post('/locations', requireAuth, validateRequestContext, async (req, res) => {
  try {
    const userId = req.user?.id;
    const newLocation = await addStorageLocation(userId, req.body);
    res.status(201).json({ message: 'Location added', location: newLocation });
  } catch (err) {
    console.error('[StorageLocationDetails] POST /locations failed:', err);
    res.status(500).json({ error: 'Failed to add storage location' });
  }
});

/**
 * @route PUT /api/storage/locations/:id
 * @desc Update a storage location by ID
 */
router.put('/locations/:id', requireAuth, validateRequestContext, async (req, res) => {
  try {
    const locationId = req.params.id;
    const updatedLocation = await updateStorageLocation(locationId, req.body);
    res.status(200).json({ message: 'Location updated', location: updatedLocation });
  } catch (err) {
    console.error('[StorageLocationDetails] PUT /locations/:id failed:', err);
    res.status(500).json({ error: 'Failed to update storage location' });
  }
});

/**
 * @route DELETE /api/storage/locations/:id
 * @desc Soft-delete (deactivate) a storage location by ID
 */
router.delete('/locations/:id', requireAuth, validateRequestContext, async (req, res) => {
  try {
    const locationId = req.params.id;
    await deleteStorageLocation(locationId);
    res.status(200).json({ message: 'Location deactivated' });
  } catch (err) {
    console.error('[StorageLocationDetails] DELETE /locations/:id failed:', err);
    res.status(500).json({ error: 'Failed to deactivate storage location' });
  }
});

export default router;
