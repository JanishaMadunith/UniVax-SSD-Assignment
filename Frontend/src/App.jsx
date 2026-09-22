import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PatientProvider } from './contexts/PatientContext';
import SignUp from './components/Auth/Signup';
import Login from './components/Auth/Login';
import Landing from './components/Auth/Landing';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import PatientDashboard from './components/patient/Dashboard';
import PatientClinics from './components/patient/Clinics';
import PatientAbout from './components/patient/About';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import DoctorAppointments from './components/doctor/DoctorAppointments';
import DoctorClinics from './components/doctor/DoctorClinics';
import DoctorVaccines from './components/doctor/DoctorVaccines';
import DoctorDoses from './components/doctor/DoctorDoses';
import DoctorProfile from './components/doctor/DoctorProfile';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminClinics from './components/admin/AdminClinics';
import AdminAppointments from './components/admin/AdminAppointments';
import AdminVaccines from './components/admin/AdminVaccines';
import AdminDoses from './components/admin/AdminDoses';
import AdminLogs from './components/admin/AdminLogs';
import PatientImmunizationLogs from './components/patient/PatientImmunizationLogs';
import PatientAppointments from './components/patient/Appointments';
import MyAppointments from './components/patient/MyAppointments';
import DoctorCreateLog from './components/doctor/DoctorCreateLog';
import DoctorLogs from './components/doctor/DoctorLogs';

function App() {
  return (
    <PatientProvider> 
       {/* Wrap the entire app with PatientProvider to provide context to all components */}
      <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Auth Routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/clinics" element={<PatientClinics />} />
        <Route path="/patient/appointments" element={<PatientAppointments />} />
        <Route path="/patient/my-appointments" element={<MyAppointments />} />
        <Route path="/patient/about" element={<PatientAbout />} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/clinics" element={<DoctorClinics />} />
        <Route path="/doctor/vaccines" element={<DoctorVaccines />} />
        <Route path="/doctor/doses" element={<DoctorDoses />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />

        <Route path="/patient/immunization-logs" element={<PatientImmunizationLogs />} />
        <Route path="/doctor/create-log" element={<DoctorCreateLog />} />
        <Route path="/doctor/logs" element={<DoctorLogs />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/clinics" element={<AdminClinics />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/vaccines" element={<AdminVaccines />} />
        <Route path="/admin/doses" element={<AdminDoses />} />
        <Route path="/admin/logs" element={<AdminLogs />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </PatientProvider>
  );
}

export default App;