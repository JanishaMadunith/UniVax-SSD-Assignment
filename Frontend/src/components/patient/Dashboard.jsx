import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Syringe, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Star,
  FileText,
  ChevronRight,
  Bell,
  Activity,
  Shield,
  Award,
  TrendingUp,
  Heart,
  ChevronDown
} from 'lucide-react';
import TopNavbar from './TopNavbar';
import { Link } from 'react-router-dom';
import { appointmentAPI, vaccineAPI, clinicAPI, immunizationLogAPI } from '../../../api';

const Dashboard = () => {
  const [user, setUser] = useState({
    name: 'John',
    fullName: 'John Doe'
  });

  // Real vaccination progress state
  const [appointments, setAppointments] = useState([]);
  const [allVaccines, setAllVaccines] = useState([]);
  const [selectedProgressVaccine, setSelectedProgressVaccine] = useState('');
  const [progressData, setProgressData] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [vaccinationHistory, setVaccinationHistory] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser({ name: storedUser.name || 'User', fullName: storedUser.name || 'User' });
      fetchDashboardData(storedUser.email);
    }
  }, []);

  const fetchDashboardData = async (email) => {
    try {
      const [aptRes, vacRes, clinicRes, logRes] = await Promise.all([
        appointmentAPI.getByEmail(email),
        vaccineAPI.getAllVaccines(),
        clinicAPI.getAllClinics(),
        immunizationLogAPI.getAllLogs()
      ]);
      const apts = Array.isArray(aptRes.data) ? aptRes.data : [];
      const vacs = Array.isArray(vacRes.data) ? vacRes.data : [];
      const cls = Array.isArray(clinicRes.clinics) ? clinicRes.clinics : [];
      const logs = Array.isArray(logRes.data) ? logRes.data : (Array.isArray(logRes) ? logRes : []);
      setAppointments(apts);
      setAllVaccines(vacs);
      setClinics(cls.slice(0, 5));
      setVaccinationHistory(logs.slice(0, 5));
      if (apts.length > 0) {
        setSelectedProgressVaccine(apts[0].vaccineType);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  // Compute progress when vaccine selection changes
  useEffect(() => {
    if (!selectedProgressVaccine || appointments.length === 0) {
      setProgressData(null);
      return;
    }
    const apt = appointments.find(a => a.vaccineType === selectedProgressVaccine);
    const vaccine = allVaccines.find(v => v.name === selectedProgressVaccine);
    if (apt && vaccine) {
      const current = apt.currentDose || 0;
      const total = vaccine.totalDoses || 1;
      setProgressData({ current, total, completed: current >= total });
    } else {
      setProgressData(null);
    }
  }, [selectedProgressVaccine, appointments, allVaccines]);

  // Unique vaccine names from appointments for the dropdown
  const patientVaccineNames = [...new Set(appointments.map(a => a.vaccineType))];

  // Sample data kept for non-progress sections
  const vaccinationStatus = {
    completed: appointments.filter(a => {
      const v = allVaccines.find(v2 => v2.name === a.vaccineType);
      return v && (a.currentDose || 0) >= v.totalDoses;
    }).length,
    upcoming: appointments.filter(a => {
      const v = allVaccines.find(v2 => v2.name === a.vaccineType);
      return v && (a.currentDose || 0) < v.totalDoses;
    }).length,
    missed: 0,
    total: appointments.length
  };

  const upcomingAppointments = appointments
    .filter(a => new Date(a.appointmentDate) >= new Date(new Date().setHours(0,0,0,0)))
    .map(a => ({
      id: a._id,
      vaccine: a.vaccineType,
      date: a.appointmentDate,
      time: a.appointmentTime,
      clinic: a.clinicId?.clinicName || 'Unknown',
      location: a.clinicId?.address || '',
      status: 'confirmed'
    }));

  const alerts = [];

  // --- Compute real alerts from existing data ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Upcoming appointments within 3 days
  appointments.forEach(a => {
    const aptDate = new Date(a.appointmentDate);
    aptDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((aptDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 3) {
      alerts.push({
        id: `apt-soon-${a._id}`,
        icon: Calendar,
        type: 'warning',
        message: daysUntil === 0
          ? `Your ${a.vaccineType} appointment is TODAY at ${a.appointmentTime}`
          : `Your ${a.vaccineType} appointment is in ${daysUntil} day${daysUntil > 1 ? 's' : ''} (${new Date(a.appointmentDate).toLocaleDateString()})`
      });
    }
  });

  // 2. Overdue next dose (from immunization logs)
  vaccinationHistory.forEach(log => {
    if (log.nextDueDate) {
      const dueDate = new Date(log.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue > 0) {
        const vaccineName = log.vaccineId?.name || log.brand || 'Vaccine';
        alerts.push({
          id: `overdue-${log._id}`,
          icon: AlertCircle,
          type: 'warning',
          message: `Your ${vaccineName} Dose ${(log.doseNumber || 0) + 1} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please schedule it soon.`
        });
      }
    }
  });

  // 3. Upcoming next dose within 7 days (from immunization logs)
  vaccinationHistory.forEach(log => {
    if (log.nextDueDate) {
      const dueDate = new Date(log.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 7) {
        const vaccineName = log.vaccineId?.name || log.brand || 'Vaccine';
        alerts.push({
          id: `due-soon-${log._id}`,
          icon: Clock,
          type: 'info',
          message: daysUntil === 0
            ? `Your ${vaccineName} Dose ${(log.doseNumber || 0) + 1} is due today!`
            : `Your ${vaccineName} Dose ${(log.doseNumber || 0) + 1} is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`
        });
      }
    }
  });

  // 4. Incomplete vaccinations (has appointment but doses remaining)
  appointments.forEach(a => {
    const vaccine = allVaccines.find(v => v.name === a.vaccineType);
    if (vaccine) {
      const current = a.currentDose || 0;
      const total = vaccine.totalDoses || 1;
      if (current > 0 && current < total) {
        alerts.push({
          id: `incomplete-${a._id}`,
          icon: Syringe,
          type: 'info',
          message: `${a.vaccineType}: ${current} of ${total} dose${total > 1 ? 's' : ''} completed. ${total - current} remaining.`
        });
      }
    }
  });

  // 5. Fully completed vaccines
  appointments.forEach(a => {
    const vaccine = allVaccines.find(v => v.name === a.vaccineType);
    if (vaccine) {
      const current = a.currentDose || 0;
      const total = vaccine.totalDoses || 1;
      if (current >= total && total > 0) {
        alerts.push({
          id: `complete-${a._id}`,
          icon: CheckCircle,
          type: 'success',
          message: `${a.vaccineType} vaccination fully completed! All ${total} dose${total > 1 ? 's' : ''} done.`
        });
      }
    }
  });

  // 6. No appointments at all
  if (appointments.length === 0) {
    alerts.push({
      id: 'no-appointments',
      icon: Calendar,
      type: 'info',
      message: 'You have no appointments yet. Book one to start your vaccination journey!'
    });
  }

  // Sort alerts: warnings first (action-required), then success, then info
  const sortedAlerts = alerts.sort((a, b) => {
    const priority = { warning: 0, success: 2, info: 1 };
    return priority[a.type] - priority[b.type];
  });

  // Show max 4 in dashboard, rest accessible via badge
  const visibleAlerts = sortedAlerts.slice(0, 4);
  const hiddenAlertsCount = sortedAlerts.length - visibleAlerts.length;

  const progressPercentage = vaccinationStatus.total > 0
    ? (vaccinationStatus.completed / vaccinationStatus.total) * 100
    : 0;

  const healthStreak = 15;

  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Welcome Section with Enhanced Design */}
          <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  Welcome back, {user.name}! 👋
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    🌟 Health Streak: {healthStreak} days
                  </span>
                </h1>
                <p className="text-teal-100 text-lg">
                  Stay on track with your vaccination schedule
                </p>
                <div className="mt-4 flex gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-xs opacity-80">Next Appointment</p>
                    <p className="text-sm font-semibold">April 15, 2026</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-xs opacity-80">Vaccines Completed</p>
                    <p className="text-sm font-semibold">{vaccinationStatus.completed}/2</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                <Heart className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards with Icons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-teal-500 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Completed Doses</p>
                  <p className="text-4xl font-bold text-gray-800">{vaccinationStatus.completed}</p>
                  <p className="text-xs text-green-600 mt-2">↑ 100% from last month</p>
                </div>
                <div className="bg-teal-100 rounded-full p-3 group-hover:scale-110 transition">
                  <CheckCircle className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-amber-500 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Upcoming Doses</p>
                  <p className="text-4xl font-bold text-gray-800">{vaccinationStatus.upcoming}</p>
                  <p className="text-xs text-amber-600 mt-2">Due in 15 days</p>
                </div>
                <div className="bg-amber-100 rounded-full p-3 group-hover:scale-110 transition">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-b-4 border-rose-500 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Missed Doses</p>
                  <p className="text-4xl font-bold text-gray-800">{vaccinationStatus.missed}</p>
                  <p className="text-xs text-green-600 mt-2">✓ On track</p>
                </div>
                <div className="bg-rose-100 rounded-full p-3 group-hover:scale-110 transition">
                  <AlertCircle className="w-8 h-8 text-rose-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Protection Level</p>
                  <p className="text-4xl font-bold">{Math.round(progressPercentage)}%</p>
                  <p className="text-xs text-white/70 mt-2">↑ Good progress</p>
                </div>
                <div className="bg-white/20 rounded-full p-3 group-hover:scale-110 transition">
                  <Shield className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Vaccination Progress – Real Data with Vaccine Dropdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Syringe className="w-6 h-6 text-teal-600" />
                  💉 Vaccination Progress
                </h2>
                <p className="text-sm text-gray-500 mt-1">Track your dose completion</p>
              </div>
              <Activity className="w-5 h-5 text-teal-600" />
            </div>

            {patientVaccineNames.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Select Vaccine</label>
                  <select
                    value={selectedProgressVaccine}
                    onChange={(e) => setSelectedProgressVaccine(e.target.value)}
                    className="w-full md:w-1/2 border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {patientVaccineNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {progressData ? (
                  <div className="border border-gray-100 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-800 text-lg">{selectedProgressVaccine}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        progressData.completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {progressData.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Dose {progressData.current} of {progressData.total}</span>
                      <span className="font-semibold text-teal-600">
                        {Math.round((progressData.current / progressData.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-700 ${
                          progressData.completed
                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                        }`}
                        style={{ width: `${(progressData.current / progressData.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-3">
                      {Array.from({ length: progressData.total }, (_, i) => (
                        <div key={i} className="flex items-center gap-1 text-sm">
                          {i < progressData.current ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                          <span className={i < progressData.current ? 'text-green-700' : 'text-gray-400'}>
                            Dose {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No progress data available for this vaccine.</p>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-6">No vaccine appointments found. Book an appointment to start tracking.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Upcoming Appointments - Enhanced */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-teal-600" />
                    📅 Upcoming Appointments
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Your next scheduled visits</p>
                </div>
                <Link to="/patient/appointments" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 group">
                  View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
              </div>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{appointment.vaccine}</h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-teal-600" />
                              {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-teal-600" />
                              {appointment.time}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-teal-600" />
                              {appointment.clinic} - {appointment.location}
                            </p>
                          </div>
                        </div>
                        <div className="bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
              )}
            </div>

            {/* Alerts & Notifications - Enhanced */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-teal-600" />
                    ⚠️ Alerts & Notifications
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Important updates for you</p>
                </div>
                {sortedAlerts.length > 0 && (
                  <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full">
                    {sortedAlerts.length}
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {visibleAlerts.length > 0 ? visibleAlerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <div key={alert.id} className={`p-4 rounded-xl ${
                      alert.type === 'warning'
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500'
                        : alert.type === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500'
                        : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500'
                    } hover:shadow-md transition-all`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 ${
                          alert.type === 'warning' ? 'text-amber-600'
                          : alert.type === 'success' ? 'text-green-600'
                          : 'text-teal-600'
                        } mt-0.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            alert.type === 'warning' ? 'text-amber-800'
                            : alert.type === 'success' ? 'text-green-800'
                            : 'text-teal-800'
                          }`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {alert.type === 'warning' ? 'Action required soon' : alert.type === 'success' ? 'Well done!' : 'Stay informed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-gray-500 text-center py-8">No alerts at this time</p>
                )}
                {hiddenAlertsCount > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl hover:shadow-md transition-all">
                    <Link
                      to="/patient/dashboard#all-alerts"
                      onClick={() => document.querySelector('.alerts-container')?.classList.remove('max-h-96')}
                      className="flex items-center justify-between text-sm font-medium text-blue-700 hover:text-blue-900 group"
                    >
                      <span>📊 View {hiddenAlertsCount} more alert{hiddenAlertsCount > 1 ? 's' : ''}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Nearby Clinics - Real Data */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-teal-600" />
                    🏥 Clinics
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Vaccination centers available</p>
                </div>
                <Link to="/patient/clinics" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 group">
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
              </div>
              <div className="space-y-3">
                {clinics.length > 0 ? clinics.map((clinic) => (
                  <div key={clinic._id} className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 rounded-xl transition-all cursor-pointer">
                    <div>
                      <h3 className="font-semibold text-gray-800">{clinic.clinicName}</h3>
                      <p className="text-sm text-gray-500">{clinic.address}, {clinic.city}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{clinic.clinicType}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-teal-600">Open {clinic.openTime} – {clinic.closeTime}</span>
                      </div>
                    </div>
                    <div className="bg-teal-100 rounded-full p-2">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-6">No clinics available</p>
                )}
              </div>
            </div>

            {/* Quick Actions - Enhanced with Immunization Logs */}
            <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ⚡ Quick Actions
                <span className="text-xs bg-white px-2 py-1 rounded-full text-teal-600">Fast access</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/patient/my-appointments" className="bg-white hover:shadow-xl transition-all rounded-xl p-4 text-center group border border-gray-100">
                  <Calendar className="w-10 h-10 text-teal-600 mx-auto mb-2 group-hover:scale-110 transition" />
                  <p className="text-sm font-semibold text-gray-700">My Appointments</p>
                  <p className="text-xs text-gray-400 mt-1">View your bookings</p>
                </Link>

                <Link to="/patient/immunization-logs" className="bg-white hover:shadow-xl transition-all rounded-xl p-4 text-center group border border-gray-100">
                  <FileText className="w-10 h-10 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition" />
                  <p className="text-sm font-semibold text-gray-700">Immunization Logs</p>
                  <p className="text-xs text-gray-400 mt-1">View full vaccination history</p>
                </Link>

                <Link to="/patient/about" className="bg-white hover:shadow-xl transition-all rounded-xl p-4 text-center group border border-gray-100">
                  <Star className="w-10 h-10 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition" />
                  <p className="text-sm font-semibold text-gray-700">About Us</p>
                  <p className="text-xs text-gray-400 mt-1">Learn about UniVax</p>
                </Link>

                <Link to="/patient/clinics" className="bg-white hover:shadow-xl transition-all rounded-xl p-4 text-center group border border-gray-100">
                  <MapPin className="w-10 h-10 text-cyan-600 mx-auto mb-2 group-hover:scale-110 transition" />
                  <p className="text-sm font-semibold text-gray-700">View Clinics</p>
                  <p className="text-xs text-gray-400 mt-1">Find nearby centers</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Vaccination History - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-teal-600" />
                  📊 Vaccination History
                </h2>
                <p className="text-sm text-gray-500 mt-1">Complete record of your vaccinations</p>
              </div>
              <Award className="w-5 h-5 text-teal-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vaccine</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Dose</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinationHistory.map((log, idx) => (
                    <tr key={log._id || idx} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all">
                      <td className="py-3 px-4 text-gray-800 font-medium">{log.vaccineId?.name || log.brand}</td>
                      <td className="py-3 px-4 text-gray-600">Dose {log.doseNumber}</td>
                      <td className="py-3 px-4 text-gray-600">{new Date(log.dateAdministered).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Administered
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.clinic}</td>
                      <td className="py-3 px-4">
                        <Link to="/patient/immunization-logs" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1">
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {vaccinationHistory.length === 0 && (
              <p className="text-center text-gray-500 py-8">No immunization logs found</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;