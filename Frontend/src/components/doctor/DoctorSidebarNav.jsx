import React from 'react';
import { Link } from 'react-router-dom';

const DoctorSidebar = () => {
  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen fixed left-0 top-0 p-6">
      <h2 className="text-2xl font-bold mb-8">Doctor Portal</h2>
      <nav className="space-y-4">
        <Link 
          to="/doctor/dashboard" 
          className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Dashboard
        </Link>
        <Link 
          to="/doctor/appointments" 
          className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Appointments
        </Link>
        <Link 
          to="/doctor/clinics" 
          className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Clinics
        </Link>
        <Link 
          to="/doctor/vaccines" 
          className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Vaccines
        </Link>
        <Link 
          to="/doctor/doses" 
          className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Doses
        </Link>
        <Link 
          to="/doctor/profile" 
          className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Profile
        </Link>
      </nav>
    </div>
  );
};

export default DoctorSidebar;
