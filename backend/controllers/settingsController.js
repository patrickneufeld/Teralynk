const User = require('../models/User');

const getSettings = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId).select('settings');
        res.status(200).json(user.settings);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching settings', error: err });
    }
};

const updateSettings = async (req, res) => {
    const userId = req.user.id;
    try {
        await User.findByIdAndUpdate(userId, { settings: req.body });
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating settings', error: err });
    }
};

module.exports = { getSettings, updateSettings };
