import prisma from '../config/prisma.js'
import { ApiError, ApiResponse } from '../utils/apiResponse.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'

// Cookie options for development
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge,
})

export const register = async (req, res, next) => {
  try {
    const { email, password, username, phoneNo, roleTitle } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ApiError(400, 'User already exists')
    }

    // Get role
    const role = await prisma.role.findUnique({ where: { title: roleTitle } })
    if (!role) {
      throw new ApiError(400, 'Invalid role')
    }

    // Doctor and Staff cannot self-register, only Patient can
    if (roleTitle === 'Doctor' || roleTitle === 'Staff') {
      throw new ApiError(
        403,
        'Doctors and Staff accounts can only be created by administrators'
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        phoneNo,
        roleId: role.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { role: true },
    })

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.roleId, role.scopes)
    const refreshToken = generateRefreshToken(user.id)

    // Store access token in database
    const accessTokenExpiresAt = new Date()
    accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + 15) // 15 minutes

    await prisma.accessToken.create({
      data: {
        userId: user.id,
        scopes: role.scopes,
        expiresAt: accessTokenExpiresAt,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Store refresh token in database
    const refreshTokenExpiresAt = new Date()
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiresAt,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Set tokens in one cookie as JSON object
    const tokens = {
      accessToken,
      refreshToken,
    }
    res.cookie(
      'auth_tokens',
      JSON.stringify(tokens),
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    ) // 7 days

    const { password: _, ...userWithoutPassword } = user

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
        'User registered successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })

    if (!user) {
      throw new ApiError(401, 'User is not found')
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive')
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user?.password)
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // Generate tokens
    const accessToken = generateAccessToken(
      user.id,
      user.roleId,
      user.role.scopes
    )
    const refreshToken = generateRefreshToken(user.id)

    // Store access token in database
    const accessTokenExpiresAt = new Date()
    accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + 15) // 15 minutes

    await prisma.accessToken.create({
      data: {
        userId: user.id,
        scopes: user.role.scopes,
        expiresAt: accessTokenExpiresAt,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Store refresh token in database
    const refreshTokenExpiresAt = new Date()
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiresAt,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Set tokens in one cookie as JSON object
    const tokens = {
      accessToken,
      refreshToken,
    }
    res.cookie(
      'auth_tokens',
      JSON.stringify(tokens),
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    ) // 7 days

    const { password: _, ...userWithoutPassword } = user

    res.json(
      new ApiResponse(
        200,
        {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
        'Login successful'
      )
    )
  } catch (error) {
    next(error)
  }
}

export const logout = async (req, res, next) => {
  try {
    // Parse tokens from cookie
    const authTokensCookie = req.cookies?.auth_tokens
    let refreshToken = null

    if (authTokensCookie) {
      try {
        const tokens = JSON.parse(authTokensCookie)
        refreshToken = tokens.refreshToken
      } catch (e) {
        // Failed to parse cookie
      }
    }

    if (refreshToken) {
      // Revoke refresh token from database
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    // Clear cookie
    res.clearCookie('auth_tokens')

    res.json(new ApiResponse(200, null, 'Logout successful'))
  } catch (error) {
    next(error)
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNo: true,
        image: true,
        isActive: true,
        createdAt: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        specialization: true,
        licenseNumber: true,
        bloodGroup: true,
        role: {
          select: {
            id: true,
            title: true,
            scopes: true,
          },
        },
      },
    })

    res.json(new ApiResponse(200, user, 'Profile fetched successfully'))
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      username,
      phoneNo,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      specialization,
      licenseNumber,
      bloodGroup,
    } = req.body

    // Get current user to check their role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!currentUser) {
      throw new ApiError(404, 'User not found')
    }

    // Build update data object with only provided fields
    const updateData = {}

    // Basic fields (available to all roles)
    if (username !== undefined) updateData.username = username
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (gender !== undefined) updateData.gender = gender
    if (address !== undefined) updateData.address = address
    if (emergencyContact !== undefined)
      updateData.emergencyContact = emergencyContact

    // Role-specific fields
    if (currentUser.role.title === 'Doctor') {
      if (specialization !== undefined)
        updateData.specialization = specialization
      if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber
    } else if (currentUser.role.title === 'Patient') {
      if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup
    }

    // Update timestamp
    updateData.updatedAt = new Date()

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            title: true,
            scopes: true,
          },
        },
      },
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser

    res.json(
      new ApiResponse(200, userWithoutPassword, 'Profile updated successfully')
    )
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req, res, next) => {
  try {
    // Parse tokens from cookie
    let refreshToken = null
    const authTokensCookie = req.cookies?.auth_tokens || req.body.auth_tokens

    if (authTokensCookie) {
      try {
        const tokens =
          typeof authTokensCookie === 'string'
            ? JSON.parse(authTokensCookie)
            : authTokensCookie
        refreshToken = tokens.refreshToken
      } catch (e) {
        // Failed to parse
      }
    }

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token required')
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw new ApiError(401, 'Invalid or expired refresh token')
    }

    // Check if token exists and is not revoked in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!storedToken) {
      throw new ApiError(
        401,
        'Refresh token revoked or expired. Please login again.'
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    })

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive')
    }

    // Generate new access token (keep same refresh token)
    const newAccessToken = generateAccessToken(
      user.id,
      user.roleId,
      user.role.scopes
    )

    // Update cookie with new access token and same refresh token
    const tokens = {
      accessToken: newAccessToken,
      refreshToken: refreshToken,
    }
    res.cookie(
      'auth_tokens',
      JSON.stringify(tokens),
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    ) // 7 days

    res.json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
        },
        'Token refreshed successfully'
      )
    )
  } catch (error) {
    next(error)
  }
}
