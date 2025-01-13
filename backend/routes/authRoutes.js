const express = require('express');
const { login, signup, logout, status } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/status', status);

module.exports = router;
