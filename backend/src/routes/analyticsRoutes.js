const express = require('express');
const {
  getCourseTimeAnalytics,
  getCourseCompletionRate,
  getPopularCourses,
  getUserEngagement,
  getRetentionRates,
  getContentPopularity,
  getUserProgressOverTime,
} = require('../controllers/ProgressController');

const router = express.Router();

// Get time analytics for a course
router.get('/time/:course_id', getCourseTimeAnalytics);

// Get completion rate for a course
router.get('/completion-rate/:course_id', getCourseCompletionRate);

// Get popular courses
router.get('/popular', getPopularCourses);

// Get user engagement metrics
router.get('/engagement', getUserEngagement);

// Get retention rates
router.get('/retention', getRetentionRates);

// Get content popularity for a course
router.get('/content-popularity/:course_id', getContentPopularity);

// Get user progress over time
router.get('/progress-over-time/:user_id/:course_id', getUserProgressOverTime);

module.exports = router;