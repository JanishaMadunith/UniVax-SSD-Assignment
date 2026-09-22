import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const AdminSidebar = () => {
  const [userName, setUserName] = useState('Admin');
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserName(user.name || 'Admin');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="bg-gradient-to-b from-cyan-600 via-teal-600 to-blue-600 text-white w-64 min-h-screen fixed left-0 top-0 p-6 shadow-lg flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          ⚙️ Admin Portal
        </h2>
        <nav className="space-y-2">
          <Link 
            to="/admin/dashboard" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/dashboard') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/users" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/users') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Users
          </Link>
          <Link 
            to="/admin/clinics" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/clinics') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Clinics
          </Link>
          <Link 
            to="/admin/appointments" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/appointments') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Appointments
          </Link>
          <Link 
            to="/admin/vaccines" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/vaccines') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Vaccines
          </Link>
          <Link 
            to="/admin/doses" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/doses') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Doses
          </Link>
          <Link 
            to="/admin/logs" 
            className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/admin/logs') 
                ? 'bg-white/30 font-semibold' 
                : 'hover:bg-white/20'
            }`}
          >
            Logs
          </Link>
        </nav>
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

export default AdminSidebar;
