import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Edit } from 'lucide-react';
import { API_URL } from '../../../api';
import DoctorSidebar from '../doctor/DoctorSidebar';
//import TopNavbar from '../TopNavbar';   // Optional - remove if you prefer sidebar only

const DoctorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [recentlyUpdatedLogId, setRecentlyUpdatedLogId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/V1/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setLogs(payload);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleEdit = (log) => {
    setSelectedLog(log);
    setEditNotes(log.notes || '');
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/api/V1/logs/${selectedLog._id}`, 
        { notes: editNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedLogId = selectedLog._id;
      toast.success('Log updated successfully');
      setSelectedLog(null);
      await fetchLogs();
      setRecentlyUpdatedLogId(updatedLogId);
      setTimeout(() => {
        setRecentlyUpdatedLogId((currentId) => (currentId === updatedLogId ? null : currentId));
      }, 3500);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update log');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <DoctorSidebar />

      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="p-8 text-center">Loading logs...</div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Logs</h1>
            <p className="text-gray-600 mb-8">View and edit all immunization records</p>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">Patient</th>
                <th className="px-6 py-4 text-left">Vaccine</th>
                <th className="px-6 py-4 text-left">Brand</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Clinic</th>
                <th className="px-6 py-4 text-left">Notes</th>
                <th className="px-6 py-4 text-left">Updated</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr
                  key={log._id}
                  className={`hover:bg-gray-50 transition-colors duration-700 ${
                    recentlyUpdatedLogId === log._id ? 'bg-emerald-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">{log.userId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">{log.vaccineId?.name || 'Vaccine'}</td>
                  <td className="px-6 py-4">{log.brand}</td>
                  <td className="px-6 py-4">{new Date(log.dateAdministered).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{log.clinic}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{log.notes || 'No notes'}</td>
                  <td className="px-6 py-4">
                    {recentlyUpdatedLogId === log._id ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Updated just now
                      </span>
                    ) : (
                      log.updatedAt ? new Date(log.updatedAt).toLocaleString() : '-'
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button onClick={() => handleEdit(log)} className="text-blue-600 hover:text-blue-800">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full mx-4 p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Log</h2>
            <div className="space-y-2 mb-4 text-sm text-gray-700">
              <p><span className="font-semibold">Patient:</span> {selectedLog.userId?.name || 'Unknown'}</p>
              <p><span className="font-semibold">Vaccine:</span> {selectedLog.vaccineId?.name || 'Vaccine'}</p>
              <p><span className="font-semibold">Last Updated:</span> {selectedLog.updatedAt ? new Date(selectedLog.updatedAt).toLocaleString() : '-'}</p>
            </div>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows="5"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3"
              placeholder="Update notes..."
            />
            <div className="flex gap-3 mt-8">
              <button onClick={() => setSelectedLog(null)} className="flex-1 py-4 border rounded-2xl">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorLogs;