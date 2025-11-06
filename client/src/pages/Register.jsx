import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
} from '@mui/material'
import { LocalHospital } from '@mui/icons-material'
import { authAPI } from '../api/api'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phoneNo: '',
    roleTitle: 'Patient',
  })
  const [error, setError] = useState('')
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

    try {
      await authAPI.register(formData)
      navigate('/login', {
        state: {
          message:
            'Registration successful! Please login with your credentials.',
        },
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
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
              Patient Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account to book appointments
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Full Name"
                  name="username"
                  autoComplete="name"
                  autoFocus
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="phoneNo"
                  label="Phone Number"
                  name="phoneNo"
                  autoComplete="tel"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="03001234567"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="Minimum 6 characters"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="roleTitle"
                  label="Register As"
                  value={formData.roleTitle}
                  disabled
                  helperText="Patients can register here. Staff and Doctors are added by admin."
                >
                  <MenuItem value="Patient">Patient</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ color: '#1976d2', textDecoration: 'none' }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default Register
