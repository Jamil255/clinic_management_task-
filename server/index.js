import express, { json } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { testDatabaseConnection } from './config/prisma.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import patientRoutes from './routes/patientRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import roomRoutes from './routes/roomRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import doctorScheduleRoutes from './routes/doctorScheduleRoutes.js'
import caseRecordRoutes from './routes/caseRecordRoutes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(json())
app.use(helmet())
app.use(morgan('dev'))
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(cookieParser())

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Clinic Management System API' })
})

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/schedules', doctorScheduleRoutes)
app.use('/api/case-records', caseRecordRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

app.listen(port, async () => {
  console.log(`🚀 Server is running on port: ${port}`)
  await testDatabaseConnection()
})
