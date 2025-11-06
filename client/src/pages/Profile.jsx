import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Alert,
  MenuItem,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  Person as PersonIcon,
  Save as SaveIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'
import { format } from 'date-fns'

const Profile = () => {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    phoneNo: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    // Doctor specific
    specialization: '',
    licenseNumber: '',
    // Patient specific
    bloodGroup: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        phoneNo: user.phoneNo || '',
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: user.gender || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        bloodGroup: user.bloodGroup || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validation
    if (!formData.username || formData.username.trim() === '') {
      setError('Username is required')
      setLoading(false)
      return
    }

    if (!formData.phoneNo || formData.phoneNo.trim() === '') {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    // Phone number validation (10-15 digits)
    const phoneRegex = /^[0-9]{10,15}$/
    if (!phoneRegex.test(formData.phoneNo.replace(/[\s\-\(\)]/g, ''))) {
      setError('Phone number must be 10-15 digits')
      setLoading(false)
      return
    }

    // Date of birth validation (must be in the past and user must be at least 1 year old)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()

      // Check if date is in the future
      if (dob > today) {
        setError('Date of birth cannot be in the future')
        setLoading(false)
        return
      }

      // Check minimum age (at least 1 year old)
      const minAge = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate()
      )

      if (dob > minAge) {
        setError('You must be at least 1 year old')
        setLoading(false)
        return
      }

      // Check maximum age (not more than 150 years old)
      const maxAge = new Date(
        today.getFullYear() - 150,
        today.getMonth(),
        today.getDate()
      )
      if (dob < maxAge) {
        setError(
          'Please enter a valid date of birth (maximum age is 150 years)'
        )
        setLoading(false)
        return
      }
    }

    try {
      const response = await authAPI.updateProfile(formData)
      setUser(response.data.data)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  const isDoctor = user?.role?.title === 'Doctor'
  const isPatient = user?.role?.title === 'Patient'

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
            <PersonIcon sx={{ fontSize: 50 }} />
          </Avatar>
          <Box>
            <Typography variant="h5">{user.username}</Typography>
            <Chip
              label={user.role?.title}
              color="primary"
              size="small"
              icon={<BadgeIcon />}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(false)}
          >
            Profile updated successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={user.email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="">Select Gender</MenuItem>
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="+1234567890"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your complete address"
              />
            </Grid>

            {/* Doctor Specific Fields */}
            {isDoctor && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Professional Information
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select Specialization</MenuItem>
                    <MenuItem value="GENERAL_PHYSICIAN">
                      General Physician
                    </MenuItem>
                    <MenuItem value="CARDIOLOGIST">Cardiologist</MenuItem>
                    <MenuItem value="DERMATOLOGIST">Dermatologist</MenuItem>
                    <MenuItem value="PEDIATRICIAN">Pediatrician</MenuItem>
                    <MenuItem value="ORTHOPEDIC">Orthopedic</MenuItem>
                    <MenuItem value="ENT">ENT</MenuItem>
                    <MenuItem value="DENTIST">Dentist</MenuItem>
                    <MenuItem value="GYNECOLOGIST">Gynecologist</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="License Number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="DOC123456"
                  />
                </Grid>
              </>
            )}

            {/* Patient Specific Fields */}
            {isPatient && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Medical Information
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Blood Group"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select Blood Group</MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}

            {/* Account Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Account Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Created"
                value={
                  user.createdAt
                    ? format(new Date(user.createdAt), 'MMM dd, yyyy')
                    : 'N/A'
                }
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Updated"
                value={
                  user.updatedAt
                    ? format(new Date(user.updatedAt), 'MMM dd, yyyy')
                    : 'N/A'
                }
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default Profile
