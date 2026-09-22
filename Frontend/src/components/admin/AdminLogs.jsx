import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { immunizationLogAPI } from '../../../api';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const isAdmin = user?.role === 'Admin' || user?.role === 'Official';

  const normalizeLogs = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.logs)) return res.logs;
    return [];
  };

  const fetchLogs = useCallback(async () => {
    try {
      const response = await immunizationLogAPI.getAllLogs();
      setLogs(normalizeLogs(response));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load immunization logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDelete = async (logId) => {
    const confirmed = window.confirm('Delete this immunization log permanently?');
    if (!confirmed) return;

    try {
      setDeletingId(logId);
      await immunizationLogAPI.deleteLog(logId);
      setLogs((prev) => prev.filter((log) => log._id !== logId));
      toast.success('Immunization log deleted');
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <AdminSidebar />
        <div className="ml-64 p-8 text-gray-700">Loading logs...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <AdminSidebar />
        <div className="ml-64 p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600">Access denied</h1>
            <p className="mt-3 text-gray-700">Only Admin or Official accounts can delete immunization logs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <AdminSidebar />

      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Immunization Logs</h1>
        <p className="text-gray-600 mb-8">Admin-only delete control for log records</p>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">Patient</th>
                <th className="px-6 py-4 text-left">Vaccine</th>
                <th className="px-6 py-4 text-left">Dose</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Clinic</th>
                <th className="px-6 py-4 text-left">Notes</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{log.userId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">{log.vaccineId?.name || 'Unknown vaccine'}</td>
                  <td className="px-6 py-4">{log.doseNumber || '-'}</td>
                  <td className="px-6 py-4">{log.dateAdministered ? new Date(log.dateAdministered).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4">{log.clinic || '-'}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{log.notes || 'No notes'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(log._id)}
                      disabled={deletingId === log._id}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {deletingId === log._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="p-8 text-center text-gray-500">No immunization logs found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
