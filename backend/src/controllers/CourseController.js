const AppDataSource = require('../data-source');
const Course = require('../models/Course');


// Create a new course
const createCourse = async (req, res) => {
    const { title, description, instructor_id } = req.body;
  
    try {
      const courseRepository = AppDataSource.getRepository(Course);
  
      // Create a new course
      const course = courseRepository.create({
        title,
        description,
        instructor_id,
      });
  
      // Save the course to the database
      await courseRepository.save(course);
  
      res.status(201).json({ message: 'Course created successfully', course });
    } catch (err) {
      console.error('Create course error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
// Get all courses
const getAllCourses = async (req, res) => {
    try {
      const courseRepository = AppDataSource.getRepository(Course);
  
      // Fetch all courses
      const courses = await courseRepository.find();
  
      res.status(200).json(courses);
    } catch (err) {
      console.error('Get all courses error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

const getCourseById  = async (req, res) => {
    const {id} = req.params;

    try {
        const courseRepository = AppDataSource.getRepository(Course);
        const course = await courseRepository.find({where: {id}});
        if (!course){
            return res.status(404).json({message: 'Course not found'});
        }
        res.status(200).json(course)
    }catch(err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }

}

const updateCourse = async (req, res) => {
    const {id} = req.params;
    const {title, description} = req.body;

    try {
        const courseRepository = AppDataSource.getRepository(Course);
        const course = await courseRepository.findOne({where:{id}});
        if (!course){
            return res.status(404).json({message: 'Course not found'});
        }
        course.title = title || course.title;
        course.description = description || course.description;
        await courseRepository.save(course);
        res.status(200).json({message:'Course updated successfully', course});
    } catch (err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}

const deleteCourse = async (req,res) => {
    const {id} = req.params ;
    try {
        const courseRepository = AppDataSource.getRepository(Course);

        const course = await courseRepository.find({where:{id}});
        if (!course){
            return res.status(404).json({message: 'Course not found'})
        }
        await courseRepository.remove(course);
        res.status(200).json({message: 'Course deletd successfully'});
    } catch (err){
        console.error(err);
        res.status(500).json({message:'server error'});
    }
}
const getFeaturedCourses = async (req, res) => {
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
    res.status(500).json({ message: 'Server error' });
  }
};


const getCoursesPaginated = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  let pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 items per page
  const MAX_PAGE_SIZE = 20; // Define the maximum page size

  // Enforce the maximum page size
  if (pageSize > MAX_PAGE_SIZE) {
    pageSize = MAX_PAGE_SIZE;
  }

  const skip = (page - 1) * pageSize;

  try {
    const courseRepository = AppDataSource.getRepository(Course);

    const [courses, total] = await courseRepository.findAndCount({
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      courses,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    console.error('Get courses paginated error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getFeaturedCourses,
    getCoursesPaginated,
}