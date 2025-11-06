import express from 'express'
import { body } from 'express-validator'
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'

const router = express.Router()

router.get('/', authenticate, getAllPatients)

router.get('/:id', authenticate, getPatientById)

router.post(
  '/',
  authenticate,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('emergencyContact')
      .notEmpty()
      .withMessage('Emergency contact is required'),
    validate,
  ],
  createPatient
)

router.put('/:id', authenticate, updatePatient)

router.delete('/:id', authenticate, authorize('Staff'), deletePatient)

export default router
