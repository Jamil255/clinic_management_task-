import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'

export const getAllAppointments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      doctorId,
      patientId,
      date,
      userId,
      userRole,
    } = req.query

    const where = {}

    // Role-based filtering
    if (userRole === 'Patient') {
      // Patient can only see their own appointments
      where.patientId = userId
    } else if (userRole === 'Doctor') {
      // Doctor can only see appointments assigned to them
      where.doctorId = userId
    }
    // Staff can see all appointments (no filter)

    if (status) where.status = status
    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.appiontmentDate = {
        gte: startDate,
        lt: endDate,
      }
    }

    const appointments = await prisma.appiontment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNo: true,
          },
        },
        doctor: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNo: true,
            specialization: true,
          },
        },
        room: true,
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        appiontmentDate: 'desc',
      },
    })

    const total = await prisma.appiontment.count({ where })

    res.json(
      new ApiResponse(
        200,
        {
          appointments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Appointments fetched successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}

export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params

    const appointment = await prisma.appiontment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        room: true,
        CaseRecord: true,
      },
    })

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found')
    }

    res.json(
      new ApiResponse(200, appointment, 'Appointment fetched successfully')
    )
  } catch (error) {
    next(error)
  }
}

export const createAppointment = async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      roomId,
      appointmentDate,
      startTime,
      endTime,
      reasonForVisit,
    } = req.body

    const appointmentDateTime = new Date(appointmentDate)

    // Check 1: Prevent duplicate booking for same doctor at exact same schedule slot
    // This ensures two patients cannot book the same doctor at the same time
    const exactScheduleConflict = await prisma.appiontment.findFirst({
      where: {
        doctorId,
        appiontmentDate: appointmentDateTime,
        startTime,
        endTime,
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
      include: {
        patient: {
          select: {
            username: true,
          },
        },
      },
    })

    if (exactScheduleConflict) {
      throw new ApiError(
        400,
        `This schedule slot is already booked. Another patient has an appointment with this doctor at the same time.`
      )
    }

    // Helper function to check time overlap
    // Two appointments overlap if: (start1 < end2) AND (end1 > start2)
    const checkTimeOverlap = async (whereCondition) => {
      const existingAppointments = await prisma.appiontment.findMany({
        where: {
          ...whereCondition,
          appiontmentDate: appointmentDateTime,
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
        },
      })

      for (const apt of existingAppointments) {
        // Check if times overlap
        // Appointment overlaps if: newStart < existingEnd AND newEnd > existingStart
        if (startTime < apt.endTime && endTime > apt.startTime) {
          return true
        }
      }
      return false
    }

    // Check 2: Patient cannot have overlapping appointments
    const patientConflict = await checkTimeOverlap({ patientId })

    if (patientConflict) {
      throw new ApiError(
        400,
        'You already have an appointment during this time'
      )
    }

    // Check 3: Doctor cannot have overlapping appointments
    const doctorConflict = await checkTimeOverlap({ doctorId })

    if (doctorConflict) {
      throw new ApiError(
        400,
        'Doctor is already booked at this time with another patient'
      )
    }

    // Check 4: Room cannot have overlapping appointments
    const roomConflict = await checkTimeOverlap({ roomId })

    if (roomConflict) {
      throw new ApiError(400, 'Room is already occupied at this time')
    }

    const appointment = await prisma.appiontment.create({
      data: {
        patientId,
        doctorId,
        roomId,
        appiontmentDate: appointmentDateTime,
        startTime,
        endTime,
        reasonForVisit,
        status: 'BOOKED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        patient: true,
        doctor: true,
        room: true,
      },
    })

    res
      .status(201)
      .json(
        new ApiResponse(201, appointment, 'Appointment created successfully')
      )
  } catch (error) {
    next(error)
  }
}

