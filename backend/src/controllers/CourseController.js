//CourseController.js

const AppDataSource = require('../data-source');
const Course = require('../models/Course');
const ApiError = require('../utils/apiError');
const { createCourseSchema, updateCourseSchema } = require('../validation/modelValidations'); // Import schemas

// Create a new course
const createCourse = async (req, res, next) => {
    try {
        // Validate input
        const { error, value } = createCourseSchema.validate(req.body); //Joi Validation
        if (error) {
            return next(new ApiError(400, error.details[0].message)); // Bad Request
        }
        const { title, description, instructor_id } = value;

        const courseRepository = AppDataSource.getRepository(Course);
        const course = courseRepository.create({
            title,
            description,
            instructor_id,
        });

        await courseRepository.save(course);
        res.status(201).json({ message: 'Course created successfully', course });
    } catch (err) {
        console.error('Create course error:', err);
        return next(new ApiError(500, 'Server error'));
    }
};

// Get all courses
const getAllCourses = async (req, res, next) => {
    try {
        const courseRepository = AppDataSource.getRepository(Course);
        const courses = await courseRepository.find();
        res.status(200).json(courses);
    } catch (err) {
        console.error('Get all courses error:', err);
        return next(new ApiError(500, 'Server error'));
    }
};

const getCourseById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const courseRepository = AppDataSource.getRepository(Course);
        const course = await courseRepository.findOne({ where: { id } }); // Use findOne

        if (!course) {
            return next(new ApiError(404, 'Course not found'));
        }

        res.status(200).json(course);
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, 'Server error'));
    }
};

const updateCourse = async (req, res, next) => {
    const { id } = req.params;

    try {
        const { error, value } = updateCourseSchema.validate(req.body);
        if (error) {
            return next(new ApiError(400, error.details[0].message));
        }

        const { title, description } = value;
        const courseRepository = AppDataSource.getRepository(Course);
        const course = await courseRepository.findOne({ where: { id } });

        if (!course) {
            return next(new ApiError(404, 'Course not found'));
        }
        course.title = title || course.title;
        course.description = description || course.description;

        await courseRepository.save(course);

        res.status(200).json({ message: 'Course updated successfully', course });
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, 'Server error'));
    }
};

const deleteCourse = async (req, res, next) => {
    const { id } = req.params;
    try {
        const courseRepository = AppDataSource.getRepository(Course);
        const course = await courseRepository.findOne({ where: { id } });

        if (!course) {
            return next(new ApiError(404, 'Course not found'));
        }

        await courseRepository.remove(course);
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, 'Server error'));
    }
};

const getFeaturedCourses = async (req, res, next) => {
    try {
        const courseRepository = AppDataSource.getRepository(Course);

        // Fetch featured courses (e.g., courses with the most enrollments)
        const featuredCourses = await courseRepository
            .createQueryBuilder('course')
            .leftJoinAndSelect('course.enrollments', 'enrollment')
            .select(['course.id', 'course.title', 'COUNT(enrollment.user_id) AS enrollments'])
            .groupBy('course.id')
            .orderBy('enrollments', 'DESC')
            .limit(5) // Top 5 featured courses
            .getRawMany();

        res.status(200).json(featuredCourses);
    } catch (err) {
        console.error('Get featured courses error:', err);
        return next(new ApiError(500, 'Server error'));
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getFeaturedCourses,
};