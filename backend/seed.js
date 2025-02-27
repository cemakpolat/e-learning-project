const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const AppDataSource = require('./src/data-source');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const CourseContent = require('./src/models/CourseContent');
const Enrollment = require('./src/models/Enrollment');
const Progress = require('./src/models/Progress');
const Notification = require('./src/models/Notification');

// Load environment variables
dotenv.config();

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Connected to PostgreSQL via TypeORM');

    // Get repositories
    const userRepository = AppDataSource.getRepository(User);
    const courseRepository = AppDataSource.getRepository(Course);
    const contentRepository = AppDataSource.getRepository(CourseContent);
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);
    const progressRepository = AppDataSource.getRepository(Progress);
    const notificationRepository = AppDataSource.getRepository(Notification);

    // Clear existing data
    await notificationRepository.delete({});
    await progressRepository.delete({});
    await enrollmentRepository.delete({});
    await contentRepository.delete({});
    await courseRepository.delete({});
    await userRepository.delete({});
    console.log('Cleared existing data');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword1 = await bcrypt.hash('password123', salt);
    const hashedPassword2 = await bcrypt.hash('password123', salt);

    // Create sample users
    const user1 = userRepository.create({
      name: 'Cem Akpolat',
      email: 'akpolatcem@gmail.com',
      password: hashedPassword1,
      role: 'student',
    });

    const user2 = userRepository.create({
      name: 'Jane Smith',
      email: 'gtarc001@gmail.com',
      password: hashedPassword2,
      role: 'instructor',
    });

    const users = await userRepository.save([user1, user2]);
    console.log('Created users:', users);

    // Create sample courses
    const course1 = courseRepository.create({
      title: 'Introduction to Node.js',
      description: 'Learn the basics of Node.js',
      instructor_id: user2.id,
    });

    const course2 = courseRepository.create({
      title: 'Advanced JavaScript',
      description: 'Master advanced JavaScript concepts',
      instructor_id: user2.id,
    });

    const courses = await courseRepository.save([course1, course2]);
    console.log('Created courses:', courses);

    // Create sample course content
    const content1 = contentRepository.create({
      course_id: course1.id,
      type: 'video',
      content: { url: 'https://example.com/video1' },
      order: 1,
    });

    const content2 = contentRepository.create({
      course_id: course1.id,
      type: 'quiz',
      content: { questions: ['What is Node.js?', 'What is npm?'] },
      order: 2,
    });

    const content3 = contentRepository.create({
      course_id: course2.id,
      type: 'pdf',
      content: { url: 'https://example.com/pdf1' },
      order: 1,
    });

    const contents = await contentRepository.save([content1, content2, content3]);
    console.log('Created course content:', contents);

    // Create sample enrollments
    const enrollment1 = enrollmentRepository.create({
      user_id: user1.id,
      course_id: course1.id,
    });

    const enrollment2 = enrollmentRepository.create({
      user_id: user1.id,
      course_id: course2.id,
    });

    const enrollments = await enrollmentRepository.save([enrollment1, enrollment2]);
    console.log('Created enrollments:', enrollments);

    // Create sample progress
    const progress1 = progressRepository.create({
      user_id: user1.id,
      course_id: course1.id,
      content_id: content1.id,
      time_spent: 1200, // 20 minutes
    });
    
    const progress2 = progressRepository.create({
      user_id: user1.id,
      course_id: course1.id,
      content_id: content2.id,
      time_spent: 1800, // 30 minutes
    });

    const progress = await progressRepository.save([progress1, progress2]);
    console.log('Created progress:', progress);

    // Create sample notifications
    const notification1 = notificationRepository.create({
      user_id: user1.id,
      message: 'Welcome to the e-learning platform!',
    });

    const notification2 = notificationRepository.create({
      user_id: user1.id,
      message: 'New content added to your course!',
    });

    const notifications = await notificationRepository.save([notification1, notification2]);
    console.log('Created notifications:', notifications);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
};

// Run the seed script
seedDatabase();