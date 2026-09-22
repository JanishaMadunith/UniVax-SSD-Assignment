import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminSidebar from './AdminSidebar';
import DoseForm from '../VaccineCatalogue/Doses/DoseForm';
import { doseAPI, vaccineAPI } from '../../../api';

const AdminDoses = () => {
  const [doses, setDoses] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDose, setSelectedDose] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState('');

  useEffect(() => {
    fetchVaccinesAndDoses();
  }, []);

  const fetchVaccinesAndDoses = async () => {
    try {
      setLoading(true);
      const vaccineResponse = await vaccineAPI.getAllVaccines();
      setVaccines(vaccineResponse.data || []);

      if (vaccineResponse.data && vaccineResponse.data.length > 0) {
        const firstVaccineId = vaccineResponse.data[0]._id;
        setSelectedVaccine(firstVaccineId);
        await fetchDosesForVaccine(firstVaccineId);
      }
    } catch (error) {
      toast.error('Failed to fetch vaccines');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDosesForVaccine = async (vaccineId) => {
    try {
      const response = await doseAPI.getVaccineDoses(vaccineId);
      setDoses(response.data || []);
    } catch (error) {
      console.error(error);
      setDoses([]);
    }
  };

  const handleVaccineChange = (vaccineId) => {
    setSelectedVaccine(vaccineId);
    fetchDosesForVaccine(vaccineId);
  };

  const handleAddDose = () => {
    if (!selectedVaccine) {
      toast.error('Please select a vaccine first');
      return;
    }
    setSelectedDose(null);
    setShowForm(true);
  };

  const handleEditDose = (dose) => {
    setSelectedDose(dose);
    setShowForm(true);
  };

  const handleDeleteDose = async (doseId) => {
    if (window.confirm('Are you sure you want to delete this dose?')) {
      try {
        await doseAPI.deleteDose(doseId);
        toast.success('Dose deleted successfully');
        await fetchDosesForVaccine(selectedVaccine);
      } catch (error) {
        toast.error('Failed to delete dose');
        console.error(error);
      }
    }
  };

  const handleCloseForm = async () => {
    setShowForm(false);
    setSelectedDose(null);
    await fetchDosesForVaccine(selectedVaccine);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <AdminSidebar />
        <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <DoseForm
            dose={selectedDose}
            vaccineId={selectedVaccine}
            onClose={handleCloseForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <AdminSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vaccine Doses</h1>
          <button
            onClick={handleAddDose}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Add Dose
          </button>
        </div>

        {/* Vaccine Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vaccine
          </label>
          <select
            value={selectedVaccine}
            onChange={(e) => handleVaccineChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a vaccine --</option>
            {vaccines.map((vaccine) => (
              <option key={vaccine._id} value={vaccine._id}>
                {vaccine.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading doses...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Dose Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Dose Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Age Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Interval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedVaccine && doses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No doses found for this vaccine
                    </td>
                  </tr>
                ) : !selectedVaccine ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Please select a vaccine first
                    </td>
                  </tr>
                ) : (
                  doses.map((dose) => (
                    <tr key={dose._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {dose.doseNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dose.doseName || `Dose ${dose.doseNumber}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dose.minAge.value} {dose.minAge.unit}
                        {dose.maxAge.value ? ` - ${dose.maxAge.value} ${dose.maxAge.unit}` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dose.intervalFromPrevious.minDays}
                        {dose.intervalFromPrevious.maxDays
                          ? ` - ${dose.intervalFromPrevious.maxDays}`
                          : ''}{' '}
                        days
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            dose.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : dose.status === 'superseded'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {dose.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEditDose(dose)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteDose(dose._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoses;
