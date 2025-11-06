import express from 'express'
import { body } from 'express-validator'
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
} from '../controllers/authController.js'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'

const router = express.Router()

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('username').notEmpty().withMessage('Username is required'),
    body('phoneNo').notEmpty().withMessage('Phone number is required'),
    body('roleTitle').notEmpty().withMessage('Role is required'),
    validate,
  ],
  register
)

router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail({ allow_utf8_local_part: false })
      .withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
)

router.post('/logout', authenticate, logout)

router.get('/profile', authenticate, getProfile)

router.put('/profile', authenticate, updateProfile)

router.post('/refresh-token', refreshToken)

export default router
