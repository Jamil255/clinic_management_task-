import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'

export const getDashboardStats = async (req, res, next) => {
  try {
    const { userId, userRole } = req.query

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get role IDs
    const [patientRole, doctorRole] = await Promise.all([
      prisma.role.findUnique({ where: { title: 'Patient' } }),
      prisma.role.findUnique({ where: { title: 'Doctor' } }),
    ])

    // Build where clause based on role
    const appointmentWhere = {}
    const todayAppointmentWhere = {
      appiontmentDate: {
        gte: today,
        lt: tomorrow,
      },
    }

    if (userRole === 'Patient') {
      appointmentWhere.patientId = userId
      todayAppointmentWhere.patientId = userId
    } else if (userRole === 'Doctor') {
      appointmentWhere.doctorId = userId
      todayAppointmentWhere.doctorId = userId
    }
    // Staff can see all (no filter)

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      appointmentsByStatus,
      recentAppointments,
    ] = await Promise.all([
      // Staff sees all counts, Doctor/Patient see their own stats
      userRole === 'Staff'
        ? prisma.user.count({ where: { roleId: patientRole?.id } })
        : userRole === 'Patient'
        ? 1 // Patient count is 1 (themselves)
        : prisma.user.count({
            where: {
              roleId: patientRole?.id,
              AppointmentsAsPatient: {
                some: { doctorId: userId },
              },
            },
          }),
      // Total doctors
      userRole === 'Staff'
        ? prisma.user.count({ where: { roleId: doctorRole?.id } })
        : userRole === 'Doctor'
        ? 1 // Doctor count is 1 (themselves)
        : prisma.user.count({
            where: {
              roleId: doctorRole?.id,
              AppointmentsAsDoctor: {
                some: { patientId: userId },
              },
            },
          }),
      prisma.appiontment.count({ where: appointmentWhere }),
      prisma.appiontment.count({ where: todayAppointmentWhere }),
      prisma.appiontment.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
        where: appointmentWhere,
      }),
      prisma.appiontment.findMany({
        take: 5,
        where: appointmentWhere,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          patient: {
            select: {
              id: true,
              username: true,
              phoneNo: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              specialization: true,
            },
          },
        },
      }),
    ])

    const statusCounts = appointmentsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {})

    res.json(
      new ApiResponse(
        200,
        {
          totalPatients,
          totalDoctors,
          totalAppointments,
          todayAppointments,
          appointmentsByStatus: statusCounts,
          recentAppointments,
        },
        'Dashboard stats fetched successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}
