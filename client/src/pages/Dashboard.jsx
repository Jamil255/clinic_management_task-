import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People as PeopleIcon,
  LocalHospital as DoctorIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { dashboardAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 2,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const getStatusColor = (status) => {
  const colors = {
    BOOKED: 'info',
    CHECKED_IN: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error',
  }
  return colors[status] || 'default'
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id && user?.role?.title) {
      fetchStats()
    }
  }, [user?.id, user?.role?.title])

  const fetchStats = async () => {
    try {
      console.log('Fetching stats for:', {
        userId: user?.id,
        userRole: user?.role?.title,
      })
      const response = await dashboardAPI.getStats({
        userId: user?.id,
        userRole: user?.role?.title,
      })
      setStats(response.data.data)
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  // Role-based dashboard rendering
  const userRole = user?.role?.title

  if (userRole === 'Doctor') {
    return <DoctorDashboard stats={stats} user={user} />
  }

  if (userRole === 'Patient') {
    return <PatientDashboard stats={stats} user={user} />
  }

  // Default: Staff/Admin Dashboard
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome, {user?.username}! You have full system access.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients || 0}
            icon={<PeopleIcon sx={{ color: 'primary.main', fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Doctors"
            value={stats?.totalDoctors || 0}
            icon={<DoctorIcon sx={{ color: 'success.main', fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Appointments"
            value={stats?.totalAppointments || 0}
            icon={<CalendarIcon sx={{ color: 'warning.main', fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            icon={<TrendingIcon sx={{ color: 'info.main', fontSize: 40 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Status Overview
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.appointmentsByStatus && (
                <>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Booked</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.BOOKED || 0}
                      color="info"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Checked In</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.CHECKED_IN || 0}
                      color="warning"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Completed</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.COMPLETED || 0}
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Cancelled</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.CANCELLED || 0}
                      color="error"
                      size="small"
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Appointments
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.recentAppointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {appointment.patient?.username || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {appointment.doctor?.username || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!stats?.recentAppointments?.length && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No recent appointments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

// Doctor Dashboard Component
const DoctorDashboard = ({ stats, user }) => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Doctor Dashboard
      </Typography>
      <Alert severity="success" sx={{ mb: 3 }}>
        Welcome Dr. {user?.username}! Here's your schedule overview.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            icon={<CalendarIcon sx={{ color: 'primary.main', fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients || 0}
            icon={<PeopleIcon sx={{ color: 'success.main', fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Completed Today"
            value={stats?.appointmentsByStatus?.COMPLETED || 0}
            icon={<CheckIcon sx={{ color: 'info.main', fontSize: 40 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.appointmentsByStatus && (
                <>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Pending (Booked)</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.BOOKED || 0}
                      color="warning"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Checked In</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.CHECKED_IN || 0}
                      color="info"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Completed</Typography>
                    <Chip
                      label={stats.appointmentsByStatus.COMPLETED || 0}
                      color="success"
                      size="small"
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Schedule
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.recentAppointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {appointment.patient?.username || 'N/A'}
                      </TableCell>
                      <TableCell>{appointment.startTime || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!stats?.recentAppointments?.length && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No appointments scheduled
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

// Patient Dashboard Component
const PatientDashboard = ({ stats, user }) => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient Dashboard
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome {user?.username}! Manage your appointments and health records.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="My Appointments"
            value={stats?.totalAppointments || 0}
            icon={<CalendarIcon sx={{ color: 'primary.main', fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Upcoming"
            value={stats?.appointmentsByStatus?.BOOKED || 0}
            icon={<ScheduleIcon sx={{ color: 'warning.main', fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Completed"
            value={stats?.appointmentsByStatus?.COMPLETED || 0}
            icon={<CheckIcon sx={{ color: 'success.main', fontSize: 40 }} />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Status Overview
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={3}>
                <Box
                  textAlign="center"
                  p={2}
                  sx={{ backgroundColor: 'info.light', borderRadius: 2 }}
                >
                  <Typography variant="h4" color="info.dark">
                    {stats?.appointmentsByStatus?.BOOKED || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Booked
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  textAlign="center"
                  p={2}
                  sx={{ backgroundColor: 'warning.light', borderRadius: 2 }}
                >
                  <Typography variant="h4" color="warning.dark">
                    {stats?.appointmentsByStatus?.CHECKED_IN || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Checked In
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  textAlign="center"
                  p={2}
                  sx={{ backgroundColor: 'success.light', borderRadius: 2 }}
                >
                  <Typography variant="h4" color="success.dark">
                    {stats?.appointmentsByStatus?.COMPLETED || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  textAlign="center"
                  p={2}
                  sx={{ backgroundColor: 'error.light', borderRadius: 2 }}
                >
                  <Typography variant="h4" color="error.dark">
                    {stats?.appointmentsByStatus?.CANCELLED || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Recent Appointments
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.recentAppointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {new Date(
                          appointment.appiontmentDate
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {appointment.doctor?.username || 'N/A'}
                      </TableCell>
                      <TableCell>{appointment.startTime || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!stats?.recentAppointments?.length && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status Legend
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" mb={1.5}>
                <Chip
                  label="BOOKED"
                  color="info"
                  size="small"
                  sx={{ mr: 1, minWidth: 100 }}
                />
                <Typography variant="body2">Appointment scheduled</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1.5}>
                <Chip
                  label="CHECKED_IN"
                  color="warning"
                  size="small"
                  sx={{ mr: 1, minWidth: 100 }}
                />
                <Typography variant="body2">Currently at clinic</Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1.5}>
                <Chip
                  label="COMPLETED"
                  color="success"
                  size="small"
                  sx={{ mr: 1, minWidth: 100 }}
                />
                <Typography variant="body2">Visit completed</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Chip
                  label="CANCELLED"
                  color="error"
                  size="small"
                  sx={{ mr: 1, minWidth: 100 }}
                />
                <Typography variant="body2">Appointment cancelled</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Book a new appointment from the Doctor Listing page
                </Typography>
              </Alert>
              <Alert severity="info">
                <Typography variant="body2">
                  View your medical history in Case Records
                </Typography>
              </Alert>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
