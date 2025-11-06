import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { LocalHospital } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <LocalHospital
              sx={{ fontSize: 60, color: 'primary.main', mb: 2 }}
            />
            <Typography component="h1" variant="h4" gutterBottom>
              Clinic Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{ color: '#1976d2', textDecoration: 'none' }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block" gutterBottom>
              <strong>Demo Credentials:</strong>
            </Typography>
            <Typography variant="caption" display="block">
              Admin: admin@clinic.com / password123
            </Typography>
            <Typography variant="caption" display="block">
              Doctor: dr.smith@clinic.com / password123
            </Typography>
            <Typography variant="caption" display="block">
              Patient: patient1@email.com / password123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login
