const express = require('express');
const { 
    markContentCompleted, 
    getProgress,
    getCourseCompletionPercentage,
    getUserProgressOverTime
  } = require('../controllers/ProgressController');

const router = express.Router();

// Mark content as completed
router.post('/', markContentCompleted);

// Get progress for a user in a course
router.get('/:user_id/:course_id', getProgress);

router.get('/completion/:user_id/:course_id', getCourseCompletionPercentage);
router.get('/progress-over-time/:user_id/:course_id', getUserProgressOverTime);


module.exports = router;