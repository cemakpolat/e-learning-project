const express = require('express');
const { getDashboardData } = require('../controllers/DashboardController');

const router = express.Router();

// Get dashboard data for a user
router.get('/:user_id', getDashboardData);

module.exports = router;