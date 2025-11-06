import express from 'express'
const router = express.Router()
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableSlots,
} from '../controllers/doctorScheduleController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

// Get available slots for a doctor on a specific date
router.get('/slots', authenticate, getAvailableSlots)

// Get all schedules
router.get('/', authenticate, getAllSchedules)

// Get schedule by ID
router.get('/:id', authenticate, getScheduleById)

// Create new schedule (Staff and Doctor)
router.post('/', authenticate, authorize('Staff', 'Doctor'), createSchedule)

// Update schedule (Staff and Doctor)
router.put('/:id', authenticate, authorize('Staff', 'Doctor'), updateSchedule)

// Delete schedule (Staff and Doctor)
router.delete(
  '/:id',
  authenticate,
  authorize('Staff', 'Doctor'),
  deleteSchedule
)

export default router
