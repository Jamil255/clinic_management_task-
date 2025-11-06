import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'

export const getAllRooms = async (req, res, next) => {
  try {
    // Get user role from request (set by authenticate middleware)
    const userRole = req.user?.role

    // Build where clause based on user role
    const whereClause = {}

    // Only Staff can see all rooms (active + inactive)
    // Doctor and Patient can only see active rooms
    if (userRole !== 'Staff') {
      whereClause.isActive = true
    }

    const rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(new ApiResponse(200, rooms, 'Rooms fetched successfully'))
  } catch (error) {
    next(error)
  }
}

export const createRoom = async (req, res, next) => {
  try {
    const { name, roomNo, floor, staffId, isActive } = req.body

    const room = await prisma.room.create({
      data: {
        name,
        roomNo,
        floor,
        staffId,
        isActive: isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        staff: true,
      },
    })

    res
      .status(201)
      .json(new ApiResponse(201, room, 'Room created successfully'))
  } catch (error) {
    next(error)
  }
}

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, roomNo, floor, staffId, isActive } = req.body

    const updateData = { updatedAt: new Date() }
    if (name) updateData.name = name
    if (roomNo) updateData.roomNo = roomNo
    if (floor) updateData.floor = floor
    if (staffId) updateData.staffId = staffId
    if (isActive !== undefined) updateData.isActive = isActive

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
      },
    })

    res.json(new ApiResponse(200, room, 'Room updated successfully'))
  } catch (error) {
    next(error)
  }
}

export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.room.delete({
      where: { id },
    })

    res.json(new ApiResponse(200, null, 'Room deleted successfully'))
  } catch (error) {
    next(error)
  }
}
