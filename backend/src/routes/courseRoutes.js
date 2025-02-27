const express = require('express');
const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getFeaturedCourses,
} = require('../controllers/CourseController');
const auth = require('../middleware/auth');


const router = express.Router();

// Create a new course
router.post('/', createCourse);

router.get('/featured', getFeaturedCourses);

// router.get('/', authMiddleware, CourseController.getAllCourses);


// Get all courses
router.get('/', getAllCourses);

// Get a single course by ID
router.get('/:id', getCourseById);

// Update a course
router.put('/:id', updateCourse);

// Delete a course
router.delete('/:id', deleteCourse);

module.exports = router;
