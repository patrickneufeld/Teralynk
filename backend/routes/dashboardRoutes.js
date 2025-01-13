const express = require('express');
const { getUserData, getRecentFiles } = require('../controllers/dashboardController');
const router = express.Router();

router.get('/user', getUserData);
router.get('/recent-files', getRecentFiles);

module.exports = router;
