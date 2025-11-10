import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'

// Get all case records with role-based filtering
export const getAllCaseRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      patientId,
      doctorId,
      appiontmentId,
    } = req.query
    const { user } = req

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    let whereClause = {}

    // Role-based filtering (cannot be overridden)
    if (user.role.title === 'Patient') {
      whereClause.patientId = user.id
    } else if (user.role.title === 'Doctor') {
      whereClause.doctorId = user.id
    }
    // Staff can see all records

    // Additional filters (only for staff)
    if (user.role.title === 'Staff') {
      if (patientId) whereClause.patientId = patientId
      if (doctorId) whereClause.doctorId = doctorId
    }

    // Appointment filter (allowed for all roles)
    if (appiontmentId) whereClause.appiontmentId = appiontmentId

    const [caseRecords, total] = await Promise.all([
      prisma.caseRecord.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          patient: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              specialization: true,
            },
          },
          appiontement: {
            select: {
              id: true,
              appiontmentDate: true,
              startTime: true,
              endTime: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.caseRecord.count({ where: whereClause }),
    ])

    res.json(
      new ApiResponse(
        200,
        {
          caseRecords,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
        'Case records retrieved successfully'
      )
    )
  } catch (error) {
    next(new ApiError(500, 'Failed to fetch case records'))
  }
}

// Get case record by ID
export const getCaseRecordById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { user } = req

    const record = await prisma.caseRecord.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            username: true,
            specialization: true,
          },
        },
        appiontement: {
          select: {
            id: true,
            appiontmentDate: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    if (!record) {
      return next(new ApiError(404, 'Case record not found'))
    }

    // Verify access rights
    if (user.role.title === 'Patient' && record.patientId !== user.id) {
      return next(new ApiError(403, 'Unauthorized access to case record'))
    }

    if (user.role.title === 'Doctor' && record.doctorId !== user.id) {
      return next(new ApiError(403, 'Unauthorized access to case record'))
    }

    res.json(new ApiResponse(200, record, 'Case record retrieved successfully'))
  } catch (error) {
    next(new ApiError(500, 'Failed to get case record'))
  }
}

// Create new case record
export const createCaseRecord = async (req, res, next) => {
  try {
    const {
      appiontmentId,
      cheifCompliant,
      diagonsis,
      prescription,
      note,
      followDate,
      vital,
    } = req.body

    const { user } = req

    // Validate required fields
    if (!appiontmentId || !cheifCompliant || !diagonsis) {
      return next(
        new ApiError(
          400,
          'Appointment ID, chief complaint, and diagnosis are required'
        )
      )
    }

    // Only doctors and staff can create case records
    if (user.role.title === 'Patient') {
      return next(new ApiError(403, 'Patients cannot create case records'))
    }

    // Verify appointment exists
    const appointment = await prisma.appiontment.findUnique({
      where: { id: appiontmentId },
    })

    if (!appointment) {
      return next(new ApiError(404, 'Appointment not found'))
    }

    // Verify appointment is completed or checked-in
    if (appointment.status === 'BOOKED' || appointment.status === 'CANCELLED') {
      return next(
        new ApiError(
          400,
          'Please change the appiontment status to CHECKED-IN before creating a case record'
        )
      )
    }

    // Check if case record already exists for this appointment
    const existingRecord = await prisma.caseRecord.findFirst({
      where: { appiontmentId },
    })

    if (existingRecord) {
      return next(
        new ApiError(400, 'Case record already exists for this appointment')
      )
    }

    const record = await prisma.caseRecord.create({
      data: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appiontmentId,
        visitDate: appointment.appiontmentDate,
        cheifCompliant,
        diagonsis,
        prescription: prescription || '',
        note: note || '',
        followDate: followDate ? new Date(followDate) : new Date(),
        vital: vital || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            username: true,
            specialization: true,
          },
        },
        appiontement: {
          select: {
            id: true,
            appiontmentDate: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    res
      .status(201)
      .json(new ApiResponse(201, record, 'Case record created successfully'))
  } catch (error) {
    next(new ApiError(500, 'Failed to create case record'))
  }
}

// Update case record
export const updateCaseRecord = async (req, res, next) => {
  try {
    const { id } = req.params
    const { cheifCompliant, diagonsis, prescription, note, followDate, vital } =
      req.body
    const { user } = req

    // Check if record exists
    const existingRecord = await prisma.caseRecord.findUnique({
      where: { id },
    })

    if (!existingRecord) {
      return next(new ApiError(404, 'Case record not found'))
    }

    // Only the doctor who created the record or staff can update
    if (user.role.title !== 'Staff' && existingRecord.doctorId !== user.id) {
      return next(
        new ApiError(403, 'You can only update your own case records')
      )
    }

    // Build update data
    const updateData = { updatedAt: new Date() }
    if (cheifCompliant !== undefined) updateData.cheifCompliant = cheifCompliant
    if (diagonsis !== undefined) updateData.diagonsis = diagonsis
    if (prescription !== undefined) updateData.prescription = prescription
    if (note !== undefined) updateData.note = note
    if (followDate !== undefined)
      updateData.followDate = followDate ? new Date(followDate) : new Date()
    if (vital !== undefined) updateData.vital = vital

    const record = await prisma.caseRecord.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            username: true,
            specialization: true,
          },
        },
        appiontement: {
          select: {
            id: true,
            appiontmentDate: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    res.json(new ApiResponse(200, record, 'Case record updated successfully'))
  } catch (error) {
    next(new ApiError(500, 'Failed to update case record'))
  }
}

// Delete case record
export const deleteCaseRecord = async (req, res, next) => {
  try {
    const { id } = req.params
    const { user } = req

    // Only staff can delete case records
    if (user.role.title !== 'Staff') {
      return next(new ApiError(403, 'Only staff can delete case records'))
    }

    const record = await prisma.caseRecord.findUnique({
      where: { id },
    })

    if (!record) {
      return next(new ApiError(404, 'Case record not found'))
    }

    await prisma.caseRecord.delete({
      where: { id },
    })

    res.json(new ApiResponse(200, null, 'Case record deleted successfully'))
  } catch (error) {
    next(new ApiError(500, 'Failed to delete case record'))
  }
}
