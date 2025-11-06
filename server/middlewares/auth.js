import { verifyAccessToken } from '../utils/jwt.js'
import { ApiError } from '../utils/apiResponse.js'
import prisma from '../config/prisma.js'

export const authenticate = async (req, res, next) => {
  try {
    let token = null

    // Try to get token from auth_tokens cookie first
    const authTokensCookie = req.cookies?.auth_tokens
    if (authTokensCookie) {
      try {
        const tokens = JSON.parse(authTokensCookie)
        token = tokens.accessToken
      } catch (e) {
        // Failed to parse cookie
      }
    }

    // Fallback to Authorization header
    if (!token) {
      token = req.headers.authorization?.split(' ')[1]
    }

    if (!token) {
      throw new ApiError(401, 'Authentication required')
    }

    const decoded = verifyAccessToken(token)
    if (!decoded) {
      throw new ApiError(401, 'Invalid or expired token')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    })

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive')
    }

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role, // Send full role object with { title: '...' }
      scopes: decoded.scopes,
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'))
    }

    const userRole = req.user.role.title || req.user.role
    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(403, 'Insufficient permissions'))
    }

    next()
  }
}
