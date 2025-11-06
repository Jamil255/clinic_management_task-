import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import {
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material'
import { doctorAPI, appointmentAPI, roomAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

const daysOfWeek = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const DoctorListing = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [doctors, setDoctors] = useState([])
  const [rooms, setRooms] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const [formData, setFormData] = useState({
    appointmentDate: '',
    reasonForVisit: '',
  })

  useEffect(() => {
    fetchDoctors()
    fetchRooms()
    fetchAppointments()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const response = await doctorAPI.getAll({ limit: 100 })

      // Filter only active doctors with active schedules
      const activeDoctors = response.data.data.doctors.filter(
        (doctor) =>
          doctor.isActive &&
          doctor.DoctorSchedules &&
          doctor.DoctorSchedules.some((schedule) => schedule.isActive)
      )

      setDoctors(activeDoctors)
    } catch (error) {
      
      setToast({
        open: true,
        message: 'Error loading doctors',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getAll()
      setRooms(response.data.data || [])
    } catch (error) {
      
    }
  }

  const fetchAppointments = async () => {
    try {
      // Fetch all appointments to check for booked schedules
      const response = await appointmentAPI.getAll({ limit: 1000 })
      setAppointments(response.data.data.appointments || [])
    } catch (error) {
      
    }
  }

  // Check if a schedule is already booked (for the next occurrence)
  const isScheduleBooked = (schedule) => {
    const nextDate = getNextDateForDay(schedule.dayOfTheWeek)

    return appointments.some((appointment) => {
      // Check if appointment matches this schedule and is not cancelled or completed
      const appointmentDate = new Date(appointment.appiontmentDate)
        .toISOString()
        .split('T')[0]

      return (
        appointment.doctorId === schedule.doctorId &&
        appointmentDate === nextDate &&
        appointment.startTime === schedule.startTime &&
        appointment.endTime === schedule.endTime &&
        appointment.status !== 'CANCELLED' &&
        appointment.status !== 'COMPLETED'
      )
    })
  }

  const getNextDateForDay = (dayOfWeek) => {
    // Map day names to JavaScript day numbers
    const dayMapping = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    }

    const targetDay = dayMapping[dayOfWeek]
    const today = new Date()
    const currentDay = today.getDay()

    // Calculate days until next occurrence
    let daysUntilNext = targetDay - currentDay
    if (daysUntilNext <= 0) {
      daysUntilNext += 7 // If it's today or already passed, get next week
    }

    // Create the next date
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysUntilNext)

    // Format as YYYY-MM-DD for the date input
    const year = nextDate.getFullYear()
    const month = String(nextDate.getMonth() + 1).padStart(2, '0')
    const day = String(nextDate.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const handleOpenDialog = (schedule, doctor) => {
    setSelectedSchedule({ ...schedule, doctor })

    // Automatically set the next available date for this day
    const nextAvailableDate = getNextDateForDay(schedule.dayOfTheWeek)

    setFormData({
      appointmentDate: nextAvailableDate,
      reasonForVisit: '',
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedSchedule(null)
  }

  const handleCloseToast = () => {
    setToast({ ...toast, open: false })
  }

  const handleBookAppointment = async () => {
    try {
      if (!formData.appointmentDate) {
        setToast({
          open: true,
          message: 'Please select an appointment date',
          severity: 'warning',
        })
        return
      }

      // Validate day matches schedule
      const selectedDate = new Date(formData.appointmentDate + 'T00:00:00')
      const dayIndex = selectedDate.getDay()
      // Convert JavaScript day (0=Sunday, 1=Monday, ..., 6=Saturday)
      // to our format (MONDAY, TUESDAY, ..., SUNDAY)
      const dayMapping = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ]
      const selectedDayOfWeek = dayMapping[dayIndex]

      if (selectedDayOfWeek !== selectedSchedule.dayOfTheWeek) {
        setToast({
          open: true,
          message: `Please select a ${selectedSchedule.dayOfTheWeek}. You selected a ${selectedDayOfWeek}.`,
          severity: 'warning',
        })
        return
      }

      const appointmentData = {
        patientId: user?.id,
        doctorId: selectedSchedule.doctorId,
        roomId: selectedSchedule.roomId,
        appointmentDate: formData.appointmentDate,
        startTime: selectedSchedule.startTime,
        endTime: selectedSchedule.endTime,
        reasonForVisit: formData.reasonForVisit,
        status: 'BOOKED',
      }

      await appointmentAPI.create(appointmentData)

      setToast({
        open: true,
        message: 'Appointment booked successfully!',
        severity: 'success',
      })
      handleCloseDialog()

      // Refresh appointments to update the UI
      fetchAppointments()
    } catch (error) {
      
      setToast({
        open: true,
        message: error.response?.data?.message || 'Error booking appointment',
        severity: 'error',
      })
    }
  }

  const getRoomName = (roomId) => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? `${room.name} (Room ${room.roomNo})` : 'N/A'
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={isMobile ? 40 : 50} />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          Available Doctors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse our doctors and book an appointment
        </Typography>
      </Box>

      {doctors.length === 0 ? (
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <MedicalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Doctors Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are currently no doctors with available schedules.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {doctors.map((doctor) => {
            // Filter only active schedules for this doctor
            const activeSchedules = doctor.DoctorSchedules.filter(
              (schedule) => schedule.isActive
            )

            return (
              <Grid item xs={12} md={6} lg={4} key={doctor.id}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Doctor Header */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 56,
                          height: 56,
                          mr: 2,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Dr. {doctor.username}
                        </Typography>
                        <Chip
                          icon={<MedicalIcon />}
                          label={doctor.specialization || 'General'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Doctor Info */}
                    <Box mb={2}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        📧 {doctor.email}
                      </Typography>
                      {doctor.phoneNo && (
                        <Typography variant="body2" color="text.secondary">
                          📞 {doctor.phoneNo}
                        </Typography>
                      )}
                      {doctor.licenseNumber && (
                        <Typography variant="body2" color="text.secondary">
                          🏥 License: {doctor.licenseNumber}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Available Schedules */}
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <ScheduleIcon fontSize="small" />
                      Available Schedules
                    </Typography>

                    <List dense sx={{ mt: 1 }}>
                      {activeSchedules.map((schedule) => (
                        <ListItem
                          key={schedule.id}
                          sx={{
                            px: 0,
                            py: 1,
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            width="100%"
                            mb={0.5}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              color="primary"
                            >
                              {schedule.dayOfTheWeek}
                            </Typography>
                            <Chip
                              icon={<TimeIcon />}
                              label={`${schedule.startTime} - ${schedule.endTime}`}
                              size="small"
                              variant="outlined"
                              color="success"
                            />
                          </Box>
                          <Box display="flex" gap={1} alignItems="center">
                            <RoomIcon fontSize="small" color="action" />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {getRoomName(schedule.roomId)}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            disabled={isScheduleBooked(schedule)}
                            onClick={() => handleOpenDialog(schedule, doctor)}
                            sx={{
                              mt: 1,
                              textTransform: 'none',
                              boxShadow: 1,
                              '&:hover': {
                                boxShadow: 3,
                              },
                              '&.Mui-disabled': {
                                bgcolor: 'grey.400',
                                color: 'white',
                              },
                            }}
                          >
                            {isScheduleBooked(schedule)
                              ? 'Booked'
                              : 'Book This Schedule'}
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Booking Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            m: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Book Appointment
            </Typography>
            {selectedSchedule && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Dr. {selectedSchedule.doctor.username} -{' '}
                {selectedSchedule.doctor.specialization}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Box
              sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {/* Schedule Info */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'primary.lighter',
                  border: '1px solid',
                  borderColor: 'primary.light',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Selected Schedule
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      Every {selectedSchedule.dayOfTheWeek}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {selectedSchedule.startTime} - {selectedSchedule.endTime}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <RoomIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {getRoomName(selectedSchedule.roomId)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Appointment Form */}
              <TextField
                fullWidth
                label="Appointment Date"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText={`Please select a ${selectedSchedule.dayOfTheWeek}`}
                sx={{
                  '& .MuiInputBase-root': { minHeight: 44 },
                }}
              />

              <TextField
                fullWidth
                label="Reason for Visit"
                multiline
                rows={4}
                value={formData.reasonForVisit}
                onChange={(e) =>
                  setFormData({ ...formData, reasonForVisit: e.target.value })
                }
                placeholder="Please describe your symptoms or reason for visit..."
                sx={{
                  '& .MuiInputBase-root': { minHeight: 44 },
                }}
              />

              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Your appointment will be booked for{' '}
                  {selectedSchedule.startTime} - {selectedSchedule.endTime}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            fullWidth={isMobile}
            sx={{
              minHeight: 44,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBookAppointment}
            variant="contained"
            fullWidth={isMobile}
            sx={{
              minHeight: 44,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{
          vertical: isMobile ? 'top' : 'bottom',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiSnackbar-root': {
            top: isMobile ? '70px' : 'auto',
          },
        }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{
            width: '100%',
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            boxShadow: 3,
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default DoctorListing
