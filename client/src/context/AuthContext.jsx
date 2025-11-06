import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    
    try {
      // Fetch profile from server using cookies only
      
      const response = await authAPI.getProfile()
      const userData = response.data.data

      
      setUser(userData)
    } catch (error) {
      // If profile fetch fails, user is not authenticated
      console.error('❌ Auth check failed:', {
        status: error.response?.status,
        message: error.response?.data?.message,
      })
      setUser(null)
    } finally {
      setLoading(false)
      
    }
  }

  const login = async (credentials) => {
    try {
      
      const response = await authAPI.login(credentials)
      const { user } = response.data.data

      console.log('✅ Login successful:', {
        email: user.email,
        role: user.role.title,
      })

      // Only set user state, cookies are handled by server
      setUser(user)

      return { success: true }
    } catch (error) {
      
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      
    } finally {
      // Only clear user state, cookies are cleared by server
      setUser(null)
    }
  }

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
