import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'

// Get all doctor schedules with filters
export const getAllSchedules = async (req, res, next) => {
  try {
    const { doctorId, roomId, dayOfTheWeek, isActive } = req.query
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const where = {}
    if (doctorId) where.doctorId = doctorId
    if (roomId) where.roomId = roomId
    if (dayOfTheWeek) where.dayOfTheWeek = dayOfTheWeek
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const [schedules, total] = await Promise.all([
      prisma.doctorSchedule.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctor: {
            select: {
              id: true,
              username: true,
              email: true,
              specialization: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              roomNo: true,
              floor: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.doctorSchedule.count({ where }),
    ])

    res.json(
      new ApiResponse(
        200,
        {
          schedules,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Doctor schedules retrieved successfully'
      )
    )
  } catch (error) {
    
    next(new ApiError(500, 'Failed to get doctor schedules'))
  }
}

// Get schedule by ID
export const getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params

    const schedule = await prisma.doctorSchedule.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            username: true,
            email: true,
            specialization: true,
            phoneNo: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            roomNo: true,
            floor: true,
          },
        },
      },
    })

    if (!schedule) {
      return next(new ApiError(404, 'Schedule not found'))
    }

    res.json(new ApiResponse(200, schedule, 'Schedule retrieved successfully'))
  } catch (error) {
    
    next(new ApiError(500, 'Failed to get schedule'))
  }
}

// Create new doctor schedule
export const createSchedule = async (req, res, next) => {
  try {
    const {
      doctorId,
      roomId,
      dayOfTheWeek,
      startTime,
      endTime,
      slotDuration,
      isActive,
    } = req.body

    // Validate required fields
    if (
      !doctorId ||
      !roomId ||
      !dayOfTheWeek ||
      !startTime ||
      !endTime ||
      !slotDuration
    ) {
      return next(new ApiError(400, 'Missing required fields'))
    }

    // Check if doctor exists and has Doctor role
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { role: true },
    })

    if (!doctor || doctor.role.title !== 'Doctor') {
      return next(new ApiError(400, 'Invalid doctor ID'))
    }

    // If user is a Doctor, they can only create their own schedule
    if (req.user.role === 'Doctor' && req.user.id !== doctorId) {
      return next(
        new ApiError(403, 'Doctors can only create their own schedules')
      )
    }

    // Check if room exists
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return next(new ApiError(400, 'Invalid room ID'))
    }

    // Check for conflicting schedules in the same room (any doctor)
    const existingSchedules = await prisma.doctorSchedule.findMany({
      where: {
        roomId,
        dayOfTheWeek,
        isActive: true,
      },
      include: {
        doctor: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    })

    const conflictingSchedule = existingSchedules.find((schedule) => {
      return (
        (startTime >= schedule.startTime && startTime < schedule.endTime) ||
        (endTime > schedule.startTime && endTime <= schedule.endTime) ||
        (startTime <= schedule.startTime && endTime >= schedule.endTime)
      )
    })

    if (conflictingSchedule) {
      const doctorName =
        conflictingSchedule.doctor?.username ||
        conflictingSchedule.doctor?.email ||
        'another doctor'
      return next(
        new ApiError(
          400,
          `Room is already booked by ${doctorName} from ${conflictingSchedule.startTime} to ${conflictingSchedule.endTime} on ${dayOfTheWeek}`
        )
      )
    }

    const schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId,
        roomId,
        dayOfTheWeek,
        startTime,
        endTime,
        slotDuration: String(slotDuration),
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        doctor: {
          select: {
            id: true,
            username: true,
            email: true,
            specialization: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            roomNo: true,
          },
        },
      },
    })

    res
      .status(201)
      .json(new ApiResponse(201, schedule, 'Schedule created successfully'))
  } catch (error) {
    
    next(new ApiError(500, 'Failed to create schedule'))
  }
}

