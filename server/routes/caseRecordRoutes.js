import express from 'express'
const router = express.Router()
import {
  getAllCaseRecords,
  getCaseRecordById,
  createCaseRecord,
  updateCaseRecord,
  deleteCaseRecord,
} from '../controllers/caseRecordController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

// Get all case records
router.get('/', authenticate, getAllCaseRecords)

// Get case record by ID
router.get('/:id', authenticate, getCaseRecordById)

// Create new case record (Doctor/Staff only)
router.post('/', authenticate, authorize('Doctor', 'Staff'), createCaseRecord)

// Update case record (Doctor/Staff only)
router.put('/:id', authenticate, authorize('Doctor', 'Staff'), updateCaseRecord)

// Delete case record (Staff only)
router.delete('/:id', authenticate, authorize('Staff'), deleteCaseRecord)

export default router
