import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Calendar,
  Syringe,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { userAPI, clinicAPI, appointmentAPI, vaccineAPI } from '../../../api';

const roleColors = {
  Patient: '#14b8a6',
  Doctor: '#3b82f6',
  Admin: '#a855f7',
  Official: '#f59e0b',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, clinics: 0, appointments: 0, vaccines: 0 });
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [userRes, clinicRes, aptRes, vacRes] = await Promise.all([
        userAPI.getAllUsers(),
        clinicAPI.getAllClinics(),
        appointmentAPI.getAllAppointments(),
        vaccineAPI.getAllVaccines(),
      ]);

      const usersArr = Array.isArray(userRes.users) ? userRes.users : [];
      const clinicsArr = Array.isArray(clinicRes.clinics) ? clinicRes.clinics : [];
      const aptsArr = Array.isArray(aptRes.appointments) ? aptRes.appointments : [];
      const vacsArr = Array.isArray(vacRes.data) ? vacRes.data : [];

      setStats({
        users: usersArr.length,
        clinics: clinicsArr.length,
        appointments: aptsArr.length,
        vaccines: vacsArr.length,
      });
      setAppointments(aptsArr);
      setUsers(usersArr);
    } catch (err) {
      console.error('Admin dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  // Appointments by vaccine (top 5 bar chart)
  const vaccineCountMap = appointments.reduce((acc, apt) => {
    const name = apt.vaccineType || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const vaccineBars = Object.entries(vaccineCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxBar = vaccineBars.length > 0 ? Math.max(...vaccineBars.map(v => v[1])) : 1;

  // User role breakdown
  const roleBreakdown = ['Patient', 'Doctor', 'Admin', 'Official']
    .map(role => ({ role, count: users.filter(u => u.role === role).length }))
    .filter(r => r.count > 0);

  // Recent 5 appointments sorted by date desc
  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
    .slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <AdminSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">

        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and real-time analytics</p>

        {/* Stats Tiles */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-teal-500 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Users</p>
                <p className="text-4xl font-bold text-gray-800">{loading ? '—' : stats.users}</p>
                <p className="text-xs text-teal-600 mt-2">Registered accounts</p>
              </div>
              <div className="bg-teal-100 rounded-full p-3 group-hover:scale-110 transition">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-cyan-500 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Clinics</p>
                <p className="text-4xl font-bold text-gray-800">{loading ? '—' : stats.clinics}</p>
                <p className="text-xs text-cyan-600 mt-2">Active facilities</p>
              </div>
              <div className="bg-cyan-100 rounded-full p-3 group-hover:scale-110 transition">
                <Building2 className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-blue-500 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Appointments</p>
                <p className="text-4xl font-bold text-gray-800">{loading ? '—' : stats.appointments}</p>
                <p className="text-xs text-blue-600 mt-2">Across all patients</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3 group-hover:scale-110 transition">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Vaccines</p>
                <p className="text-4xl font-bold">{loading ? '—' : stats.vaccines}</p>
                <p className="text-xs text-white/70 mt-2">In catalog</p>
              </div>
              <div className="bg-white/20 rounded-full p-3 group-hover:scale-110 transition">
                <Syringe className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar Chart – Appointments by Vaccine */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-800">Appointments by Vaccine</h2>
            </div>
            {vaccineBars.length > 0 ? (
              <div className="space-y-5">
                {vaccineBars.map(([name, count], i) => (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[65%]">{name}</span>
                      <span className="text-sm font-bold text-teal-700">{count} appointment{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-6 rounded-full flex items-center pl-3 text-white text-xs font-semibold transition-all duration-700"
                        style={{
                          width: `${Math.max((count / maxBar) * 100, 8)}%`,
                          background: `hsl(${175 + i * 22}, 58%, ${42 + i * 4}%)`,
                        }}
                      >
                        {Math.round((count / maxBar) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">No appointment data yet</p>
            )}
          </div>

          {/* User Role Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-800">User Breakdown</h2>
            </div>
            {roleBreakdown.length > 0 ? (
              <>
                {/* Stacked bar */}
                <div className="w-full h-5 rounded-full overflow-hidden flex mb-5">
                  {roleBreakdown.map(({ role, count }) => (
                    <div
                      key={role}
                      style={{ width: `${(count / stats.users) * 100}%`, backgroundColor: roleColors[role] || '#94a3b8' }}
                      title={`${role}: ${count}`}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  {roleBreakdown.map(({ role, count }) => (
                    <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roleColors[role] }} />
                        <span className="text-sm font-medium text-gray-700">{role}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${(count / stats.users) * 100}%`, backgroundColor: roleColors[role] }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-800 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-10">No user data yet</p>
            )}
          </div>
        </div>

        {/* Recent Appointments Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-800">Recent Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Patient</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vaccine</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Clinic</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((apt) => {
                  const aptDate = new Date(apt.appointmentDate);
                  aptDate.setHours(0, 0, 0, 0);
                  const isUpcoming = aptDate >= today;
                  return (
                    <tr key={apt._id} className="border-b border-gray-100 hover:bg-teal-50 transition-all">
                      <td className="py-3 px-4 text-gray-800 font-medium">{apt.fullName}</td>
                      <td className="py-3 px-4 text-gray-600">{apt.vaccineType}</td>
                      <td className="py-3 px-4 text-gray-600">{apt.clinicId?.clinicName || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{aptDate.toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isUpcoming ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isUpcoming ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {recentAppointments.length === 0 && (
            <p className="text-center text-gray-500 py-8">No appointments found</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
