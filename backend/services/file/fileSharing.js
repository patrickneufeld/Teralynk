const express = require('express');
const router = express.Router();
const {
    generateShareableLink,
    getSharedFile,
    deleteShareableLink,
    listShareableLinks,
    getShareableLinkDetails,
    updateShareableLinkPermissions,
} = require('../services/fileSharingService');
const rbacMiddleware = require('../../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Generate a shareable link for a file**
router.post('/generate', rbacMiddleware('user'), validateRequestBody(['filePath', 'userId']), async (req, res) => {
    try {
        const { filePath, userId, permissions = 'view', expiration = null } = req.body;

        const shareableLink = await generateShareableLink(filePath, userId, permissions, expiration);
        res.status(201).json({
            success: true,
            message: 'Shareable link generated successfully.',
            data: shareableLink,
        });
    } catch (error) {
        console.error('Error generating shareable link:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while generating the shareable link.',
        });
    }
});

// **2️⃣ Retrieve shared file information using the share ID**
router.get('/get/:shareId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { shareId } = req.params;
        const { userId } = req.query;

        if (!shareId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Share ID and user ID are required.',
            });
        }

        const sharedFile = await getSharedFile(shareId, userId);
        res.status(200).json({
            success: true,
            message: 'Shared file retrieved successfully.',
            data: sharedFile,
        });
    } catch (error) {
        console.error('Error retrieving shared file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving the shared file.',
        });
    }
});

// **3️⃣ Delete a shareable link**
router.delete('/delete/:shareId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { shareId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const response = await deleteShareableLink(shareId, userId);
        res.status(200).json({
            success: true,
            message: 'Shareable link deleted successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error deleting shareable link:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while deleting the shareable link.',
        });
    }
});

// **4️⃣ List all active shareable links for a file**
router.get('/list', rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath, userId } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({
                success: false,
                error: 'File path and user ID are required.',
            });
        }

        const activeLinks = await listShareableLinks(filePath, userId);
        res.status(200).json({
            success: true,
            message: 'Active shareable links retrieved successfully.',
            data: activeLinks,
        });
    } catch (error) {
        console.error('Error listing shareable links:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while listing shareable links.',
        });
    }
});

// **5️⃣ Get details for a specific shareable link**
router.get('/details/:shareId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { shareId } = req.params;

        if (!shareId) {
            return res.status(400).json({
                success: false,
                error: 'Share ID is required.',
            });
        }

        const linkDetails = await getShareableLinkDetails(shareId);
        res.status(200).json({
            success: true,
            message: 'Shareable link details retrieved successfully.',
            data: linkDetails,
        });
    } catch (error) {
        console.error('Error retrieving shareable link details:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving shareable link details.',
        });
    }
});

// **6️⃣ Update permissions for a shareable link**
router.put('/update-permissions/:shareId', rbacMiddleware('user'), validateRequestBody(['permissions']), async (req, res) => {
    try {
        const { shareId } = req.params;
        const { permissions } = req.body;

        const updatedLink = await updateShareableLinkPermissions(shareId, permissions);
        res.status(200).json({
            success: true,
            message: 'Shareable link permissions updated successfully.',
            data: updatedLink,
        });
    } catch (error) {
        console.error('Error updating shareable link permissions:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating the shareable link permissions.',
        });
    }
});

module.exports = router;
