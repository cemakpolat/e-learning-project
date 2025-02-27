const express = require('express');
const {
  enrollUser,
  getEnrollmentsByUser,
  getEnrollmentsByCourse,
} = require('../controllers/EnrollmentController');

const router = express.Router();

// Enroll a user in a course
router.post('/', enrollUser);

// Get all enrollments for a user
router.get('/user/:user_id', getEnrollmentsByUser);

// Get all enrollments for a course
router.get('/course/:course_id', getEnrollmentsByCourse);

module.exports = router;