const express = require('express');
const { sendNotification, getNotificationsByUser } = require('../controllers/NotificationController');

const router = express.Router();

// Send a notification to a user
router.post('/', sendNotification);

// Get all notifications for a user
router.get('/:user_id', getNotificationsByUser);

module.exports = router;