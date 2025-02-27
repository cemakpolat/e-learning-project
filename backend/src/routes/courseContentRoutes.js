const express = require('express');
const { addContent, getContentByCourse } = require('../controllers/CourseContentController');

const router = express.Router();

// Add content to a course
router.post('/', addContent);

// Get all content for a course
router.get('/:course_id', getContentByCourse);

module.exports = router;