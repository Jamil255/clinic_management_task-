import express from 'express'
import { body } from 'express-validator'
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'

const router = express.Router()

router.get('/', authenticate, getAllDoctors)

router.get('/:id', authenticate, getDoctorById)

router.post(
  '/',
  authenticate,
  authorize('Staff'),
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phoneNo').notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('address').notEmpty().withMessage('Address is required'),
    body('emergencyContact')
      .notEmpty()
      .withMessage('Emergency contact is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    validate,
  ],
  createDoctor
)

router.put('/:id', authenticate, authorize('Staff', 'Doctor'), updateDoctor)

router.delete('/:id', authenticate, authorize('Staff'), deleteDoctor)

export default router
