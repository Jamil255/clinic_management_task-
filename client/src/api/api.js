import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies
})

let isRefreshing = false
let refreshSubscribers = []

// Function to notify all subscribers when token is refreshed
const onRefreshed = (success) => {
  refreshSubscribers.forEach((callback) => callback(success))
  refreshSubscribers = []
}

// Function to add subscriber
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback)
}

// No request interceptor needed - cookies are sent automatically

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't redirect to login for certain endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')

    // If error is 401 and we haven't tried to refresh yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // If already refreshing, wait for the new token
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success) => {
            if (success) {
              resolve(api(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResponse = await axios.post(
          '/api/auth/refresh-token',
          {},
          { withCredentials: true }
        )

        

        // Notify all subscribers that refresh succeeded
        onRefreshed(true)

        isRefreshing = false

        // Retry original request (cookies will be sent automatically)
        return api(originalRequest)
      } catch (refreshError) {
        console.error(
          ' Token refresh failed:',
          refreshError.response?.data || refreshError.message
        )
        isRefreshing = false

        // Notify subscribers that refresh failed
        onRefreshed(false)

        // Only redirect to login if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  refreshToken: () => api.post('/auth/refresh-token'),
}

// Dashboard APIs
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
}

// Doctor APIs
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
}

// Patient APIs
export const patientAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
}

// Appointment APIs
export const appointmentAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
  delete: (id) => api.delete(`/appointments/${id}`),
  getStats: () => api.get('/appointments/stats'),
}

// Room APIs
export const roomAPI = {
  getAll: () => api.get('/rooms'),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
}

// Doctor Schedule APIs
export const scheduleAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  getAvailableSlots: (params) => api.get('/schedules/slots', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
}

// Case Record APIs
export const caseRecordAPI = {
  getAll: (params) => api.get('/case-records', { params }),
  getById: (id) => api.get(`/case-records/${id}`),
  create: (data) => api.post('/case-records', data),
  update: (id, data) => api.put(`/case-records/${id}`, data),
  delete: (id) => api.delete(`/case-records/${id}`),
}

export default api
