import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { doctorAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

const specializationOptions = [
  'GENERAL_PHYSICIAN',
  'ORTHOPEDIC',
  'ENT',
  'DENTIST',
  'CARDIOLOGIST',
  'DERMATOLOGIST',
  'PEDIATRICIAN',
  'GYNECOLOGIST',
]

const Doctors = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isStaff = user?.role?.title === 'Staff'

  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState(null)
  const [doctorToDelete, setDoctorToDelete] = useState(null)
  const [viewDoctor, setViewDoctor] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNo: '',
    password: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    specialization: 'GENERAL_PHYSICIAN',
    licenseNumber: '',
  })
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetchDoctors()
  }, [page, rowsPerPage, specializationFilter])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const response = await doctorAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        specialization: specializationFilter,
      })
      setDoctors(response.data.data.doctors)
      setTotal(response.data.data.pagination.total)
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDeleteDialog = (doctor) => {
    if (!isStaff) {
      alert('Only staff members can delete doctors')
      return
    }
    setDoctorToDelete(doctor)
    setDeleteError('')
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setDoctorToDelete(null)
    setDeleteError('')
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleteError('')
      await doctorAPI.delete(doctorToDelete.id)
      handleCloseDeleteDialog()
      fetchDoctors()
    } catch (error) {
      
      setDeleteError(error.response?.data?.message || 'Failed to delete doctor')
    }
  }

  const handleOpenDialog = () => {
    setEditMode(false)
    setSelectedDoctorId(null)
    setFormData({
      username: '',
      email: '',
      phoneNo: '',
      password: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
      specialization: 'GENERAL_PHYSICIAN',
      licenseNumber: '',
    })
    setFormError('')
    setOpenDialog(true)
  }

  const handleOpenEditDialog = (doctor) => {
    setEditMode(true)
    setSelectedDoctorId(doctor.id)
    // Format date for input field (YYYY-MM-DD)
    const formattedDate = doctor.dateOfBrith
      ? new Date(doctor.dateOfBrith).toISOString().split('T')[0]
      : ''
    setFormData({
      username: doctor.username || '',
      email: doctor.email || '',
      phoneNo: doctor.phoneNo || '',
      password: '', // Don't pre-fill password on edit
      dateOfBirth: formattedDate,
      address: doctor.address || '',
      emergencyContact: doctor.emergencyContact || '',
      specialization: doctor.specialization || 'GENERAL_PHYSICIAN',
      licenseNumber: doctor.licenseNumber || '',
    })
    setFormError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditMode(false)
    setSelectedDoctorId(null)
    setFormError('')
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async () => {
    try {
      setFormError('')
      if (editMode) {
        await doctorAPI.update(selectedDoctorId, formData)
      } else {
        await doctorAPI.create(formData)
      }
      handleCloseDialog()
      fetchDoctors()
    } catch (error) {
      const errorMessage = editMode
        ? 'Failed to update doctor'
        : 'Failed to create doctor'
      setFormError(error.response?.data?.message || errorMessage)
    }
  }

  const handleOpenViewDialog = (doctor) => {
    setViewDoctor(doctor)
    setOpenViewDialog(true)
  }

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false)
    setViewDoctor(null)
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
      >
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
        >
          Doctors
        </Typography>
        {isStaff && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            fullWidth={isMobile}
            sx={{
              minHeight: 44,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            Add Doctor
          </Button>
        )}
      </Box>

      <Box mb={3}>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel>Filter by Specialization</InputLabel>
          <Select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            label="Filter by Specialization"
            sx={{ minHeight: 44 }}
          >
            <MenuItem value="">All</MenuItem>
            {specializationOptions.map((spec) => (
              <MenuItem key={spec} value={spec}>
                {spec.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          '&:hover': {
            boxShadow: 6,
            transition: 'box-shadow 0.3s ease',
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
              sx={{ maxHeight: { xs: 'calc(100vh - 350px)', md: 'none' } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      Doctor
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: 'none', sm: 'table-cell' },
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: '0.95rem',
                      }}
                    >
                      Email
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: 'none', md: 'table-cell' },
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: '0.95rem',
                      }}
                    >
                      Phone
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      Specialization
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: 'none', lg: 'table-cell' },
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: '0.95rem',
                      }}
                    >
                      License Number
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: 'none', lg: 'table-cell' },
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: '0.95rem',
                      }}
                    >
                      Address
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctors.map((doctor) => (
                    <TableRow
                      key={doctor.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transition: 'background-color 0.2s ease',
                        },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 },
                            }}
                          >
                            {doctor.username?.charAt(0) || 'D'}
                          </Avatar>
                          <Typography
                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          >
                            {doctor.username || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', sm: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {doctor.email || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', md: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {doctor.phoneNo || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            doctor?.specialization?.replace(/_/g, ' ') || 'N/A'
                          }
                          color="primary"
                          size="small"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', lg: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {doctor.licenseNumber || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', lg: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {doctor.address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: { xs: 0.5, sm: 1 },
                            flexWrap: 'wrap',
                          }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenViewDialog(doctor)}
                            sx={{
                              minWidth: 44,
                              minHeight: 44,
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'transform 0.2s ease',
                              },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          {isStaff && (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(doctor)}
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
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDeleteDialog(doctor)}
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
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {doctors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No doctors found
                      </TableCell>
                    </TableRow>
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

      {/* Add/Edit Doctor Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
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
          {editMode ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* User Account Fields - Only show when adding new doctor */}
            {!editMode && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNo"
                    value={formData.phoneNo}
                    onChange={handleFormChange}
                    placeholder="03001234567"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
              </>
            )}

            {/* Doctor Profile Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleFormChange}
                required
              >
                {specializationOptions.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleFormChange}
                placeholder="03001234567"
                required
              />
            </Grid>
          </Grid>
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
            {editMode ? 'Update Doctor' : 'Add Doctor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="span">
              Delete Doctor
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Box
            sx={{
              bgcolor: 'error.lighter',
              borderRadius: 1,
              p: 2,
              border: '1px solid',
              borderColor: 'error.light',
            }}
          >
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete this doctor?
            </Typography>
            <Box sx={{ mt: 2, pl: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Name:</strong> {doctorToDelete?.user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Email:</strong> {doctorToDelete?.user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Specialization:</strong>{' '}
                {doctorToDelete?.specialization?.replace(/_/g, ' ')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Doctor Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {viewDoctor?.username?.charAt(0) || 'D'}
            </Avatar>
            <Typography variant="h6">Doctor Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">{viewDoctor?.username}</Typography>
                <Chip
                  label={
                    viewDoctor?.specialization?.replace(/_/g, ' ') || 'N/A'
                  }
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2">
                  {viewDoctor?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body2">
                  {viewDoctor?.phoneNo || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  License Number
                </Typography>
                <Typography variant="body2">
                  {viewDoctor?.licenseNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Emergency Contact
                </Typography>
                <Typography variant="body2">
                  {viewDoctor?.emergencyContact || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2">
                  {viewDoctor?.address || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Doctors
