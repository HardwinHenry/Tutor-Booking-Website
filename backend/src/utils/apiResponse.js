/**
 * Standardized API Response structure
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static ok(res, data = null, message = 'Success') {
    return res.status(200).json(new ApiResponse(200, data, message));
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }
}

module.exports = ApiResponse;

