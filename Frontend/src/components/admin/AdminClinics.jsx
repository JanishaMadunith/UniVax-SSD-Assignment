import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const AdminClinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedClinic, setExpandedClinic] = useState(null);
  const [editingClinic, setEditingClinic] = useState(null);
  const [allVaccines, setAllVaccines] = useState([]);
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    clinicType: '',
    description: '',
    openDays: [],
    openTime: '',
    closeTime: '',
    availableVaccines: []
  });

  // Days of week for checkboxes
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch all clinics and vaccines
  useEffect(() => {
    fetchClinics();
    fetchVaccines();
  }, []);

  const fetchVaccines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/V1/vaccines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllVaccines(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/V1/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data.clinics || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      alert('Failed to fetch clinics');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle open days checkbox changes
  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      openDays: prev.openDays.includes(day)
        ? prev.openDays.filter(d => d !== day)
        : [...prev.openDays, day]
    }));
  };

  // Handle adding a vaccine row
  const handleAddVaccine = () => {
    setFormData(prev => ({
      ...prev,
      availableVaccines: [...prev.availableVaccines, { vaccineId: '', quantity: 0 }]
    }));
  };

  // Handle removing a vaccine row
  const handleRemoveVaccine = (index) => {
    setFormData(prev => ({
      ...prev,
      availableVaccines: prev.availableVaccines.filter((_, i) => i !== index)
    }));
  };

  // Handle vaccine selection or quantity change
  const handleVaccineChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      availableVaccines: prev.availableVaccines.map((v, i) =>
        i === index ? { ...v, [field]: field === 'quantity' ? Number(value) : value } : v
      )
    }));
  };

  // Open modal for adding new clinic
  const handleAddClick = () => {
    setEditingClinic(null);
    setFormData({
      clinicName: '',
      address: '',
      city: '',
      district: '',
      phone: '',
      email: '',
      clinicType: '',
      description: '',
      openDays: [],
      openTime: '',
      closeTime: '',
      availableVaccines: []
    });
    setShowModal(true);
  };

  // Open modal for editing clinic
  const handleEditClick = (clinic) => {
    setEditingClinic(clinic);
    setFormData({
      clinicName: clinic.clinicName,
      address: clinic.address,
      city: clinic.city,
      district: clinic.district,
      phone: clinic.phone,
      email: clinic.email,
      clinicType: clinic.clinicType,
      description: clinic.description,
      openDays: clinic.openDays,
      openTime: clinic.openTime,
      closeTime: clinic.closeTime,
      availableVaccines: (clinic.availableVaccines || []).map(v => ({
        vaccineId: v.vaccineId?._id || v.vaccineId,
        quantity: v.quantity || 0
      }))
    });
    setShowModal(true);
  };

  // Toggle expand/collapse for clinic details
  const handleViewClick = (clinic) => {
    if (expandedClinic === clinic._id) {
      setExpandedClinic(null); // Collapse if already expanded
    } else {
      setExpandedClinic(clinic._id); // Expand the clicked clinic
    }
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      if (editingClinic) {
        // Update clinic
        await axios.put(`${API_URL}/api/V1/clinics/${editingClinic._id}`, formData, authHeader);
        alert('Clinic updated successfully');
      } else {
        // Create new clinic
        await axios.post(`${API_URL}/api/V1/clinics/create`, formData, authHeader);
        alert('Clinic added successfully');
      }
      setShowModal(false);
      fetchClinics(); // Refresh the list
    } catch (error) {
      console.error('Error saving clinic:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save clinic';
      alert('Failed to save clinic: ' + msg);
    }
  };

  // Delete clinic
  const handleDeleteClick = async (clinicId) => {
    if (window.confirm('Are you sure you want to delete this clinic?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/V1/clinics/${clinicId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Clinic deleted successfully');
        fetchClinics(); // Refresh the list
      } catch (error) {
        console.error('Error deleting clinic:', error);
        alert('Failed to delete clinic');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <AdminSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinics</h1>
          <button
            onClick={handleAddClick}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
          >
            Add Clinic
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Clinic Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                  </td>
                </tr>
              ) : clinics.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No clinics found
                  </td>
                </tr>
              ) : (
                clinics.map((clinic) => (
                  <React.Fragment key={clinic._id}>
                    <tr className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{clinic.clinicName}</div>
                        <div className="text-xs text-gray-500">{clinic.clinicType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{clinic.city}, {clinic.district}</div>
                        <div className="text-xs text-gray-500">{clinic.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{clinic.phone}</div>
                        <div className="text-xs text-gray-500">{clinic.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(clinic.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewClick(clinic)}
                          className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {expandedClinic === clinic._id ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => handleEditClick(clinic)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(clinic._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {/* Expandable Details Section */}
                    {expandedClinic === clinic._id && (
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Clinic Details</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Clinic Information</h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs text-gray-500">Clinic Name:</span>
                                    <p className="text-sm font-medium text-gray-900">{clinic.clinicName}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Clinic Type:</span>
                                    <p className="text-sm text-gray-900">{clinic.clinicType}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Description:</span>
                                    <p className="text-sm text-gray-900">{clinic.description || 'No description provided'}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Location Details</h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs text-gray-500">Address:</span>
                                    <p className="text-sm text-gray-900">{clinic.address}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">City:</span>
                                    <p className="text-sm text-gray-900">{clinic.city}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">District:</span>
                                    <p className="text-sm text-gray-900">{clinic.district}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs text-gray-500">Phone:</span>
                                    <p className="text-sm text-gray-900">{clinic.phone}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Email:</span>
                                    <p className="text-sm text-gray-900">{clinic.email}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Operating Hours</h4>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs text-gray-500">Open Time:</span>
                                    <p className="text-sm text-gray-900">{formatTime(clinic.openTime)}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Close Time:</span>
                                    <p className="text-sm text-gray-900">{formatTime(clinic.closeTime)}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Open Days:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {clinic.openDays.map((day) => (
                                        <span key={day} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                          {day}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-xs text-gray-500">Created Date:</span>
                                    <p className="text-sm text-gray-900">{formatDate(clinic.createdAt)}</p>
                                  </div>
                                  {clinic.updatedAt && clinic.updatedAt !== clinic.createdAt && (
                                    <div>
                                      <span className="text-xs text-gray-500">Last Updated:</span>
                                      <p className="text-sm text-gray-900">{formatDate(clinic.updatedAt)}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Available Vaccines */}
                              {clinic.availableVaccines && clinic.availableVaccines.length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Available Vaccines</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {clinic.availableVaccines.map((v, idx) => (
                                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                        {v.vaccineId?.name || 'Unknown'} — Qty: {v.quantity}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              <h2 className="text-xl font-bold text-white">
                {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name *</label>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Type *</label>
                  <input
                    type="text"
                    name="clinicType"
                    value={formData.clinicType}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Vaccination Center"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Open Time *</label>
                  <input
                    type="time"
                    name="openTime"
                    value={formData.openTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Close Time *</label>
                  <input
                    type="time"
                    name="closeTime"
                    value={formData.closeTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Open Days *</label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.openDays.includes(day)}
                        onChange={() => handleDayChange(day)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Available Vaccines (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Available Vaccines (Optional)</label>
                  <button
                    type="button"
                    onClick={handleAddVaccine}
                    className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                  >
                    + Add Vaccine
                  </button>
                </div>
                {formData.availableVaccines.length > 0 ? (
                  <div className="space-y-2">
                    {formData.availableVaccines.map((v, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={v.vaccineId}
                          onChange={(e) => handleVaccineChange(index, 'vaccineId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">Select Vaccine</option>
                          {allVaccines.map((vaccine) => (
                            <option key={vaccine._id} value={vaccine._id}>{vaccine.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={v.quantity}
                          onChange={(e) => handleVaccineChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVaccine(index)}
                          className="text-red-500 hover:text-red-700 px-2 py-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No vaccines added. You can add them later when updating.</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg"
                >
                  {editingClinic ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClinics;