class ApiSuccess {
    // const successResponse = new ApiSuccess(
        //     201,
        //     'Course created successfully',
        //     course,  // Include the newly created course in the data
        //     null,   // Meta (if needed)
        //     { self: `/api/courses/${course.id}` } // Links (optional, but good practice)
        //   );
    constructor(statusCode, message, data = null, meta = null, links = null) {
      this.statusCode = statusCode;
      this.status = 'success'; // Consistent success indicator
      this.message = message;
      this.data = data;
      this.meta = meta;
      this.links = links;
    }
  
    send(res) {
      return res.status(this.statusCode).json({
        status: this.status,
        statusCode: this.statusCode,
        message: this.message,
        data: this.data,
        meta: this.meta,
        links: this.links
      });
    }
  }
  
  module.exports = ApiSuccess;