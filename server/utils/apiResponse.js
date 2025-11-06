export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.success = false
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }
}
