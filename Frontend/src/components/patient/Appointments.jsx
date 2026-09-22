import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, Clock, Syringe, AlertCircle, 
  CheckCircle, XCircle, MapPin, ChevronRight, History, 
  Calendar as CalendarIcon, Filter, ChevronDown, Building2, Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_URL } from '../../../api';
import TopNavbar from './TopNavbar';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  isDateAvailable,
  getNextAvailableDate,
  formatTimeTo12Hour,
  getDayAbbreviations,
} from '../../utils/clinicScheduleValidation';
import { validateAppointmentForm } from '../../utils/appointmentValidation';

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clinicId: passedClinicId, clinicName: passedClinicName } = location.state || {};

  // Guard: must arrive via clinic selection
  useEffect(() => {
    if (!passedClinicId) {
      navigate('/patient/clinics', { replace: true });
    }
  }, [passedClinicId, navigate]);

  // Get logged-in user email (you can get this from auth context/localStorage)
  const [userEmail, setUserEmail] = useState('');
  const [userAppointments, setUserAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');
  const [clinics, setClinics] = useState([]);

  const [formData, setFormData] = useState({
    clinicId: passedClinicId || '',
    fullName: '',
    email: '',
    phone: '',
    vaccineType: '',
    ageGroup: '',
    appointmentDate: '',
    appointmentTime: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive the selected clinic object from the pre-passed clinicId or form state
  const selectedClinic = clinics.find(
    (c) => c._id === (passedClinicId || formData.clinicId)
  ) || null;

  // Build schedule constraints from the selected clinic
  const openDays = selectedClinic?.openDays || [];
  const openTime = selectedClinic?.openTime || '';
  const closeTime = selectedClinic?.closeTime || '';

  // Fetch user email from localStorage/auth context on mount
  useEffect(() => {
    // Get user data from localStorage or your auth context
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const email = userData.email || '';
    const fullName = userData.fullName || userData.name || '';
    const token = localStorage.getItem('token');
    
    console.log('User data loaded:',  { email, fullName, token: !!token });
    
    setUserEmail(email);
    
    // Pre-fill form with user data
    setFormData(prev => ({
      ...prev,
      email: email,
      fullName: fullName
    }));
    
    if (email) {
      fetchUserAppointments(email);
    } else {
      console.warn('No email found in localStorage');
    }

    // Fetch clinics for dropdown
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/V1/clinics`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setClinics(data.clinics || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  // Fetch user's appointments
  const fetchUserAppointments = async (email) => {
    try {
      setLoadingAppointments(true);
      setAppointmentError('');
      console.log('Fetching appointments for email:', email);
      const token = localStorage.getItem('token');
      console.log('Token present:', !!token);
      
      const response = await fetch(`${API_URL}/api/V1/appointments/user/${email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      
      console.log('Appointments response:', data);
      
      if (data.success) {
        console.log('Setting appointments:', data.data);
        setUserAppointments(Array.isArray(data.data) ? data.data : []);
      } else {
        console.warn('API returned success: false', data.message);
        setAppointmentError(data.message || 'Failed to load appointments');
        setUserAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointmentError(`Error: ${error.message}`);
      setUserAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };


  // Filter appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingAppointments = userAppointments
    .filter(apt => {
      if (!apt.appointmentDate) return false;
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate >= today;
    })
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  
  const previousAppointments = userAppointments
    .filter(apt => {
      if (!apt.appointmentDate) return false;
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate < today;
    })
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

  // VALIDATION
  const validateForm = () => {
    const newErrors = validateAppointmentForm(formData, selectedClinic);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset vaccine and schedule fields when clinic changes
      ...(name === 'clinicId' ? { vaccineType: '', appointmentDate: '', appointmentTime: '' } : {})
    }));

    // Inline validation feedback for schedule-sensitive fields
    if (name === 'appointmentDate') {
      if (value && !isDateAvailable(value, openDays)) {
        const dayName = new Date(value + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        setErrors(prev => ({ ...prev, appointmentDate: `Clinic is closed on ${dayName}` }));
      } else {
        setErrors(prev => ({ ...prev, appointmentDate: '' }));
      }
      return;
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateAppointmentForm(formData, selectedClinic);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const fieldLabels = {
        clinicId: 'Vaccination Center',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone Number',
        vaccineType: 'Vaccine Type',
        ageGroup: 'Age Group',
        appointmentDate: 'Appointment Date',
        appointmentTime: 'Appointment Time',
      };
      const missingFields = Object.keys(newErrors)
        .map(k => fieldLabels[k] || k)
        .join(', ');
      toast.warning(`Please fix: ${missingFields}`);
      // Scroll to first error
      const firstErrorEl = document.querySelector('[data-error="true"]');
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/V1/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Appointment booked successfully!');
        setFormData({
          clinicId: '',
          fullName: '',
          email: '',
          phone: '',
          vaccineType: '',
          ageGroup: '',
          appointmentDate: '',
          appointmentTime: ''
        });
        // Refresh appointments
        fetchUserAppointments(userEmail);
      } else {
        toast.error(data.message || 'Failed to book appointment');
        setErrors({ submit: data.message });
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Book Appointment
            </h1>
            <p className="text-gray-600 mt-2">Schedule your vaccination and manage your appointments</p>
          </div>

          {/* No clinic selected warning */}
          {!passedClinicId && (
            <div className="mb-6 p-5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">No vaccination center selected</p>
                <p className="text-sm text-amber-700 mt-1">Please choose a clinic first, then click the <strong>Book</strong> button on that clinic's card.</p>
                <a
                  href="/patient/clinics"
                  className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition"
                >
                  Browse Clinics
                </a>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Form (2/3 width) */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <Syringe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Schedule Your Vaccination</h2>
                      <p className="text-blue-100 text-sm mt-1">Fill in the details below to book your appointment</p>
                    </div>
                  </div>
                </div>

                {/* Form Body */}
                <div className="p-8">
                  {errors.submit && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      {errors.submit}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Clinic Display - Read Only */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs font-medium text-blue-600 mb-1">Selected Vaccination Center</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {passedClinicName || (formData.clinicId ? clinics.find(c => c._id === formData.clinicId)?.clinicName : 'No clinic selected')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            readOnly
                            data-error={errors.fullName ? 'true' : undefined}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-100 cursor-not-allowed ${
                              errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            readOnly
                            data-error={errors.email ? 'true' : undefined}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-100 cursor-not-allowed ${
                              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="071 234 5678"
                            data-error={errors.phone ? 'true' : undefined}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                      </div>

                      {/* Vaccine Type */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Vaccine Type <span className="text-red-500">*</span>
                        </label>
                        {(() => {
                          const selectedClinic = clinics.find(c => c._id === formData.clinicId);
                          const clinicVaccines = (selectedClinic?.availableVaccines || []).filter(v => v.vaccineId && v.quantity > 0);
                          return (
                            <select
                              name="vaccineType"
                              value={formData.vaccineType}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                errors.vaccineType ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                              }`}
                            >
                              <option value="">Select Vaccine</option>
                              {clinicVaccines.length > 0
                                ? clinicVaccines.map(v => (
                                    <option key={v.vaccineId._id} value={v.vaccineId.name}>
                                      {v.vaccineId.name} (Available: {v.quantity})
                                    </option>
                                  ))
                                : (
                                  <>
                                    <option value="COVID-19">COVID-19</option>
                                    <option value="Influenza (Flu)">Influenza (Flu)</option>
                                    <option value="HPV">HPV</option>
                                    <option value="Hepatitis B">Hepatitis B</option>
                                    <option value="MMR">MMR</option>
                                  </>
                                )
                              }
                            </select>
                          );
                        })()}
                        {errors.vaccineType && <p className="text-xs text-red-500 mt-1">{errors.vaccineType}</p>}
                      </div>

                      {/* Age Group */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Age Group <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="ageGroup"
                          value={formData.ageGroup}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            errors.ageGroup ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                          }`}
                        >
                          <option value="">Select Age Group</option>
                          <option value="child">Child (0-12 years)</option>
                          <option value="adult">Adult (13-59 years)</option>
                          <option value="elder">Elder (60+ years)</option>
                        </select>
                        {errors.ageGroup && <p className="text-xs text-red-500 mt-1">{errors.ageGroup}</p>}
                      </div>

                      {/* Date */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Appointment Date <span className="text-red-500">*</span>
                        </label>
                        {openDays.length > 0 && (
                          <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Open: {getDayAbbreviations(openDays).join(' · ')}
                          </p>
                        )}
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            name="appointmentDate"
                            value={formData.appointmentDate}
                            onChange={handleChange}
                            min={openDays.length > 0 ? getNextAvailableDate(openDays) : new Date().toISOString().split('T')[0]}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.appointmentDate ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.appointmentDate
                          ? <p className="text-xs text-red-500 mt-1">{errors.appointmentDate}</p>
                          : formData.appointmentDate && openDays.length > 0 && isDateAvailable(formData.appointmentDate, openDays) && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Clinic is open on this day
                              </p>
                            )
                        }
                      </div>

                      {/* Time */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Appointment Time <span className="text-red-500">*</span>
                        </label>
                        {openTime && closeTime && (
                          <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Hours: {formatTimeTo12Hour(openTime)} – {formatTimeTo12Hour(closeTime)}
                          </p>
                        )}
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            name="appointmentTime"
                            value={formData.appointmentTime}
                            onChange={handleChange}
                            min={openTime || undefined}
                            max={closeTime || undefined}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.appointmentTime ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.appointmentTime && <p className="text-xs text-red-500 mt-1">{errors.appointmentTime}</p>}
                      </div>
                    </div>

                    {errors.clinicId && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-700 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {errors.clinicId}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !passedClinicId}
                      className={`w-full py-4 rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        isSubmitting || !passedClinicId
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:scale-[1.01]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Booking...
                        </>
                      ) : (
                        <>
                          <Syringe className="w-5 h-5" />
                          Book Appointment
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Appointments (1/3 width) */}
            <div className="lg:w-1/3 space-y-6">
              
              {/* Upcoming Appointments */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-white" />
                    <h3 className="text-white font-semibold text-lg">Upcoming Appointments</h3>
                  </div>
                </div>
                <div className="p-5 max-h-96 overflow-y-auto">
                  {loadingAppointments ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.map((apt) => (
                        <div key={apt._id} className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{apt.vaccineType}</h4>
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Upcoming</span>
                          </div>
                          {apt.clinicId && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {apt.clinicId.clinicName || 'N/A'}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {apt.appointmentTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No upcoming appointments</p>
                      <p className="text-xs text-gray-400 mt-1">Book your first appointment today!</p>
                      {appointmentError && (
                        <p className="text-xs text-red-500 mt-2">⚠️ Error: {appointmentError}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-semibold text-gray-700 mb-2">💡 Troubleshooting:</p>
                        <ul className="text-left space-y-1">
                          <li>• Make sure you're logged in with your account</li>
                          <li>• Fill the form above and click "Book Appointment"</li>
                          <li>• Appointments will appear in this section once created</li>
                          <li>• Click the Debug Info below to check your email</li>
                        </ul>
                      </div>
                      <details className="text-xs text-gray-600 mt-3 text-left bg-gray-50 p-3 rounded border border-gray-200">
                        <summary className="cursor-pointer font-semibold text-gray-700">📋 Debug Info</summary>
                        <div className="mt-2 space-y-1 font-mono text-xs">
                          <p>Email: <span className="text-blue-600">{userEmail || '❌ Not loaded'}</span></p>
                          <p>Appointments: <span className="text-blue-600">{userAppointments.length}</span></p>
                          <p>Loading: <span className="text-blue-600">{loadingAppointments ? '⏳ Yes' : '✓ No'}</span></p>
                          <p>Token: <span className="text-blue-600">{localStorage.getItem('token') ? '✓ Present' : '❌ Missing'}</span></p>
                          <p className="text-gray-500 mt-2">Check browser console (F12) for detailed logs</p>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Appointments */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-white" />
                    <h3 className="text-white font-semibold text-lg">Previous Appointments</h3>
                  </div>
                </div>
                <div className="p-5 max-h-96 overflow-y-auto">
                  {loadingAppointments ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-gray-500"></div>
                    </div>
                  ) : previousAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {previousAppointments.map((apt) => (
                        <div key={apt._id} className="border-l-4 border-gray-400 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{apt.vaccineType}</h4>
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          </div>
                          {apt.clinicId && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {apt.clinicId.clinicName || 'N/A'}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {apt.appointmentTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No previous appointments</p>
                      <p className="text-xs text-gray-400 mt-1">Your appointment history will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tip */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 rounded-full p-2 flex-shrink-0">
                    <Syringe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">Quick Tips</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      • Arrive 15 minutes before your appointment<br/>
                      • Bring your ID and previous vaccination records<br/>
                      • Wear comfortable clothing for easy access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Appointments;