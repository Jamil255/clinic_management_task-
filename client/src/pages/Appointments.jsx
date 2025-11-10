import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Close as CloseIcon,
  HowToReg as CheckInIcon,
} from '@mui/icons-material'
import {
  appointmentAPI,
  patientAPI,
  doctorAPI,
  roomAPI,
  caseRecordAPI,
} from '../api/api'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const statusOptions = ['BOOKED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED']

const getStatusColor = (status) => {
  const colors = {
    BOOKED: 'info',
    CHECKED_IN: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error',
  }
  return colors[status] || 'default'
}

const Appointments = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openCaseRecordDialog, setOpenCaseRecordDialog] = useState(false)
  const [appointmentToComplete, setAppointmentToComplete] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    roomId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    reasonForVisit: '',
    status: 'BOOKED',
  })

  const [caseRecordData, setCaseRecordData] = useState({
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: '',
  })

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
    fetchDoctors()
    fetchRooms()
  }, [page, rowsPerPage])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        userId: user?.id,
        userRole: user?.role?.title,
      })
      setAppointments(response.data.data.appointments)
      setTotal(response.data.data.pagination.total)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await patientAPI.getAll({ limit: 10 })
      setPatients(response.data.data.patients)
    } catch (error) {}
  }

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getAll({ limit: 10 })
      setDoctors(response.data.data.doctors)
    } catch (error) {}
  }

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getAll()
      setRooms(response.data.data)
    } catch (error) {}
  }

  const handleOpenDialog = (appointment = null) => {
    if (appointment) {
      setSelectedAppointment(appointment)
      setFormData({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        roomId: appointment.roomId,
        appointmentDate: format(
          new Date(appointment.appiontmentDate),
          'yyyy-MM-dd'
        ),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        reasonForVisit: appointment.reasonForVisit || '',
        status: appointment.status,
      })
    } else {
      setSelectedAppointment(null)
      // If user is a Patient, pre-select their ID
      const defaultPatientId = user?.role?.title === 'Patient' ? user?.id : ''
      setFormData({
        patientId: defaultPatientId,
        doctorId: '',
        roomId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        reasonForVisit: '',
        status: 'BOOKED',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedAppointment(null)
  }

  const handleCloseToast = () => {
    setToast({ ...toast, open: false })
  }

  const handleSubmit = async () => {
    try {
      if (selectedAppointment) {
        await appointmentAPI.update(selectedAppointment.id, formData)
        setToast({
          open: true,
          message: 'Appointment updated successfully',
          severity: 'success',
        })
      } else {
        await appointmentAPI.create(formData)
        setToast({
          open: true,
          message: 'Appointment created successfully',
          severity: 'success',
        })
      }
      fetchAppointments()
      handleCloseDialog()
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Error saving appointment',
        severity: 'error',
      })
    }
  }

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentAPI.cancel(id)
        setToast({
          open: true,
          message: 'Appointment cancelled successfully',
          severity: 'success',
        })
        fetchAppointments()
      } catch (error) {
        setToast({
          open: true,
          message:
            error.response?.data?.message || 'Error cancelling appointment',
          severity: 'error',
        })
      }
    }
  }

  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to permanently delete this appointment?'
      )
    ) {
      try {
        await appointmentAPI.delete(id)
        setToast({
          open: true,
          message: 'Appointment deleted successfully',
          severity: 'success',
        })
        fetchAppointments()
      } catch (error) {
        setToast({
          open: true,
          message:
            error.response?.data?.message || 'Error deleting appointment',
          severity: 'error',
        })
      }
    }
  }

  const handleComplete = async (id) => {
    // Find the appointment to get patient and doctor info
    const appointment = appointments.find((apt) => apt.id === id)
    if (!appointment) {
      setToast({
        open: true,
        message: 'Appointment not found',
        severity: 'error',
      })
      return
    }

    // Always open dialog to create/add case record when completing
    setAppointmentToComplete(appointment)
    setOpenCaseRecordDialog(true)
  }

  const handleCompleteCaseRecordSubmit = async () => {
    // Validate case record data
    if (!caseRecordData.diagnosis.trim()) {
      setToast({
        open: true,
        message: 'Diagnosis is required to complete the appointment',
        severity: 'error',
      })
      return
    }

    if (!caseRecordData.treatment.trim()) {
      setToast({
        open: true,
        message: 'Treatment is required to complete the appointment',
        severity: 'error',
      })
      return
    }

    try {
      // Try to create the case record
      try {
        await caseRecordAPI.create({
          appiontmentId: appointmentToComplete.id,
          patientId: appointmentToComplete.patientId,
          doctorId: appointmentToComplete.doctorId,
          cheifCompliant: caseRecordData.treatment,
          diagonsis: caseRecordData.diagnosis,
          prescription: caseRecordData.prescription,
          note: caseRecordData.notes,
          visitDate: appointmentToComplete.appiontmentDate,
        })
      } catch (caseRecordError) {
        // If case record already exists, that's okay - continue to mark as completed
        if (
          !caseRecordError.response?.data?.message?.includes('already exists')
        ) {
          // If it's a different error, throw it
          throw caseRecordError
        }
        console.log(
          'Case record already exists, proceeding to complete appointment'
        )
      }

      // Mark appointment as completed
      await appointmentAPI.update(appointmentToComplete.id, {
        status: 'COMPLETED',
      })

      setToast({
        open: true,
        message: 'Appointment completed successfully',
        severity: 'success',
      })

      // Reset and close
      setCaseRecordData({
        diagnosis: '',
        treatment: '',
        prescription: '',
        notes: '',
      })
      setOpenCaseRecordDialog(false)
      setAppointmentToComplete(null)
      fetchAppointments()
    } catch (error) {
      setToast({
        open: true,
        message:
          error.response?.data?.message ||
          'Error completing appointment with case record',
        severity: 'error',
      })
    }
  }

  const handleCloseCaseRecordDialog = () => {
    setOpenCaseRecordDialog(false)
    setAppointmentToComplete(null)
    setCaseRecordData({
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: '',
    })
  }

  const handleCheckIn = async (id) => {
    try {
      await appointmentAPI.update(id, { status: 'CHECKED_IN' })
      setToast({
        open: true,
        message: 'Patient checked in successfully',
        severity: 'success',
      })
      fetchAppointments()
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Error checking in',
        severity: 'error',
      })
    }
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
        >
          Appointments
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          overflow: 'hidden',
          borderRadius: 2,
          transition: 'box-shadow 0.3s',
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            p={4}
            minHeight={300}
          >
            <CircularProgress size={isMobile ? 40 : 50} />
          </Box>
        ) : (
          <>
            <TableContainer
              sx={{ maxHeight: { xs: 'calc(100vh - 300px)', md: 'none' } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                      }}
                    >
                      Time
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      Patient
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        display: { xs: 'none', md: 'table-cell' },
                      }}
                    >
                      Doctor
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        display: { xs: 'none', lg: 'table-cell' },
                      }}
                    >
                      Room
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box py={{ xs: 4, sm: 6 }}>
                          <Typography
                            variant="h6"
                            color="text.secondary"
                            gutterBottom
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                          >
                            No Appointments Found
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            }}
                          >
                            There are no appointments to display.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    appointments.map((appointment) => (
                      <TableRow
                        key={appointment.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            transition: 'background-color 0.2s ease',
                          },
                        }}
                      >
                        <TableCell
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          {format(
                            new Date(appointment.appiontmentDate),
                            'MMM dd, yyyy'
                          )}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          {appointment.startTime} - {appointment.endTime}
                        </TableCell>
                        <TableCell
                          sx={{
                            display: { xs: 'none', sm: 'table-cell' },
                            fontSize: '0.95rem',
                          }}
                        >
                          {appointment.patient?.username || 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            display: { xs: 'none', md: 'table-cell' },
                            fontSize: '0.95rem',
                          }}
                        >
                          {appointment.doctor?.username || 'N/A'}
                        </TableCell>
                        <TableCell
                          sx={{
                            display: { xs: 'none', lg: 'table-cell' },
                            fontSize: '0.95rem',
                          }}
                        >
                          {appointment.room?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appointment.status}
                            color={getStatusColor(appointment.status)}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: { xs: 0.5, sm: 1 },
                              flexWrap: 'wrap',
                              justifyContent: 'flex-start',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(appointment)}
                              title="Edit"
                              sx={{
                                minWidth: 44,
                                minHeight: 44,
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s ease',
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {(user?.role?.title === 'Doctor' ||
                              user?.role?.title === 'Staff') && (
                              <>
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleCheckIn(appointment.id)}
                                  title="Check In Patient"
                                  disabled={appointment.status === 'CHECKED_IN'}
                                  sx={{
                                    minWidth: 44,
                                    minHeight: 44,
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      transition: 'transform 0.2s ease',
                                    },
                                  }}
                                >
                                  <CheckInIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleComplete(appointment.id)}
                                  title="Mark as Completed"
                                  disabled={appointment.status === 'COMPLETED'}
                                  sx={{
                                    minWidth: 44,
                                    minHeight: 44,
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      transition: 'transform 0.2s ease',
                                    },
                                  }}
                                >
                                  <CompleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleCancel(appointment.id)}
                              title="Cancel Appointment"
                              disabled={appointment.status === 'CANCELLED'}
                              sx={{
                                minWidth: 44,
                                minHeight: 44,
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s ease',
                                },
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                            {user?.role?.title === 'Patient' && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(appointment.id)}
                                title="Delete"
                                disabled={
                                  appointment.status === 'COMPLETED' ||
                                  appointment.status === 'CHECKED_IN'
                                }
                                sx={{
                                  minWidth: 44,
                                  minHeight: 44,
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    transition: 'transform 0.2s ease',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
            />
          </>
        )}
      </Paper>

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
        <DialogTitle sx={{ pb: 1 }}>
          {selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                value={formData.patientId}
                onChange={(e) =>
                  setFormData({ ...formData, patientId: e.target.value })
                }
                label="Patient"
                disabled={user?.role?.title === 'Patient'}
                sx={{ minHeight: 44 }}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={formData.doctorId}
                onChange={(e) =>
                  setFormData({ ...formData, doctorId: e.target.value })
                }
                label="Doctor"
                disabled={
                  user?.role?.title === 'Patient' && selectedAppointment
                }
                sx={{ minHeight: 44 }}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.username} - {doctor.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                value={formData.roomId}
                onChange={(e) =>
                  setFormData({ ...formData, roomId: e.target.value })
                }
                label="Room"
                disabled={
                  user?.role?.title === 'Patient' && selectedAppointment
                }
                sx={{ minHeight: 44 }}
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name} - Room {room.roomNo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) =>
                setFormData({ ...formData, appointmentDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              disabled={user?.role?.title === 'Patient' && selectedAppointment}
              sx={{
                '& .MuiInputBase-root': { minHeight: 44 },
              }}
            />

            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              disabled={user?.role?.title === 'Patient' && selectedAppointment}
              sx={{
                '& .MuiInputBase-root': { minHeight: 44 },
              }}
            />

            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              disabled={user?.role?.title === 'Patient' && selectedAppointment}
              sx={{
                '& .MuiInputBase-root': { minHeight: 44 },
              }}
            />

            <TextField
              fullWidth
              label="Reason for Visit"
              multiline
              rows={3}
              value={formData.reasonForVisit}
              onChange={(e) =>
                setFormData({ ...formData, reasonForVisit: e.target.value })
              }
              sx={{
                '& .MuiInputBase-root': { minHeight: 44 },
              }}
            />

            {selectedAppointment && user?.role?.title !== 'Patient' && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  label="Status"
                  sx={{ minHeight: 44 }}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
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
            onClick={handleSubmit}
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
            {selectedAppointment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Case Record Dialog for Completing Appointment */}
      <Dialog
        open={openCaseRecordDialog}
        onClose={handleCloseCaseRecordDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
          }}
        >
          Add Medical Case Record to Complete Appointment
          <IconButton
            onClick={handleCloseCaseRecordDialog}
            size="small"
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              A case record is required to complete this appointment. Please
              provide diagnosis and treatment information.
            </Typography>
          </Alert>

          {appointmentToComplete && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Appointment Details:
              </Typography>
              <Typography variant="body2">
                <strong>Patient:</strong>{' '}
                {appointmentToComplete.patient?.username}
              </Typography>
              <Typography variant="body2">
                <strong>Doctor:</strong>{' '}
                {appointmentToComplete.doctor?.username}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong>{' '}
                {new Date(
                  appointmentToComplete.appiontmentDate
                ).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                <strong>Time:</strong> {appointmentToComplete.startTime} -{' '}
                {appointmentToComplete.endTime}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              required
              label="Diagnosis"
              multiline
              rows={3}
              value={caseRecordData.diagnosis}
              onChange={(e) =>
                setCaseRecordData({
                  ...caseRecordData,
                  diagnosis: e.target.value,
                })
              }
              placeholder="Enter patient diagnosis..."
              helperText="Required field"
            />

            <TextField
              fullWidth
              required
              label="Treatment"
              multiline
              rows={3}
              value={caseRecordData.treatment}
              onChange={(e) =>
                setCaseRecordData({
                  ...caseRecordData,
                  treatment: e.target.value,
                })
              }
              placeholder="Enter treatment provided..."
              helperText="Required field"
            />

            <TextField
              fullWidth
              label="Prescription"
              multiline
              rows={3}
              value={caseRecordData.prescription}
              onChange={(e) =>
                setCaseRecordData({
                  ...caseRecordData,
                  prescription: e.target.value,
                })
              }
              placeholder="Enter prescription details..."
              helperText="Optional"
            />

            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={3}
              value={caseRecordData.notes}
              onChange={(e) =>
                setCaseRecordData({
                  ...caseRecordData,
                  notes: e.target.value,
                })
              }
              placeholder="Enter any additional notes..."
              helperText="Optional"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseCaseRecordDialog}
            fullWidth={isMobile}
            sx={{
              minHeight: 44,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteCaseRecordSubmit}
            variant="contained"
            color="success"
            fullWidth={isMobile}
            startIcon={<CompleteIcon />}
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
            Complete Appointment
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

export default Appointments
