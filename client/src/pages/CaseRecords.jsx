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
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MedicalServices as MedicalIcon,
} from '@mui/icons-material'
import { caseRecordAPI, appointmentAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

const CaseRecords = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const [caseRecords, setCaseRecords] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewingRecord, setViewingRecord] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [formData, setFormData] = useState({
    appiontmentId: '',
    cheifCompliant: '',
    diagonsis: '',
    prescription: '',
    note: '',
    vital: {
      bloodPressure: '',
      temperature: '',
      heartRate: '',
      weight: '',
      height: '',
    },
    followDate: '',
  })

  useEffect(() => {
    fetchCaseRecords()
    if (canCreate) fetchAppointments()
  }, [])

  const fetchCaseRecords = async () => {
    try {
      setLoading(true)
      const response = await caseRecordAPI.getAll()
      setCaseRecords(response.data.data.caseRecords || [])
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to fetch case records',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll()
      const filtered = response.data.data.appointments.filter(
        (apt) => apt.status === 'CHECKED_IN' || apt.status === 'COMPLETED'
      )
      setAppointments(filtered)
    } catch (error) {
      
    }
  }

  const handleOpenDialog = (record = null) => {
    if (record) {
      setEditingRecord(record)
      setFormData({
        appiontmentId: record.appiontmentId,
        cheifCompliant: record.cheifCompliant || '',
        diagonsis: record.diagonsis || '',
        prescription: record.prescription || '',
        note: record.note || '',
        vital: record.vital || {
          bloodPressure: '',
          temperature: '',
          heartRate: '',
          weight: '',
          height: '',
        },
        followDate: record.followDate ? record.followDate.split('T')[0] : '',
      })
    } else {
      setEditingRecord(null)
      setFormData({
        appiontmentId: '',
        cheifCompliant: '',
        diagonsis: '',
        prescription: '',
        note: '',
        vital: {
          bloodPressure: '',
          temperature: '',
          heartRate: '',
          weight: '',
          height: '',
        },
        followDate: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRecord(null)
  }

  const handleViewRecord = (record) => {
    setViewingRecord(record)
    setViewDialog(true)
  }

  const handleCloseViewDialog = () => {
    setViewDialog(false)
    setViewingRecord(null)
  }

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        followDate: formData.followDate || null,
      }

      if (editingRecord) {
        await caseRecordAPI.update(editingRecord.id, submitData)
        showSnackbar('Case record updated successfully', 'success')
      } else {
        await caseRecordAPI.create(submitData)
        showSnackbar('Case record created successfully', 'success')
      }
      handleCloseDialog()
      fetchCaseRecords()
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this case record?'))
      return

    try {
      await caseRecordAPI.delete(id)
      showSnackbar('Case record deleted successfully', 'success')
      fetchCaseRecords()
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to delete case record',
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

  const canCreate =
    user?.role?.title === 'Doctor' || user?.role?.title === 'Staff'
  const canDelete = user?.role?.title === 'Staff'

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
          <MedicalIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
            Medical Records
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? 'small' : 'medium'}
          >
            Add Record
          </Button>
        )}
      </Box>

      {/* Case Records Table */}
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
                Patient
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
                  Doctor
                </TableCell>
              )}
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
                  Visit Date
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
                Chief Complaint
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
                  Diagnosis
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
                align="right"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : caseRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>No case records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              caseRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {record.patient?.username || 'N/A'}
                    </Typography>
                    {isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        Dr. {record.doctor?.username || 'N/A'}
                      </Typography>
                    )}
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      Dr. {record.doctor?.username || 'N/A'}
                    </TableCell>
                  )}
                  {!isTablet && (
                    <TableCell>
                      {record.visitDate
                        ? new Date(record.visitDate).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {record.cheifCompliant || 'N/A'}
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {record.diagonsis || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewRecord(record)}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    {canCreate && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(record)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(record.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRecord ? 'Edit Case Record' : 'Add Case Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {!editingRecord && (
              <FormControl fullWidth required>
                <InputLabel>Appointment</InputLabel>
                <Select
                  value={formData.appiontmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, appiontmentId: e.target.value })
                  }
                  label="Appointment"
                >
                  {appointments.map((appointment) => (
                    <MenuItem key={appointment.id} value={appointment.id}>
                      {appointment.patient?.username} -{' '}
                      {new Date(
                        appointment.appiontmentDate
                      ).toLocaleDateString()}{' '}
                      {appointment.startTime}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Chief Complaint"
              value={formData.cheifCompliant}
              onChange={(e) =>
                setFormData({ ...formData, cheifCompliant: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={2}
            />

            <TextField
              label="Diagnosis"
              value={formData.diagonsis}
              onChange={(e) =>
                setFormData({ ...formData, diagonsis: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={2}
            />

            <TextField
              label="Prescription"
              value={formData.prescription}
              onChange={(e) =>
                setFormData({ ...formData, prescription: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />

            <TextField
              label="Notes"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />

            <Divider sx={{ my: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Vitals
              </Typography>
            </Divider>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Blood Pressure"
                  value={formData.vital.bloodPressure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vital: {
                        ...formData.vital,
                        bloodPressure: e.target.value,
                      },
                    })
                  }
                  fullWidth
                  placeholder="120/80"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Temperature (°F)"
                  value={formData.vital.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vital: { ...formData.vital, temperature: e.target.value },
                    })
                  }
                  fullWidth
                  placeholder="98.6"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Heart Rate (bpm)"
                  value={formData.vital.heartRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vital: { ...formData.vital, heartRate: e.target.value },
                    })
                  }
                  fullWidth
                  placeholder="72"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Weight (kg)"
                  value={formData.vital.weight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vital: { ...formData.vital, weight: e.target.value },
                    })
                  }
                  fullWidth
                  placeholder="70"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Height (cm)"
                  value={formData.vital.height}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vital: { ...formData.vital, height: e.target.value },
                    })
                  }
                  fullWidth
                  placeholder="170"
                />
              </Grid>
            </Grid>

            <TextField
              label="Follow-up Date"
              type="date"
              value={formData.followDate}
              onChange={(e) =>
                setFormData({ ...formData, followDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              (!editingRecord && !formData.appiontmentId) ||
              !formData.cheifCompliant ||
              !formData.diagonsis
            }
          >
            {editingRecord ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog
        open={viewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Case Record Details</DialogTitle>
        <DialogContent>
          {viewingRecord && (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Patient Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Patient Name
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {viewingRecord.patient?.username || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Doctor
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        Dr. {viewingRecord.doctor?.username || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Visit Date
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {viewingRecord.visitDate
                          ? new Date(
                              viewingRecord.visitDate
                            ).toLocaleDateString()
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Appointment Time
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {viewingRecord.appiontement?.startTime || 'N/A'} -{' '}
                        {viewingRecord.appiontement?.endTime || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Medical Details
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Chief Complaint
                      </Typography>
                      <Typography variant="body1">
                        {viewingRecord.cheifCompliant || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Diagnosis
                      </Typography>
                      <Typography variant="body1">
                        {viewingRecord.diagonsis || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Prescription
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {viewingRecord.prescription || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Notes
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {viewingRecord.note || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {viewingRecord.vital && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Vitals
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Blood Pressure
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {viewingRecord.vital.bloodPressure || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Temperature
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {viewingRecord.vital.temperature
                            ? `${viewingRecord.vital.temperature}°F`
                            : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Heart Rate
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {viewingRecord.vital.heartRate
                            ? `${viewingRecord.vital.heartRate} bpm`
                            : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Weight
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {viewingRecord.vital.weight
                            ? `${viewingRecord.vital.weight} kg`
                            : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Height
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {viewingRecord.vital.height
                            ? `${viewingRecord.vital.height} cm`
                            : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {viewingRecord.followDate && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Follow-up Date
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {new Date(viewingRecord.followDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
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

export default CaseRecords
