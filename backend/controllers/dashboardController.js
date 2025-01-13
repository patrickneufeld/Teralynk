const User = require('../models/User');

const getUserData = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user data', error: err });
    }
};

const getRecentFiles = async (req, res) => {
    // Placeholder for recent files logic
    res.status(200).json([{ id: 1, name: 'File1.txt' }, { id: 2, name: 'File2.docx' }]);
};

module.exports = { getUserData, getRecentFiles };
