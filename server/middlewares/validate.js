import { validationResult } from 'express-validator'
import { ApiError } from '../utils/apiResponse.js'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }))
    return next(new ApiError(429, 'Validation failed', formattedErrors))
  }
  next()
}