export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { appointmentDate, startTime, endTime, reasonForVisit, status } =
      req.body

    // Get the existing appointment to check conflicts
    const existingAppointment = await prisma.appiontment.findUnique({
      where: { id },
    })

    if (!existingAppointment) {
      throw new ApiError(404, 'Appointment not found')
    }

    // Restrict patients from updating appointment status
    if (req.user.role.title === 'Patient') {
      // Patients can only update their own appointments
      if (existingAppointment.patientId !== req.user.id) {
        throw new ApiError(403, 'You can only update your own appointments')
      }

      // Patients cannot change appointment status (except through cancel endpoint)
      if (status && status !== existingAppointment.status) {
        throw new ApiError(
          403,
          'Patients are not allowed to change appointment status. Please use the cancel option if needed.'
        )
      }

      // Patients cannot change appointment date/time once booked
      if (appointmentDate || startTime || endTime) {
        throw new ApiError(
          403,
          'Patients cannot reschedule appointments. Please cancel and create a new appointment.'
        )
      }
    }

    // Use new values or existing values
    const checkDate = appointmentDate
      ? new Date(appointmentDate)
      : existingAppointment.appiontmentDate
    const checkStartTime = startTime || existingAppointment.startTime
    const checkEndTime = endTime || existingAppointment.endTime

    // Check for conflicts if date/time is being changed
    if (appointmentDate || startTime || endTime) {
      // Check 1: Prevent duplicate booking for same doctor at exact same schedule slot
      const exactScheduleConflict = await prisma.appiontment.findFirst({
        where: {
          doctorId: existingAppointment.doctorId,
          appiontmentDate: checkDate,
          startTime: checkStartTime,
          endTime: checkEndTime,
          status: {
            notIn: ['CANCELLED', 'COMPLETED'],
          },
          id: { not: id }, // Exclude current appointment
        },
      })

      if (exactScheduleConflict) {
        throw new ApiError(
          400,
          'This schedule slot is already booked by another patient'
        )
      }

      // Helper function to check time overlap (excluding current appointment)
      const checkTimeOverlap = async (whereCondition) => {
        const existingAppointments = await prisma.appiontment.findMany({
          where: {
            ...whereCondition,
            appiontmentDate: checkDate,
            status: { notIn: ['CANCELLED', 'COMPLETED'] },
            id: { not: id }, // Exclude current appointment
          },
        })

        for (const apt of existingAppointments) {
          // Check if times overlap
          if (checkStartTime < apt.endTime && checkEndTime > apt.startTime) {
            return true
          }
        }
        return false
      }

      // Check 2: Patient cannot have overlapping appointments
      const patientConflict = await checkTimeOverlap({
        patientId: existingAppointment.patientId,
      })
      if (patientConflict) {
        throw new ApiError(
          400,
          'You already have an appointment during this time'
        )
      }

      // Check 3: Doctor cannot have overlapping appointments
      const doctorConflict = await checkTimeOverlap({
        doctorId: existingAppointment.doctorId,
      })
      if (doctorConflict) {
        throw new ApiError(
          400,
          'Doctor is already booked at this time with another patient'
        )
      }

      // Check 4: Room cannot have overlapping appointments
      const roomConflict = await checkTimeOverlap({
        roomId: existingAppointment.roomId,
      })
      if (roomConflict) {
        throw new ApiError(400, 'Room is already occupied at this time')
      }
    }

    const updateData = {
      updatedAt: new Date(),
    }

    if (appointmentDate) updateData.appiontmentDate = new Date(appointmentDate)
    if (startTime) updateData.startTime = startTime
    if (endTime) updateData.endTime = endTime
    if (reasonForVisit) updateData.reasonForVisit = reasonForVisit

    // If marking as COMPLETED, verify that a case record exists
    if (status === 'COMPLETED') {
      const caseRecord = await prisma.caseRecord.findFirst({
        where: { appiontmentId: id }, // Note: database uses 'appiontmentId' spelling
      })

      if (!caseRecord) {
        throw new ApiError(
          400,
          'Cannot complete appointment without a medical case record. Please add a case record first.'
        )
      }
      updateData.status = status
    } else if (status) {
      updateData.status = status
    }

    const appointment = await prisma.appiontment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        room: true,
      },
    })

    res.json(
      new ApiResponse(200, appointment, 'Appointment updated successfully')
    )
  } catch (error) {
    next(error)
  }
}

export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params

    const appointment = await prisma.appiontment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    })

    res.json(
      new ApiResponse(200, appointment, 'Appointment cancelled successfully')
    )
  } catch (error) {
    next(error)
  }
}

export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.appiontment.delete({
      where: { id },
    })

    res.json(new ApiResponse(200, null, 'Appointment deleted successfully'))
  } catch (error) {
    next(error)
  }
}

export const getAppointmentStats = async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalToday, booked, checkedIn, completed, cancelled] =
      await Promise.all([
        prisma.appiontment.count({
          where: {
            appiontmentDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.appiontment.count({ where: { status: 'BOOKED' } }),
        prisma.appiontment.count({ where: { status: 'CHECKED_IN' } }),
        prisma.appiontment.count({ where: { status: 'COMPLETED' } }),
        prisma.appiontment.count({ where: { status: 'CANCELLED' } }),
      ])

    res.json(
      new ApiResponse(
        200,
        {
          totalToday,
          booked,
          checkedIn,
          completed,
          cancelled,
        },
        'Appointment stats fetched successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}
