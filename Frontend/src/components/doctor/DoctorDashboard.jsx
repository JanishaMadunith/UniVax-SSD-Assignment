import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DoctorSidebar from './DoctorSidebar';
import { appointmentAPI, vaccineAPI, clinicAPI, immunizationLogAPI } from '../../../api';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({ appointments: 0, vaccines: 0, clinics: 0, logs: 0 });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [aptRes, vacRes, clinRes, logRes] = await Promise.all([
        appointmentAPI.getAllAppointments(),
        vaccineAPI.getAllVaccines(),
        clinicAPI.getAllClinics(),
        immunizationLogAPI.getAllLogs(),
      ]);
      const apts = aptRes.appointments || [];
      const vacs = vacRes.data || [];
      const clins = clinRes.clinics || [];
      const logs = logRes.data || [];
      setAppointments(apts);
      setStats({ appointments: apts.length, vaccines: vacs.length, clinics: clins.length, logs: logs.length });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Bar chart: top 5 vaccine types by appointment count
  const vaccineBreakdown = Object.entries(
    appointments.reduce((acc, apt) => {
      const key = apt.vaccineType || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxBar = vaccineBreakdown.length > 0 ? vaccineBreakdown[0][1] : 1;
  const barColors = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b'];

  // Upcoming appointments (next 5 sorted by date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = appointments
    .filter(apt => {
      const d = new Date(apt.appointmentDate);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    })
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    .slice(0, 5);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <DoctorSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, Dr. {user.name || 'Doctor'}</p>

        {/* Stats Tiles */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-teal-500 hover:shadow-xl transition-all">
            <p className="text-sm text-gray-500 font-medium">Total Appointments</p>
            <p className="text-4xl font-bold text-teal-600 mt-2">
              {loading ? '—' : stats.appointments}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-cyan-500 hover:shadow-xl transition-all">
            <p className="text-sm text-gray-500 font-medium">Vaccines Available</p>
            <p className="text-4xl font-bold text-cyan-600 mt-2">
              {loading ? '—' : stats.vaccines}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-blue-500 hover:shadow-xl transition-all">
            <p className="text-sm text-gray-500 font-medium">Active Clinics</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {loading ? '—' : stats.clinics}
            </p>
          </div>
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all">
            <p className="text-sm font-medium opacity-90">Immunization Logs</p>
            <p className="text-4xl font-bold mt-2">
              {loading ? '—' : stats.logs}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Appointments by Vaccine */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Appointments by Vaccine</h2>
            <p className="text-sm text-gray-500 mb-6">Top 5 vaccine types by appointment volume</p>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
              </div>
            ) : vaccineBreakdown.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No appointment data yet</div>
            ) : (
              <div className="space-y-4">
                {vaccineBreakdown.map(([vaccine, count], i) => (
                  <div key={vaccine}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate max-w-[65%]">{vaccine}</span>
                      <span className="text-gray-500 font-semibold">{count} appointments</span>
                    </div>
                    <div className="h-7 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${(count / maxBar) * 100}%`, backgroundColor: barColors[i] }}
                      >
                        <span className="text-white text-xs font-semibold">
                          {Math.round((count / stats.appointments) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Upcoming</h2>
            <p className="text-sm text-gray-500 mb-4">Next scheduled appointments</p>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No upcoming appointments</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(apt => (
                  <div key={apt._id} className="flex items-start gap-3 p-3 rounded-xl bg-teal-50 border border-teal-100">
                    <div className="bg-teal-500 text-white text-xs font-bold rounded-lg px-2 py-1 min-w-fit">
                      {formatDate(apt.appointmentDate)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{apt.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{apt.vaccineType}</p>
                      <p className="text-xs text-teal-600">{apt.appointmentTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;