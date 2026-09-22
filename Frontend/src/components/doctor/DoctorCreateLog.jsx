import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Save, Shield, Users, Search } from 'lucide-react';
import DoctorSidebar from './DoctorSidebar';
import { usePatient } from '../../contexts/PatientContext';
import { userAPI, vaccineAPI, immunizationLogAPI, appointmentAPI } from '../../../api';

const DoctorCreateLog = () => {
  const { selectedPatient, setSelectedPatient } = usePatient();
  const [patients, setPatients] = useState([]);
  const [allVaccines, setAllVaccines] = useState([]);
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [maxDoses, setMaxDoses] = useState(null);
  const [loading, setLoading] = useState(false);

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientDropdownRef = useRef(null);

  const [form, setForm] = useState({
    userId: '',
    vaccineId: '',
    dateAdministered: '',
    doseNumber: 1,
    clinic: '',
    brand: '',
    batchNumber: '',
    notes: '',
    // Read-only auto-filled fields
    city: '',
    district: '',
    province: '',
    nextDoseDate: ''
  });

  // Load patients and vaccines on mount
  useEffect(() => {
    fetchPatients();
    fetchAllVaccines();
  }, []);

  // Sync with dashboard patient selection
  useEffect(() => {
    if (selectedPatient?._id) {
      setForm(prev => ({ ...prev, userId: selectedPatient._id }));
      setPatientSearch(selectedPatient.name || '');
      autoFillPatientAddress(selectedPatient);
      fetchPatientAppointments(selectedPatient.email);
    }
  }, [selectedPatient]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await userAPI.getAllUsers();
      const users = Array.isArray(res.users) ? res.users : [];
      setPatients(users.filter(u => u.role === 'Patient'));
    } catch (err) {
      toast.error('Failed to load patients');
    }
  };

  const fetchAllVaccines = async () => {
    try {
      const res = await vaccineAPI.getAllVaccines();
      setAllVaccines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load vaccines');
    }
  };

  const autoFillPatientAddress = (patient) => {
    setForm(prev => ({
      ...prev,
      city: patient?.address?.city || '',
      district: patient?.address?.district || '',
      province: patient?.address?.province || ''
    }));
  };

  const fetchPatientAppointments = async (email) => {
    if (!email) {
      setPatientAppointments([]);
      setFilteredVaccines([]);
      return;
    }
    try {
      const res = await appointmentAPI.getByEmail(email);
      const apts = Array.isArray(res.data) ? res.data : [];
      setPatientAppointments(apts);

      // Filter vaccines to only those the patient has appointments for
      const vaccineNames = [...new Set(apts.map(a => a.vaccineType))];
      const matched = allVaccines.filter(v => vaccineNames.includes(v.name));
      setFilteredVaccines(matched);
    } catch (err) {
      setPatientAppointments([]);
      setFilteredVaccines([]);
    }
  };

  // --- Patient search handlers ---
  const handlePatientSearchChange = (e) => {
    setPatientSearch(e.target.value);
    setShowPatientDropdown(true);
    if (form.userId) {
      setForm(prev => ({ ...prev, userId: '', vaccineId: '', clinic: '', brand: '', city: '', district: '', province: '', nextDoseDate: '' }));
      setSelectedPatient(null);
      setSelectedVaccine(null);
      setMaxDoses(null);
      setPatientAppointments([]);
      setFilteredVaccines([]);
    }
  };

  const handlePatientSelectFromDropdown = (patient) => {
    setForm(prev => ({ ...prev, userId: patient._id, vaccineId: '', clinic: '', brand: '', nextDoseDate: '' }));
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
    setSelectedPatient(patient);
    setSelectedVaccine(null);
    setMaxDoses(null);
    autoFillPatientAddress(patient);
    fetchPatientAppointments(patient.email);
  };

  const searchedPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // --- Vaccine select handler ---
  const handleVaccineChange = (e) => {
    const vaccineId = e.target.value;
    const vaccine = allVaccines.find(v => v._id === vaccineId);
    setSelectedVaccine(vaccine || null);
    setMaxDoses(vaccine?.totalDoses || null);

    // Auto-fill manufacturer & clinic from matching appointment
    let clinic = '';
    if (vaccine && patientAppointments.length > 0) {
      const matchingApt = patientAppointments.find(a => a.vaccineType === vaccine.name);
      if (matchingApt?.clinicId?.clinicName) {
        clinic = matchingApt.clinicId.clinicName;
      }
    }

    setForm(prev => ({
      ...prev,
      vaccineId,
      brand: vaccine?.manufacturer || '',
      clinic,
      doseNumber: 1,
      nextDoseDate: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'doseNumber') {
      const num = parseInt(value, 10);
      if (maxDoses && num > maxDoses) return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.vaccineId) {
      toast.error('Please select a patient and vaccine');
      return;
    }

    try {
      setLoading(true);

      // 1. Create the immunization log
      await immunizationLogAPI.createLog({
        userId: form.userId,
        vaccineId: form.vaccineId,
        dateAdministered: form.dateAdministered,
        doseNumber: form.doseNumber,
        clinic: form.clinic,
        brand: form.brand,
        batchNumber: form.batchNumber,
        notes: form.notes
      });

      // 2. Find matching appointment and patch currentDose + next date
      const matchingApt = patientAppointments.find(
        a => a.vaccineType === selectedVaccine?.name
      );
      if (matchingApt) {
        const patchData = { currentDose: form.doseNumber };
        if (form.nextDoseDate) {
          patchData.appointmentDate = form.nextDoseDate;
        }
        await appointmentAPI.patchAppointment(matchingApt._id, patchData);
      }

      toast.success('Immunization log created successfully!');

      // Reset form
      setForm({
        userId: selectedPatient?._id || '',
        vaccineId: '',
        dateAdministered: '',
        doseNumber: 1,
        clinic: '',
        brand: '',
        batchNumber: '',
        notes: '',
        city: selectedPatient?.address?.city || '',
        district: selectedPatient?.address?.district || '',
        province: selectedPatient?.address?.province || '',
        nextDoseDate: ''
      });
      setSelectedVaccine(null);
      setMaxDoses(null);
    } catch (err) {
      toast.error(err.message || 'Failed to create log. Please check all fields.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isLastDose = maxDoses && parseInt(form.doseNumber, 10) >= maxDoses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <DoctorSidebar />

      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-teal-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Log</h1>
            <p className="text-gray-600">Record vaccination after administration</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Patient Search */}
            <div ref={patientDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Users size={18} /> Search Patient
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={handlePatientSearchChange}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="Type patient name to search..."
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {showPatientDropdown && patientSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {searchedPatients.length > 0 ? (
                    searchedPatients.map(patient => (
                      <button
                        key={patient._id}
                        type="button"
                        onClick={() => handlePatientSelectFromDropdown(patient)}
                        className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium text-gray-800">{patient.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({patient.phone || patient.email})</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">No patients found</div>
                  )}
                </div>
              )}
              {form.userId && (
                <p className="mt-2 text-sm text-cyan-700">Selected: {patientSearch}</p>
              )}
            </div>

            {/* Patient Address (auto-filled, read-only) */}
            {form.userId && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={form.city} readOnly className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input type="text" value={form.district} readOnly className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <input type="text" value={form.province} readOnly className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed" />
                </div>
              </div>
            )}

            {/* Vaccine & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine</label>
                <select
                  name="vaccineId"
                  value={form.vaccineId}
                  onChange={handleVaccineChange}
                  required
                  disabled={!form.userId}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!form.userId
                      ? '-- Select a patient first --'
                      : filteredVaccines.length === 0
                        ? '-- No vaccines from appointments --'
                        : '-- Select vaccine --'}
                  </option>
                  {filteredVaccines.map(v => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
                {form.userId && filteredVaccines.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">This patient has no vaccine appointments.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Administered</label>
                <input
                  type="date"
                  name="dateAdministered"
                  value={form.dateAdministered}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dose Number & Manufacturer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose Number {maxDoses && <span className="text-gray-400">(max {maxDoses})</span>}
                </label>
                <input
                  type="number"
                  name="doseNumber"
                  value={form.doseNumber}
                  onChange={handleChange}
                  min="1"
                  max={maxDoses || undefined}
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  readOnly
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Auto-filled from vaccine"
                />
              </div>
            </div>

            {/* Batch Number & Clinic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  name="batchNumber"
                  value={form.batchNumber}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  name="clinic"
                  value={form.clinic}
                  readOnly
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Auto-filled from appointment"
                />
              </div>
            </div>

            {/* Next Dose Date (only shown when not last dose) */}
            {selectedVaccine && !isLastDose && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Dose Date <span className="text-gray-400">(updates appointment date)</span>
                </label>
                <input
                  type="date"
                  name="nextDoseDate"
                  value={form.nextDoseDate}
                  onChange={handleChange}
                  min={form.dateAdministered || undefined}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            )}
            {isLastDose && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                This is the final dose for this vaccine. No further appointment update needed.
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Any side effects or observations..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 text-lg hover:shadow-lg transition-all"
            >
              <Save size={22} />
              {loading ? 'Saving...' : 'Save Log & Issue Digital Certificate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorCreateLog;