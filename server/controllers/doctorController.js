import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'
import { hashPassword } from '../utils/password.js'

export const getAllDoctors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, specialization } = req.query

    // Get Doctor role
    const doctorRole = await prisma.role.findUnique({
      where: { title: 'Doctor' },
    })

    if (!doctorRole) {
      throw new ApiError(404, 'Doctor role not found')
    }

    const where = { roleId: doctorRole.id }
    if (specialization) {
      where.specialization = specialization
    }

    const doctors = await prisma.user.findMany({
      where,
      include: {
        role: true,
        DoctorSchedules: {
          include: {
            room: true,
          },
        },
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
          doctors,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Doctors fetched successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}

export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params

    const doctor = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        DoctorSchedules: {
          include: {
            room: true,
          },
        },
      },
    })

    if (!doctor) {
      throw new ApiError(404, 'Doctor not found')
    }

    // Verify it's actually a doctor
    if (doctor.role.title !== 'Doctor') {
      throw new ApiError(404, 'User is not a doctor')
    }

    res.json(new ApiResponse(200, doctor, 'Doctor fetched successfully'))
  } catch (error) {
    next(error)
  }
}

export const createDoctor = async (req, res, next) => {
  try {
    const {
      username,
      email,
      phoneNo,
      password,
      dateOfBirth,
      address,
      emergencyContact,
      specialization,
      licenseNumber,
    } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists')
    }

    // Get Doctor role
    const doctorRole = await prisma.role.findUnique({
      where: { title: 'Doctor' },
    })
    if (!doctorRole) {
      throw new ApiError(400, 'Doctor role not found')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with doctor details
    const doctor = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        phoneNo,
        roleId: doctorRole.id,
        isActive: true,
        // Doctor specific fields
        dateOfBirth: new Date(dateOfBirth),
        address,
        emergencyContact,
        specialization,
        licenseNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        role: true,
      },
    })

    res
      .status(201)
      .json(new ApiResponse(201, doctor, 'Doctor created successfully'))
  } catch (error) {
    next(error)
  }
}

export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      dateOfBirth,
      address,
      emergencyContact,
      specialization,
      licenseNumber,
    } = req.body

    // Verify the user is a doctor
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })

    if (!user) {
      throw new ApiError(404, 'Doctor not found')
    }

    if (user.role.title !== 'Doctor') {
      throw new ApiError(400, 'User is not a doctor')
    }

    const updateData = {
      updatedAt: new Date(),
    }

    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (address) updateData.address = address
    if (emergencyContact) updateData.emergencyContact = emergencyContact
    if (specialization) updateData.specialization = specialization
    if (licenseNumber) updateData.licenseNumber = licenseNumber

    const doctor = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    })

    res.json(new ApiResponse(200, doctor, 'Doctor updated successfully'))
  } catch (error) {
    next(error)
  }
}

export const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params

    // Find doctor and verify role
    const doctor = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })

    if (!doctor) {
      throw new ApiError(404, 'Doctor not found')
    }

    if (doctor.role.title !== 'Doctor') {
      throw new ApiError(400, 'User is not a doctor')
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
      // Delete doctor schedules
      prisma.doctorSchedule.deleteMany({
        where: { doctorId: id },
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id },
      }),
    ])

    res.json(new ApiResponse(200, null, 'Doctor deleted successfully'))
  } catch (error) {
    next(error)
  }
}
