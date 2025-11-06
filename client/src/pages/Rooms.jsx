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
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MeetingRoom as RoomIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { roomAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

const Rooms = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isStaff = user?.role?.title === 'Staff'

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [roomToDelete, setRoomToDelete] = useState(null)
  const [viewRoom, setViewRoom] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    roomNo: '',
    floor: '',
    staffId: user?.id || '',
    isActive: true,
  })
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await roomAPI.getAll()
      setRooms(response.data.data)
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDeleteDialog = (room) => {
    if (!isStaff) {
      alert('Only staff members can delete rooms')
      return
    }
    setRoomToDelete(room)
    setDeleteError('')
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setRoomToDelete(null)
    setDeleteError('')
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleteError('')
      await roomAPI.delete(roomToDelete.id)
      handleCloseDeleteDialog()
      fetchRooms()
    } catch (error) {
      
      setDeleteError(error.response?.data?.message || 'Failed to delete room')
    }
  }

  const handleOpenDialog = () => {
    setEditMode(false)
    setSelectedRoomId(null)
    setFormData({
      name: '',
      roomNo: '',
      floor: '',
      staffId: user?.id || '',
      isActive: true,
    })
    setFormError('')
    setOpenDialog(true)
  }

  const handleOpenEditDialog = (room) => {
    setEditMode(true)
    setSelectedRoomId(room.id)
    setFormData({
      name: room.name,
      roomNo: room.roomNo,
      floor: room.floor,
      staffId: room.staffId || user?.id || '',
      isActive: room.isActive,
    })
    setFormError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditMode(false)
    setSelectedRoomId(null)
    setFormError('')
  }

  const handleFormChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async () => {
    try {
      setFormError('')
      if (editMode) {
        await roomAPI.update(selectedRoomId, formData)
      } else {
        await roomAPI.create(formData)
      }
      handleCloseDialog()
      fetchRooms()
    } catch (error) {
      const errorMessage = editMode
        ? 'Failed to update room'
        : 'Failed to create room'
      setFormError(error.response?.data?.message || errorMessage)
    }
  }

  const handleOpenViewDialog = (room) => {
    setViewRoom(room)
    setOpenViewDialog(true)
  }

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false)
    setViewRoom(null)
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
          Rooms
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
            Add Room
          </Button>
        )}
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
          <TableContainer
            sx={{ maxHeight: { xs: 'calc(100vh - 250px)', md: 'none' } }}
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
                    Room Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: 'primary.light',
                      color: 'white',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    Room Number
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
                    Floor
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
                    Status
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
                    Staff Assigned
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
                {rooms.map((room) => (
                  <TableRow
                    key={room.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transition: 'background-color 0.2s ease',
                      },
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <RoomIcon
                          color="primary"
                          fontSize={isMobile ? 'small' : 'medium'}
                        />
                        <Typography
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          {room.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {room.roomNo}
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: 'none', sm: 'table-cell' },
                        fontSize: '0.95rem',
                      }}
                    >
                      {room.floor}
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: 'none', md: 'table-cell' } }}
                    >
                      <Chip
                        label={room.isActive ? 'Active' : 'Inactive'}
                        color={room.isActive ? 'success' : 'default'}
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
                      {room.staff?.username || 'N/A'}
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
                          onClick={() => handleOpenViewDialog(room)}
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
                              onClick={() => handleOpenEditDialog(room)}
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
                              onClick={() => handleOpenDeleteDialog(room)}
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
                {rooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No rooms found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Room Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editMode ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Room Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                placeholder="e.g., Consultation Room 1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number"
                name="roomNo"
                value={formData.roomNo}
                onChange={handleFormChange}
                required
                placeholder="e.g., 101"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Floor"
                name="floor"
                value={formData.floor}
                onChange={handleFormChange}
                required
                placeholder="e.g., 1st Floor"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    name="isActive"
                  />
                }
                label="Active Status"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update Room' : 'Add Room'}
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
              Delete Room
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
              Are you sure you want to delete this room?
            </Typography>
            <Box sx={{ mt: 2, pl: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Name:</strong> {roomToDelete?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Room No:</strong> {roomToDelete?.roomNo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Floor:</strong> {roomToDelete?.floor}
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

      {/* View Room Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RoomIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6">Room Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">{viewRoom?.name}</Typography>
                <Chip
                  label={viewRoom?.isActive ? 'Active' : 'Inactive'}
                  color={viewRoom?.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Room Number
                </Typography>
                <Typography variant="body2">
                  {viewRoom?.roomNo || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Floor
                </Typography>
                <Typography variant="body2">
                  {viewRoom?.floor || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Staff Assigned
                </Typography>
                <Typography variant="body2">
                  {viewRoom?.staff?.username || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Staff Email
                </Typography>
                <Typography variant="body2">
                  {viewRoom?.staff?.email || 'N/A'}
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

export default Rooms
