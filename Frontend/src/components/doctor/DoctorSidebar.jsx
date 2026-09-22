import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { usePatient } from '../../contexts/PatientContext';

const DoctorSidebar = () => {
  const { selectedPatient } = usePatient();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const userName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.name || 'Doctor';
    } catch {
      return 'Doctor';
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="bg-gradient-to-b from-cyan-600 via-teal-600 to-blue-600 text-white w-64 min-h-screen fixed left-0 top-0 p-6 shadow-lg flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          🏥 Doctor Portal
        </h2>
        <nav className="space-y-2">
          <Link 
            to="/doctor/dashboard" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/dashboard') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/doctor/appointments" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/appointments') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Appointments
          </Link>
          <Link 
            to="/doctor/clinics" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/clinics') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Clinics
          </Link>
          <Link 
            to="/doctor/vaccines" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/vaccines') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Vaccines
          </Link>
          <Link 
            to="/doctor/doses" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/doses') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Doses
          </Link>

          {/* 🔥 YOUR IMMUNIZATION LOG LINK */}
          <Link 
            to="/doctor/create-log" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/create-log') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Create New Log
          </Link>

          <Link 
            to="/doctor/logs" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/logs') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Show Logs
          </Link>

          <Link 
            to="/doctor/profile" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/doctor/profile') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Profile
          </Link>
        </nav>

        {/* Selected Patient Display */}
        {selectedPatient && (
          <div className="mt-6 p-3 bg-white/20 rounded-lg border border-white/30">
            <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Active Patient</p>
            <p className="text-sm font-bold text-white mt-1">{selectedPatient.name}</p>
            <p className="text-xs text-white/70 truncate">{selectedPatient.email}</p>
          </div>
        )}
      </div>

      {/* User Profile and Logout */}
      <div className="border-t border-white/20 pt-6 space-y-3">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium truncate">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DoctorSidebar;