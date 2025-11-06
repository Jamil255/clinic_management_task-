import express from 'express'
import { body } from 'express-validator'
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  getAppointmentStats,
} from '../controllers/appointmentController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'

const router = express.Router()

router.get('/', authenticate, getAllAppointments)

router.get('/stats', authenticate, getAppointmentStats)

router.get('/:id', authenticate, getAppointmentById)

router.post(
  '/',
  authenticate,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('roomId').notEmpty().withMessage('Room ID is required'),
    body('appointmentDate').isISO8601().withMessage('Invalid appointment date'),
    body('startTime').notEmpty().withMessage('Start time is required'),
    body('endTime').notEmpty().withMessage('End time is required'),
    validate,
  ],
  createAppointment
)

router.put('/:id', authenticate, updateAppointment)

router.patch('/:id/cancel', authenticate, cancelAppointment)

router.delete('/:id', authenticate, deleteAppointment)

export default router
