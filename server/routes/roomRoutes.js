import express from 'express'
import {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = express.Router()

router.get('/', authenticate, getAllRooms)

router.post('/', authenticate, authorize('Staff'), createRoom)

router.put('/:id', authenticate, authorize('Staff'), updateRoom)

router.delete('/:id', authenticate, authorize('Staff'), deleteRoom)

export default router
