const AppDataSource = require('../data-source');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');

// Get dashboard data for a user
const getDashboardData = async (req, res) => {
  const { user_id } = req.params;

  console.log('Fetching dashboard data for user:', user_id);

  try {
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);
    const progressRepository = AppDataSource.getRepository(Progress);
    const notificationRepository = AppDataSource.getRepository(Notification);

    // Fetch enrolled courses
    const enrollments = await enrollmentRepository.find({
      where: { user_id },
      relations: ['course'],
    });

    // Fetch progress for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await progressRepository.find({
          where: { user_id, course_id: enrollment.course_id },
        });
        return {
          ...enrollment.course,
          progress,
        };
      })
    );

    // Fetch notifications
    const notifications = await notificationRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
    });

    res.status(200).json({ courses: coursesWithProgress, notifications });
  } catch (err) {
    console.error('Get dashboard data error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardData,
};