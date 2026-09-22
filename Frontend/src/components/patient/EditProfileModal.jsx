import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, User, Loader } from 'lucide-react';
import { userAPI } from '../../../api';

const EditProfileModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    province: '',
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored) {
      setForm({
        name: stored.name || '',
        phone: stored.phone || '',
        city: stored.address?.city || '',
        district: stored.address?.district || '',
        province: stored.address?.province || '',
      });
      if (stored.profilePic) setPreviewUrl(stored.profilePic);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      let picUrl = null;

      // Upload image first if a new one was selected
      if (selectedFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('profilePic', selectedFile);
        const uploadRes = await userAPI.uploadProfilePic(fd);
        picUrl = uploadRes.profilePic;
        setUploading(false);
      }

      // Update profile text fields
      const payload = {
        name: form.name,
        phone: form.phone,
        address: {
          city: form.city,
          district: form.district,
          province: form.province,
        },
      };
      if (picUrl) payload.profilePic = picUrl;

      const res = await userAPI.updateOwnProfile(payload);

      // Persist to localStorage
      const stored = JSON.parse(localStorage.getItem('user')) || {};
      localStorage.setItem('user', JSON.stringify({
        ...stored,
        name: form.name,
        phone: form.phone,
        address: { city: form.city, district: form.district, province: form.province },
        ...(picUrl && { profilePic: picUrl }),
      }));

      onSaved && onSaved({ ...stored, ...payload, ...(picUrl && { profilePic: picUrl }) });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || uploading;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl leading-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-teal-400"
                  onError={() => setPreviewUrl(null)}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center border-4 border-teal-400">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-1.5 shadow-lg transition"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-gray-500 mt-2">Click the camera icon to change your photo</p>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text" name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text" name="city" value={form.city} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text" name="district" value={form.district} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input
                type="text" name="province" value={form.province} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={isBusy}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-2 rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isBusy && <Loader className="w-4 h-4 animate-spin" />}
              {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
