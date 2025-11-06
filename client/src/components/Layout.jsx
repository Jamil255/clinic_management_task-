import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as DoctorIcon,
  CalendarMonth as CalendarIcon,
  MeetingRoom as RoomIcon,
  Schedule as ScheduleIcon,
  MedicalServices as MedicalIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const drawerWidth = 240

// Role-based menu items
const getMenuItemsForRole = (role) => {
  const allMenuItems = {
    Dashboard: {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    DoctorListing: {
      text: 'Find Doctors',
      icon: <SearchIcon />,
      path: '/doctor-listing',
    },
    Appointments: {
      text: 'Appointments',
      icon: <CalendarIcon />,
      path: '/appointments',
    },
    Patients: { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    Doctors: { text: 'Doctors', icon: <DoctorIcon />, path: '/doctors' },
    Rooms: { text: 'Rooms', icon: <RoomIcon />, path: '/rooms' },
    Schedules: {
      text: 'Schedules',
      icon: <ScheduleIcon />,
      path: '/schedules',
    },
    CaseRecords: {
      text: 'Medical Records',
      icon: <MedicalIcon />,
      path: '/case-records',
    },
  }

  // Staff/Admin - Full Access
  if (role === 'Staff') {
    return [
      allMenuItems.Dashboard,
      allMenuItems.Appointments,
      allMenuItems.Patients,
      allMenuItems.Doctors,
      allMenuItems.Rooms,
      allMenuItems.Schedules,
      allMenuItems.CaseRecords,
    ]
  }

  // Doctor - Limited Access
  if (role === 'Doctor') {
    return [
      allMenuItems.Dashboard,
      allMenuItems.Appointments,
      allMenuItems.Patients,
      allMenuItems.Schedules,
      allMenuItems.CaseRecords,
    ]
  }

  // Patient - Minimal Access
  if (role === 'Patient') {
    return [
      allMenuItems.DoctorListing,
      allMenuItems.Appointments,
      allMenuItems.Dashboard,
      allMenuItems.CaseRecords,
    ]
  }

  // Default - Full Access
  return [
    allMenuItems.Dashboard,
    allMenuItems.Appointments,
    allMenuItems.Patients,
    allMenuItems.Doctors,
    allMenuItems.Rooms,
    allMenuItems.Schedules,
    allMenuItems.CaseRecords,
  ]
}

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const menuItems = getMenuItemsForRole(user?.role?.title)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography variant="h6" noWrap component="div">
            Clinic System
          </Typography>
          <Chip
            label={user?.role?.title || 'User'}
            color={
              user?.role?.title === 'Staff'
                ? 'error'
                : user?.role?.title === 'Doctor'
                ? 'success'
                : 'primary'
            }
            size="small"
            sx={{ mt: 1, width: 'fit-content' }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Clinic Management System
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                navigate('/profile')
                handleMenuClose()
              }}
            >
              <PersonIcon sx={{ mr: 1 }} fontSize="small" />
              Profile
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout
