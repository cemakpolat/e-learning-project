const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Course',
  tableName: 'courses',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    title: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    instructor_id: {
      type: 'int',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  relations: {
    instructor: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: {
        name: 'instructor_id',
        referencedColumnName: 'id',
      },
      inverseSide: 'courses',
    },
    contents: {
      target: 'CourseContent',
      type: 'one-to-many',
      inverseSide: 'course',
    },
    enrollments: {  
      target: 'Enrollment',
      type: 'one-to-many',
      inverseSide: 'course', // Assuming Enrollment has a 'course' relation
    },
  },
});