/**
 * Controller to get user-specific dashboard data.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserData = async (req, res) => {
    try {
        // Simulate fetching user data (replace with actual database/service calls)
        const userId = req.user?.id; // Ensure `req.user` is populated via middleware
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not logged in.' });
        }

        const userData = {
            id: userId,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'Admin',
        };

        res.status(200).json({ success: true, data: userData });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user data.' });
    }
};

/**
 * Controller to get recent files for the user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getRecentFiles = async (req, res) => {
    try {
        // Simulate fetching recent files (replace with actual logic)
        const userId = req.user?.id; // Ensure `req.user` is populated via middleware
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not logged in.' });
        }

        const recentFiles = [
            { id: '1', name: 'file1.pdf', lastModified: '2025-01-15T12:34:56Z' },
            { id: '2', name: 'file2.docx', lastModified: '2025-01-14T09:20:30Z' },
        ];

        res.status(200).json({ success: true, data: recentFiles });
    } catch (error) {
        console.error('Error fetching recent files:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent files.' });
    }
};

module.exports = {
    getUserData,
    getRecentFiles,
};
