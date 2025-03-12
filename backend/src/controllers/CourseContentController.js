const AppDataSource = require('../data-source');
const { courseContentCreateSchema, courseContentUpdateSchema } = require('../validation/modelValidations');
const ApiError = require('../utils/apiError');
const CourseContent = require('../models/CourseContent');

// Add content to a course
const addContent = async (req, res, next) => {
  console.log('Add content request received:', { course_id, type, content, order });

  try {
    const { error, value } = courseContentCreateSchema.validate(req.body);
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    const { course_id, type, content, order } = value;
    const contentRepository = AppDataSource.getRepository(CourseContent);

    // Create a new content entry
    const courseContent = contentRepository.create({
      course_id,
      type,
      content,
      order,
    });

    // Save the content to the database
    await contentRepository.save(courseContent);
    res.status(201).json({ message: 'Content added successfully', courseContent });
  } catch (err) {
    console.error('Add content error:', err);
    return next(new ApiError(500, 'Server error'));
  }
};

// Get all content for a course
const getContentByCourse = async (req, res, next) => {
  const { course_id } = req.params;

  console.log('Fetching content for course:', course_id);

  try {
    const contentRepository = AppDataSource.getRepository(CourseContent);

    // Fetch all content for the course
    const content = await contentRepository.find({
      where: { course_id },
      order: { order: 'ASC' }, // Order by the 'order' field
    });

    res.status(200).json(content);
  } catch (err) {
    console.error('Get content by course error:', err);
    return next(new ApiError(500, 'Server error'));
  }
};

module.exports = {
  addContent,
  getContentByCourse,
};