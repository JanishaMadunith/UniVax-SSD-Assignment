import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { API_URL } from '../../../api';
import DoctorSidebar from './DoctorSidebar';

const DoctorClinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login again');
        setClinics([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/V1/clinics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || 'Failed to fetch clinics');
        setClinics([]);
        return;
      }

      setClinics(Array.isArray(data.clinics) ? data.clinics : []);
    } catch (error) {
      toast.error('Failed to fetch clinics');
      console.error(error);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <DoctorSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinics</h1>          
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Clinic Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Loading clinics...
                  </td>
                </tr>
              ) : clinics.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No clinics found
                  </td>
                </tr>
              ) : (
                clinics.map((clinic) => (
                  <tr key={clinic._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{clinic.clinicName}</td>
                    <td className="px-6 py-4 text-gray-900">{clinic.address}, {clinic.city}</td>
                    <td className="px-6 py-4 text-gray-700">{clinic.phone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorClinics;
