import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminSidebar from './AdminSidebar';
import VaccineForm from '../VaccineCatalogue/Vaccines/VaccineForm';
import { vaccineAPI } from '../../../api';

const AdminVaccines = () => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);

  useEffect(() => {
    fetchVaccines();
  }, []);

  const fetchVaccines = async () => {
    try {
      setLoading(true);
      const response = await vaccineAPI.getAllVaccines();
      setVaccines(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch vaccines');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaccine = () => {
    setSelectedVaccine(null);
    setShowForm(true);
  };

  const handleEditVaccine = (vaccine) => {
    setSelectedVaccine(vaccine);
    setShowForm(true);
  };

  const handleDeleteVaccine = async (vaccineId) => {
    if (window.confirm('Are you sure you want to delete this vaccine?')) {
      try {
        await vaccineAPI.deleteVaccine(vaccineId);
        toast.success('Vaccine deleted successfully');
        fetchVaccines();
      } catch (error) {
        toast.error('Failed to delete vaccine');
        console.error(error);
      }
    }
  };

  const handleCloseForm = async () => {
    setShowForm(false);
    setSelectedVaccine(null);
    await fetchVaccines();
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <AdminSidebar />
        <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <VaccineForm vaccine={selectedVaccine} onClose={handleCloseForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <AdminSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vaccines</h1>
          <button
            onClick={handleAddVaccine}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Add Vaccine
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading vaccines...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vaccine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Generic Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vaccines.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No vaccines found
                    </td>
                  </tr>
                ) : (
                  vaccines.map((vaccine) => (
                    <tr key={vaccine._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{vaccine.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vaccine.genericName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vaccine.manufacturer}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            vaccine.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : vaccine.status === 'discontinued'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {vaccine.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEditVaccine(vaccine)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteVaccine(vaccine._id)}
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

export default AdminVaccines;