// Update doctor schedule
export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      doctorId,
      roomId,
      dayOfTheWeek,
      startTime,
      endTime,
      slotDuration,
      isActive,
    } = req.body

    const existingSchedule = await prisma.doctorSchedule.findUnique({
      where: { id },
    })
    if (!existingSchedule) {
      return next(new ApiError(404, 'Schedule not found'))
    }

    // If user is a Doctor, they can only update their own schedule
    if (
      req.user.role === 'Doctor' &&
      req.user.id !== existingSchedule.doctorId
    ) {
      return next(
        new ApiError(403, 'Doctors can only update their own schedules')
      )
    }

    // Staff cannot change the doctor when updating, doctors can only update their own
    if (doctorId && doctorId !== existingSchedule.doctorId) {
      if (req.user.role === 'Doctor') {
        return next(
          new ApiError(403, 'Cannot change schedule to another doctor')
        )
      }
    }

    // Check for conflicts if time, room, or day is being changed
    if (startTime || endTime || dayOfTheWeek || roomId) {
      const conflictSchedules = await prisma.doctorSchedule.findMany({
        where: {
          id: { not: id },
          roomId: roomId || existingSchedule.roomId,
          dayOfTheWeek: dayOfTheWeek || existingSchedule.dayOfTheWeek,
          isActive: true,
        },
        include: {
          doctor: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      })

      const newStartTime = startTime || existingSchedule.startTime
      const newEndTime = endTime || existingSchedule.endTime

      const conflictingSchedule = conflictSchedules.find((schedule) => {
        return (
          (newStartTime >= schedule.startTime &&
            newStartTime < schedule.endTime) ||
          (newEndTime > schedule.startTime && newEndTime <= schedule.endTime) ||
          (newStartTime <= schedule.startTime && newEndTime >= schedule.endTime)
        )
      })

      if (conflictingSchedule) {
        const doctorName =
          conflictingSchedule.doctor?.username ||
          conflictingSchedule.doctor?.email ||
          'another doctor'
        return next(
          new ApiError(
            400,
            `Room is already booked by ${doctorName} from ${conflictingSchedule.startTime} to ${conflictingSchedule.endTime}`
          )
        )
      }
    }

    const schedule = await prisma.doctorSchedule.update({
      where: { id },
      data: {
        ...(doctorId && { doctorId }),
        ...(roomId && { roomId }),
        ...(dayOfTheWeek && { dayOfTheWeek }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(slotDuration && { slotDuration: String(slotDuration) }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      include: {
        doctor: {
          select: {
            id: true,
            username: true,
            email: true,
            specialization: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            roomNo: true,
          },
        },
      },
    })

    res.json(new ApiResponse(200, schedule, 'Schedule updated successfully'))
  } catch (error) {
    
    next(new ApiError(500, 'Failed to update schedule'))
  }
}

// Delete doctor schedule
export const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params

    const schedule = await prisma.doctorSchedule.findUnique({ where: { id } })
    if (!schedule) {
      return next(new ApiError(404, 'Schedule not found'))
    }

    // If user is a Doctor, they can only delete their own schedule
    if (req.user.role === 'Doctor' && req.user.id !== schedule.doctorId) {
      return next(
        new ApiError(403, 'Doctors can only delete their own schedules')
      )
    }

    await prisma.doctorSchedule.delete({ where: { id } })

    res.json(new ApiResponse(200, null, 'Schedule deleted successfully'))
  } catch (error) {
    
    next(new ApiError(500, 'Failed to delete schedule'))
  }
}

// Get available time slots for a doctor on a specific date
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query

    if (!doctorId || !date) {
      return next(new ApiError(400, 'Doctor ID and date are required'))
    }

    const appointmentDate = new Date(date)
    const dayOfWeek = appointmentDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase()

    // Get doctor's schedule for that day
    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        dayOfTheWeek: dayOfWeek,
        isActive: true,
      },
      include: {
        room: true,
      },
    })

    if (schedules.length === 0) {
      return res.json(
        new ApiResponse(200, { slots: [] }, 'No schedule found for this day')
      )
    }

    // Get existing appointments for that doctor on that date
    const existingAppointments = await prisma.appiontment.findMany({
      where: {
        doctorId,
        appiontmentDate: appointmentDate,
        status: { in: ['BOOKED', 'CHECKED_IN'] },
      },
    })

    // Generate available slots
    const allSlots = []
    for (const schedule of schedules) {
      const slots = generateTimeSlots(
        schedule.startTime,
        schedule.endTime,
        parseInt(schedule.slotDuration),
        existingAppointments,
        schedule.room
      )
      allSlots.push(...slots)
    }

    res.json(
      new ApiResponse(
        200,
        { slots: allSlots },
        'Available slots retrieved successfully'
      )
    )
  } catch (error) {
    
    next(new ApiError(500, 'Failed to get available slots'))
  }
}

// Helper function to generate time slots
function generateTimeSlots(
  startTime,
  endTime,
  duration,
  existingAppointments,
  room
) {
  const slots = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  let currentTime = startHour * 60 + startMinute
  const endTimeInMinutes = endHour * 60 + endMinute

  while (currentTime + duration <= endTimeInMinutes) {
    const slotStartTime = `${String(Math.floor(currentTime / 60)).padStart(
      2,
      '0'
    )}:${String(currentTime % 60).padStart(2, '0')}`
    const slotEndTime = `${String(
      Math.floor((currentTime + duration) / 60)
    ).padStart(2, '0')}:${String((currentTime + duration) % 60).padStart(
      2,
      '0'
    )}`

    // Check if slot is already booked
    const isBooked = existingAppointments.some((apt) => {
      return (
        (slotStartTime >= apt.startTime && slotStartTime < apt.endTime) ||
        (slotEndTime > apt.startTime && slotEndTime <= apt.endTime)
      )
    })

    slots.push({
      startTime: slotStartTime,
      endTime: slotEndTime,
      isAvailable: !isBooked,
      room: {
        id: room.id,
        name: room.name,
        roomNo: room.roomNo,
      },
    })

    currentTime += duration
  }

  return slots
}
