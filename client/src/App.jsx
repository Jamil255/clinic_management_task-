import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import Rooms from './pages/Rooms'
import Profile from './pages/Profile'
import DoctorSchedule from './pages/DoctorSchedule'
import CaseRecords from './pages/CaseRecords'
import DoctorListing from './pages/DoctorListing'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctor-listing" element={<DoctorListing />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="schedules" element={<DoctorSchedule />} />
            <Route path="case-records" element={<CaseRecords />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
