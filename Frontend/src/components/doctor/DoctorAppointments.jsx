import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_URL } from '../../../api';
import DoctorSidebar from './DoctorSidebar';
import axios from 'axios';

const AGE_GROUPS = ['Infant (0-1)', 'Toddler (1-3)', 'Child (3-12)', 'Teen (12-18)', 'Adult (18-60)', 'Senior (60+)'];

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    vaccineType: '',
    ageGroup: '',
    appointmentDate: '',
    appointmentTime: '',
    clinicId: '',
    currentDose: 0,
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  useEffect(() => {
    fetchAppointments();
    fetchClinics();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/V1/appointments`, authHeader());
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/V1/clinics`, authHeader());
      setClinics(res.data.clinics || []);
    } catch (err) {
      console.error('Error fetching clinics:', err);
    }
  };

  const filtered = appointments.filter(apt =>
    !search ||
    apt.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    apt.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewClick = (id) => setExpandedId(prev => (prev === id ? null : id));

  const handleEditClick = (apt) => {
    setEditingAppointment(apt);
    setFormData({
      fullName: apt.fullName || '',
      email: apt.email || '',
      phone: apt.phone || '',
      vaccineType: apt.vaccineType || '',
      ageGroup: apt.ageGroup || '',
      appointmentDate: apt.appointmentDate ? apt.appointmentDate.slice(0, 10) : '',
      appointmentTime: apt.appointmentTime || '',
      clinicId: apt.clinicId?._id || apt.clinicId || '',
      currentDose: apt.currentDose || 0,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'currentDose' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/api/V1/appointments/${editingAppointment._id}`,
        formData,
        authHeader()
      );
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      await axios.delete(
        `${API_URL}/api/V1/appointments/${confirmDeleteId}`,
        authHeader()
      );
      setConfirmDeleteId(null);
      fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <DoctorSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage all patient appointments</p>
          </div>
          <span className="bg-teal-100 text-teal-800 text-sm font-semibold px-4 py-2 rounded-full">
            {filtered.length} total
          </span>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vaccine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Clinic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No appointments found</td>
                </tr>
              ) : (
                filtered.map((apt) => {
                  const aptDate = new Date(apt.appointmentDate);
                  aptDate.setHours(0, 0, 0, 0);
                  const isUpcoming = aptDate >= today;
                  return (
                    <React.Fragment key={apt._id}>
                      <tr className="hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{apt.fullName}</div>
                          <div className="text-xs text-gray-500">{apt.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{apt.vaccineType}</div>
                          <div className="text-xs text-gray-500">Dose {apt.currentDose || 0}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {apt.clinicId?.clinicName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(apt.appointmentDate)}
                          <div className="text-xs text-gray-500">{apt.appointmentTime}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isUpcoming ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleViewClick(apt._id)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {expandedId === apt._id ? 'Hide' : 'View'}
                          </button>
                          <button
                            onClick={() => handleEditClick(apt)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(apt._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>

                      {expandedId === apt._id && (
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Patient Info</h4>
                                <div className="space-y-2 text-sm">
                                  <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900 ml-1">{apt.fullName}</span></div>
                                  <div><span className="text-gray-500">Email:</span> <span className="text-gray-900 ml-1">{apt.email}</span></div>
                                  <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900 ml-1">{apt.phone}</span></div>
                                  <div><span className="text-gray-500">Age Group:</span> <span className="text-gray-900 ml-1">{apt.ageGroup}</span></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Appointment Info</h4>
                                <div className="space-y-2 text-sm">
                                  <div><span className="text-gray-500">Vaccine:</span> <span className="font-medium text-gray-900 ml-1">{apt.vaccineType}</span></div>
                                  <div><span className="text-gray-500">Date:</span> <span className="text-gray-900 ml-1">{formatDate(apt.appointmentDate)}</span></div>
                                  <div><span className="text-gray-500">Time:</span> <span className="text-gray-900 ml-1">{apt.appointmentTime}</span></div>
                                  <div><span className="text-gray-500">Current Dose:</span> <span className="text-gray-900 ml-1">{apt.currentDose || 0}</span></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Clinic Info</h4>
                                <div className="space-y-2 text-sm">
                                  <div><span className="text-gray-500">Clinic:</span> <span className="font-medium text-gray-900 ml-1">{apt.clinicId?.clinicName || '—'}</span></div>
                                  <div><span className="text-gray-500">Address:</span> <span className="text-gray-900 ml-1">{apt.clinicId?.address || '—'}</span></div>
                                  <div><span className="text-gray-500">City:</span> <span className="text-gray-900 ml-1">{apt.clinicId?.city || '—'}</span></div>
                                  <div><span className="text-gray-500">Booked:</span> <span className="text-gray-900 ml-1">{formatDate(apt.createdAt)}</span></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Type *</label>
                  <input type="text" name="vaccineType" value={formData.vaccineType} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Group *</label>
                  <select name="ageGroup" value={formData.ageGroup} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select age group</option>
                    {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic *</label>
                  <select name="clinicId" value={formData.clinicId} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select clinic</option>
                    {clinics.map(c => <option key={c._id} value={c._id}>{c.clinicName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date *</label>
                  <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time *</label>
                  <input type="time" name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Dose</label>
                  <input type="number" name="currentDose" value={formData.currentDose} onChange={handleChange} min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-2 rounded-lg hover:shadow-lg transition-all font-semibold">
                  Save Changes
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-all font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Appointment</h3>
            <p className="text-gray-600 text-sm mb-5">Are you sure you want to delete this appointment? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteConfirmed}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-semibold">
                Delete
              </button>
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
