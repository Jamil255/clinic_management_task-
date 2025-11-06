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
  InputAdornment,
  Grid,
  Alert,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { patientAPI } from '../api/api'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const genderOptions = ['MALE', 'FEMALE', 'OTHERS']

const Patients = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isStaff = user?.role?.title === 'Staff'

  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [viewPatient, setViewPatient] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    userId: user?.id || '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [page, rowsPerPage, searchQuery])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await patientAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      })
      setPatients(response.data.data.patients)
      setTotal(response.data.data.pagination.total)
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setEditMode(false)
    setSelectedPatientId(null)
    setFormData({
      userId: user?.id || '',
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      emergencyContact: '',
      bloodGroup: '',
    })
    setFormError('')
    setOpenDialog(true)
  }

  const handleOpenEditDialog = (patient) => {
    setEditMode(true)
    setSelectedPatientId(patient.id)
    const formattedDate = patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
      : ''
    setFormData({
      userId: patient.userId || user?.id || '',
      dateOfBirth: formattedDate,
      gender: patient.gender || 'MALE',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      bloodGroup: patient.bloodGroup || '',
    })
    setFormError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditMode(false)
    setSelectedPatientId(null)
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
        await patientAPI.update(selectedPatientId, formData)
      } else {
        await patientAPI.create(formData)
      }
      handleCloseDialog()
      fetchPatients()
    } catch (error) {
      const errorMessage = editMode
        ? 'Failed to update patient'
        : 'Failed to create patient'
      setFormError(error.response?.data?.message || errorMessage)
    }
  }

  const handleOpenViewDialog = (patient) => {
    setViewPatient(patient)
    setOpenViewDialog(true)
  }

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false)
    setViewPatient(null)
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
          Patients
        </Typography>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search patients by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiInputBase-root': { minHeight: 44 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
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
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      Name
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
                        fontWeight: 'bold',
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      Phone
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
                      Gender
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
                      Blood Group
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
                      Date of Birth
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
                  {patients.map((patient) => (
                    <TableRow
                      key={patient.id}
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
                        {patient.username || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', sm: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {patient.email || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {patient.phoneNo || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{ display: { xs: 'none', md: 'table-cell' } }}
                      >
                        <Chip
                          label={patient.gender}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', lg: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {patient.bloodGroup || 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: 'none', md: 'table-cell' },
                          fontSize: '0.95rem',
                        }}
                      >
                        {patient.dateOfBirth
                          ? format(
                              new Date(patient.dateOfBirth),
                              'MMM dd, yyyy'
                            )
                          : 'N/A'}
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
                            onClick={() => handleOpenViewDialog(patient)}
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
                                onClick={() => handleOpenEditDialog(patient)}
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
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box py={{ xs: 4, sm: 6 }}>
                          <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                          >
                            No patients found
                          </Typography>
                        </Box>
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

      {/* Add/Edit Patient Dialog */}
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
          {editMode ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                required
              >
                {genderOptions.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Group"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleFormChange}
                placeholder="e.g., A+, B-, O+"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
            {editMode ? 'Update Patient' : 'Add Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
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
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Patient Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
                  >
                    {viewPatient?.username?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {viewPatient?.username}
                    </Typography>
                    <Chip label={viewPatient?.gender} size="small" />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2">
                  {viewPatient?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body2">
                  {viewPatient?.phoneNo || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body2">
                  {viewPatient?.dateOfBirth
                    ? format(new Date(viewPatient.dateOfBirth), 'MMM dd, yyyy')
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Blood Group
                </Typography>
                <Typography variant="body2">
                  {viewPatient?.bloodGroup || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Emergency Contact
                </Typography>
                <Typography variant="body2">
                  {viewPatient?.emergencyContact || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2">
                  {viewPatient?.address || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseViewDialog}
            fullWidth={isMobile}
            variant="contained"
            sx={{
              minHeight: 44,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Patients
