const AppDataSource = require('../data-source');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');

// Enroll a user in a course
const enrollUser = async (req, res) => {
  const { user_id, course_id } = req.body;

  console.log('Enrollment request received:', { user_id, course_id });

  try {
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);
    const userRepository = AppDataSource.getRepository(User);
    const courseRepository = AppDataSource.getRepository(Course);

    // Check if the user exists
    const user = await userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the course exists
    const course = await courseRepository.findOne({ where: { id: course_id } });
    if (!course) {
      console.log('Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is already enrolled in the course
    const existingEnrollment = await enrollmentRepository.findOne({
      where: { user_id, course_id },
    });
    if (existingEnrollment) {
      console.log('User already enrolled in the course');
      return res.status(400).json({ message: 'User already enrolled in the course' });
    }

    // Create a new enrollment
    const enrollment = enrollmentRepository.create({
      user_id,
      course_id,
    });

    // Save the enrollment to the database
    await enrollmentRepository.save(enrollment);
    console.log('Enrollment created successfully:', enrollment);

    res.status(201).json({ message: 'Enrollment created successfully', enrollment });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all enrollments for a user
const getEnrollmentsByUser = async (req, res) => {
  const { user_id } = req.params;

  console.log('Fetching enrollments for user:', user_id);

  try {
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);

    // Fetch all enrollments for the user
    const enrollments = await enrollmentRepository.find({
      where: { user_id },
      relations: ['course'], // Include course details
    });

    res.status(200).json(enrollments);
  } catch (err) {
    console.error('Get enrollments by user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all enrollments for a course
const getEnrollmentsByCourse = async (req, res) => {
  const { course_id } = req.params;

  console.log('Fetching enrollments for course:', course_id);

  try {
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);

    // Fetch all enrollments for the course
    const enrollments = await enrollmentRepository.find({
      where: { course_id },
      relations: ['user'], // Include user details
    });

    res.status(200).json(enrollments);
  } catch (err) {
    console.error('Get enrollments by course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  enrollUser,
  getEnrollmentsByUser,
  getEnrollmentsByCourse,
};