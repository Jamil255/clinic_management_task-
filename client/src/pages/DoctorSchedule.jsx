import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Grid,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { scheduleAPI, doctorAPI, roomAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const DoctorSchedule = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const [schedules, setSchedules] = useState([])
  const [doctors, setDoctors] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [filters, setFilters] = useState({
    doctorId: '',
    roomId: '',
    dayOfWeek: '',
  })

  const [formData, setFormData] = useState({
    doctorId: '',
    roomId: '',
    dayOfTheWeek: '',
    startTime: '',
    endTime: '',
    slotDuration: 30,
    isActive: true,
  })

  useEffect(() => {
    fetchSchedules()
    fetchDoctors()
    fetchRooms()
  }, [filters, user])

  useEffect(() => {
    // If user is a doctor, pre-fill the doctor field with their own ID
    if (user?.role?.title === 'Doctor' && user?.id && !editingSchedule) {
      setFormData((prev) => ({ ...prev, doctorId: user.id }))
    }
  }, [user, editingSchedule])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params = {}

      // If user is a doctor, always filter by their own ID
      if (user?.role?.title === 'Doctor' && user?.id) {
        params.doctorId = user.id
      } else {
        // For staff, use the filter if provided
        if (filters.doctorId) params.doctorId = filters.doctorId
      }

      if (filters.roomId) params.roomId = filters.roomId
      if (filters.dayOfWeek) params.dayOfWeek = filters.dayOfWeek

      const response = await scheduleAPI.getAll(params)
      setSchedules(response.data.data.schedules || [])
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to fetch schedules',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getAll({ limit: 10 })
      
      setDoctors(response.data.data.doctors || [])
    } catch (error) {
      
      showSnackbar('Failed to fetch doctors', 'error')
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getAll()
      setRooms(response.data.data || [])
    } catch (error) {
      
    }
  }

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule)
      setFormData({
        doctorId: schedule.doctorId,
        roomId: schedule.roomId,
        dayOfTheWeek: schedule.dayOfTheWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotDuration: schedule.slotDuration,
        isActive: schedule.isActive,
      })
    } else {
      setEditingSchedule(null)
      // Pre-fill doctor ID if user is a doctor
      const doctorId = user?.role?.title === 'Doctor' && user?.id ? user.id : ''

      setFormData({
        doctorId: doctorId,
        roomId: '',
        dayOfTheWeek: '',
        startTime: '',
        endTime: '',
        slotDuration: 30,
        isActive: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingSchedule(null)
  }

  const handleSubmit = async () => {
    try {
      // Convert slotDuration to string for backend
      const dataToSend = {
        ...formData,
        slotDuration: String(formData.slotDuration),
      }

      if (editingSchedule) {
        await scheduleAPI.update(editingSchedule.id, dataToSend)
        showSnackbar('Schedule updated successfully', 'success')
      } else {
        await scheduleAPI.create(dataToSend)
        showSnackbar('Schedule created successfully', 'success')
      }
      handleCloseDialog()
      fetchSchedules()
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?'))
      return

    try {
      await scheduleAPI.delete(id)
      showSnackbar('Schedule deleted successfully', 'success')
      fetchSchedules()
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to delete schedule',
        'error'
      )
    }
  }

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Doctors and Staff can create/edit schedules
  const canEdit =
    user?.role?.title === 'Staff' || user?.role?.title === 'Doctor'

  // Check if user can edit a specific schedule (doctors can only edit their own)
  const canEditSchedule = (schedule) => {
    if (user?.role?.title === 'Staff') return true
    if (user?.role?.title === 'Doctor' && schedule.doctor?.id === user?.id)
      return true
    return false
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
            Doctor Schedules
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? 'small' : 'medium'}
            sx={{ fontWeight: 'bold' }}
            disabled={false}
          >
            {isMobile ? 'Add' : 'Add Schedule'}
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {/* Only show doctor filter for Staff users */}
            {user?.role?.title === 'Staff' && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Doctor</InputLabel>
                  <Select
                    value={filters.doctorId}
                    onChange={(e) =>
                      setFilters({ ...filters, doctorId: e.target.value })
                    }
                    label="Filter by Doctor"
                  >
                    <MenuItem value="">All Doctors</MenuItem>
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.username || doctor.email || 'Unknown'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={user?.role?.title === 'Staff' ? 4 : 6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Room</InputLabel>
                <Select
                  value={filters.roomId}
                  onChange={(e) =>
                    setFilters({ ...filters, roomId: e.target.value })
                  }
                  label="Filter by Room"
                >
                  <MenuItem value="">All Rooms</MenuItem>
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={user?.role?.title === 'Staff' ? 4 : 6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Day</InputLabel>
                <Select
                  value={filters.dayOfWeek}
                  onChange={(e) =>
                    setFilters({ ...filters, dayOfWeek: e.target.value })
                  }
                  label="Filter by Day"
                >
                  <MenuItem value="">All Days</MenuItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'primary.main',
                  zIndex: 1,
                }}
              >
                Doctor
              </TableCell>
              {!isMobile && (
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'primary.main',
                    zIndex: 1,
                  }}
                >
                  Room
                </TableCell>
              )}
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'primary.main',
                  zIndex: 1,
                }}
              >
                Day
              </TableCell>
              {!isTablet && (
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'primary.main',
                    zIndex: 1,
                  }}
                >
                  Time
                </TableCell>
              )}
              {!isMobile && (
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'primary.main',
                    zIndex: 1,
                  }}
                >
                  Duration
                </TableCell>
              )}
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'primary.main',
                  zIndex: 1,
                }}
              >
                Status
              </TableCell>
              {canEdit && (
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'primary.main',
                    zIndex: 1,
                  }}
                  align="right"
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} align="center">
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} align="center">
                  <Typography>No schedules found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow key={schedule.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      Dr.{' '}
                      {schedule.doctor?.username ||
                        schedule.doctor?.email ||
                        'N/A'}
                    </Typography>
                    {isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        {schedule.room?.name || 'N/A'}
                      </Typography>
                    )}
                  </TableCell>
                  {!isMobile && (
                    <TableCell>{schedule.room?.name || 'N/A'}</TableCell>
                  )}
                  <TableCell>
                    <Chip
                      label={schedule.dayOfTheWeek}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    {isTablet && !isMobile && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {schedule.startTime} - {schedule.endTime}
                      </Typography>
                    )}
                  </TableCell>
                  {!isTablet && (
                    <TableCell>
                      {schedule.startTime} - {schedule.endTime}
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell>{schedule.slotDuration} min</TableCell>
                  )}
                  <TableCell>
                    <Chip
                      label={schedule.isActive ? 'Active' : 'Inactive'}
                      color={schedule.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      {canEditSchedule(schedule) && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(schedule)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={formData.doctorId}
                onChange={(e) =>
                  setFormData({ ...formData, doctorId: e.target.value })
                }
                label="Doctor"
                disabled={user?.role?.title === 'Doctor'}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.username || doctor.email || 'Unknown'} -{' '}
                    {doctor.specialization || 'General'}
                  </MenuItem>
                ))}
              </Select>
              {user?.role?.title === 'Doctor' && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  You can only create schedules for yourself
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Room</InputLabel>
              <Select
                value={formData.roomId}
                onChange={(e) =>
                  setFormData({ ...formData, roomId: e.target.value })
                }
                label="Room"
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name} - {room.type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={formData.dayOfTheWeek}
                onChange={(e) =>
                  setFormData({ ...formData, dayOfTheWeek: e.target.value })
                }
                label="Day of Week"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="Slot Duration (minutes)"
              type="number"
              value={formData.slotDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slotDuration: parseInt(e.target.value),
                })
              }
              fullWidth
              required
              inputProps={{ min: 15, max: 120, step: 15 }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.value })
                }
                label="Status"
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.doctorId ||
              !formData.roomId ||
              !formData.dayOfTheWeek ||
              !formData.startTime ||
              !formData.endTime
            }
          >
            {editingSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default DoctorSchedule
