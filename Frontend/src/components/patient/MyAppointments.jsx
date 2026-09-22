import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Building2, Syringe, Clock, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import TopNavbar from './TopNavbar';
import { appointmentAPI, vaccineAPI } from '../../../api';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [vaccineMap, setVaccineMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // ID awaiting confirmation

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.email) {
        toast.error('Please log in to view appointments');
        return;
      }
      const [aptRes, vacRes] = await Promise.all([
        appointmentAPI.getByEmail(user.email),
        vaccineAPI.getAllVaccines()
      ]);
      const apts = Array.isArray(aptRes.data) ? aptRes.data : [];
      const vacs = Array.isArray(vacRes.data) ? vacRes.data : [];
      // Build a name→totalDoses map
      const map = {};
      vacs.forEach(v => { map[v.name] = v.totalDoses || 1; });
      setVaccineMap(map);
      setAppointments(apts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      setConfirmId(null);
      await appointmentAPI.deleteAppointment(id);
      toast.success('Appointment deleted successfully');
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  // An appointment is "completed" when all doses are done
  const isCompleted = (apt) => {
    const total = vaccineMap[apt.vaccineType] || 1;
    return (apt.currentDose || 0) >= total;
  };

  const isFutureDate = (date) => {
    const aptDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return aptDate >= today;
  };

  const completed = appointments.filter((a) => isCompleted(a));
  const upcoming = appointments.filter((a) => !isCompleted(a) && isFutureDate(a.appointmentDate));
  const past = appointments.filter((a) => !isCompleted(a) && !isFutureDate(a.appointmentDate));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <TopNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="text-green-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600">View and manage your vaccination appointments</p>
            </div>
          </div>
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow hover:shadow-md transition-all text-gray-600 hover:text-green-600"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments</h3>
            <p className="text-gray-500">You haven't booked any appointments yet. Visit a clinic page to book one.</p>
          </div>
        ) : (
          <>
            {/* Confirmation Modal */}
            {confirmId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-red-600" size={26} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Appointment?</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    This will permanently remove the appointment. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmId(null)}
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Keep It
                    </button>
                    <button
                      onClick={() => handleDelete(confirmId)}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
            {/* Upcoming Appointments */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-4">
                  {upcoming.map((apt) => (
                    <AppointmentCard
                      key={apt._id}
                      appointment={apt}
                      vaccineMap={vaccineMap}
                      onRequestDelete={setConfirmId}
                      deletingId={deletingId}
                      status="upcoming"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Appointments */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
                  Completed ({completed.length})
                </h2>
                <div className="space-y-4">
                  {completed.map((apt) => (
                    <AppointmentCard
                      key={apt._id}
                      appointment={apt}
                      vaccineMap={vaccineMap}
                      onRequestDelete={setConfirmId}
                      deletingId={deletingId}
                      status="completed"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past (date passed, not completed) */}
            {past.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  Past ({past.length})
                </h2>
                <div className="space-y-4">
                  {past.map((apt) => (
                    <AppointmentCard
                      key={apt._id}
                      appointment={apt}
                      vaccineMap={vaccineMap}
                      onRequestDelete={setConfirmId}
                      deletingId={deletingId}
                      status="past"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
};

const AppointmentCard = ({ appointment, vaccineMap, onRequestDelete, deletingId, status }) => {
  const clinicName = appointment.clinicId?.clinicName || 'Unknown Clinic';
  const clinicCity = appointment.clinicId?.city || '';
  const totalDoses = vaccineMap[appointment.vaccineType] || 1;
  const currentDose = appointment.currentDose || 0;

  const borderColor = status === 'upcoming' ? 'border-green-500' : status === 'completed' ? 'border-teal-400' : 'border-gray-300';

  return (
    <div className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 ${borderColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Syringe size={18} className="text-blue-500" />
            <span className="font-semibold text-gray-900 text-lg">{appointment.vaccineType}</span>
            {status === 'upcoming' && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Upcoming</span>
            )}
            {status === 'completed' && (
              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full flex items-center gap-1">
                <CheckCircle size={11} /> Completed
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Building2 size={14} />
              <span>{clinicName}{clinicCity ? `, ${clinicCity}` : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{new Date(appointment.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{appointment.appointmentTime}</span>
            </div>
          </div>

          {/* Dose progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Doses completed</span>
              <span>{currentDose} / {totalDoses}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${status === 'completed' ? 'bg-teal-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((currentDose / totalDoses) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Delete button shown on all statuses */}
        <button
          onClick={() => onRequestDelete(appointment._id)}
          disabled={deletingId === appointment._id}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 self-start sm:self-center"
        >
          <Trash2 size={16} />
          {deletingId === appointment._id ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default MyAppointments;
