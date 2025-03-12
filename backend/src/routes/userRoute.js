const express = require('express');
const {
    register, 
    login, 
    getAllUsers,
    getUserByEmail,
    getUserById
} = require('../controllers/UserController')
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

router.get('/', authMiddleware, roleMiddleware(['admin']), getAllUsers);

router.get('/user/:id',  authMiddleware, roleMiddleware(['admin', 'user']), getUserById)

router.get('/email', authMiddleware, roleMiddleware(['admin', 'user']), getUserByEmail); // Route is now /api/users/email?email=...



module.exports = router;