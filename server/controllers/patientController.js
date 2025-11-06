import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'
import { hashPassword } from '../utils/password.js'

export const getAllPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query
    const userId = req.user.id // Get logged-in user ID
    const userRole = req.user.role // Get logged-in user role (now full object with { title: '...' })

    // Get Patient role
    const patientRole = await prisma.role.findUnique({
      where: { title: 'Patient' },
    })
    if (!patientRole) {
      throw new ApiError(400, 'Patient role not found')
    }

    const where = {
      roleId: patientRole.id,
    }

    // If user is a Doctor, only show patients with appointments
    if (userRole.title === 'Doctor') {
      // Get all patient IDs who have appointments with this doctor
      const appointments = await prisma.appiontment.findMany({
        where: {
          doctorId: userId,
        },
        select: {
          patientId: true,
        },
        distinct: ['patientId'],
      })

      const patientIds = appointments.map((apt) => apt.patientId)

      // Filter patients to only those with appointments
      if (patientIds.length > 0) {
        where.id = {
          in: patientIds,
        }
      } else {
        // Doctor has no appointments, show no patients
        where.id = {
          in: [],
        }
      }
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNo: { contains: search } },
      ]
    }

    const patients = await prisma.user.findMany({
      where,
      include: {
        role: true,
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    })

    const total = await prisma.user.count({ where })

    res.json(
      new ApiResponse(
        200,
        {
          patients,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Patients fetched successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}

export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params

    const patient = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        CaseRecordsAsPatient: {
          include: {
            doctor: {
              select: {
                id: true,
                username: true,
                email: true,
                specialization: true,
              },
            },
          },
          orderBy: {
            visitDate: 'desc',
          },
        },
      },
    })

    if (!patient) {
      throw new ApiError(404, 'Patient not found')
    }

    if (patient.role.title !== 'Patient') {
      throw new ApiError(400, 'User is not a patient')
    }

    res.json(new ApiResponse(200, patient, 'Patient fetched successfully'))
  } catch (error) {
    next(error)
  }
}

export const createPatient = async (req, res, next) => {
  try {
    const {
      username,
      email,
      phoneNo,
      password,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      bloodGroup,
    } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists')
    }

    // Get Patient role
    const patientRole = await prisma.role.findUnique({
      where: { title: 'Patient' },
    })
    if (!patientRole) {
      throw new ApiError(400, 'Patient role not found')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with patient details
    const patient = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        phoneNo,
        roleId: patientRole.id,
        isActive: true,
        // Patient specific fields
        dateOfBirth: new Date(dateOfBirth),
        gender,
        address,
        emergencyContact,
        bloodGroup,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        role: true,
      },
    })

    res
      .status(201)
      .json(new ApiResponse(201, patient, 'Patient created successfully'))
  } catch (error) {
    next(error)
  }
}

export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params
    const { dateOfBirth, gender, address, emergencyContact, bloodGroup } =
      req.body

    // Verify the user is a patient
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })

    if (!user) {
      throw new ApiError(404, 'Patient not found')
    }

    if (user.role.title !== 'Patient') {
      throw new ApiError(400, 'User is not a patient')
    }

    const updateData = {
      updatedAt: new Date(),
    }

    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (gender) updateData.gender = gender
    if (address) updateData.address = address
    if (emergencyContact) updateData.emergencyContact = emergencyContact
    if (bloodGroup) updateData.bloodGroup = bloodGroup

    const patient = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    })

    res.json(new ApiResponse(200, patient, 'Patient updated successfully'))
  } catch (error) {
    next(error)
  }
}

export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find patient and verify role
    const patient = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })

    if (!patient) {
      throw new ApiError(404, 'Patient not found')
    }

    if (patient.role.title !== 'Patient') {
      throw new ApiError(400, 'User is not a patient')
    }

    // Delete related records first to avoid foreign key constraint violations
    await prisma.$transaction([
      // Delete access tokens
      prisma.accessToken.deleteMany({
        where: { userId: id },
      }),
      // Delete refresh tokens
      prisma.refreshToken.deleteMany({
        where: { userId: id },
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id },
      }),
    ])

    res.json(new ApiResponse(200, null, 'Patient deleted successfully'))
  } catch (error) {
    next(error)
  }
}
