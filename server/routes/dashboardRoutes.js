import express from 'express'
import { getDashboardStats } from '../controllers/dashboardController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

router.get('/stats', authenticate, getDashboardStats)

export default router
