import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, Loader, Save, X } from 'lucide-react';
import DoctorSidebar from './DoctorSidebar';
import { userAPI } from '../../../api';

const DoctorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    province: '',
    licenseNumber: '',
    specialization: '',
    clinicName: '',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored) {
      setForm({
        name: stored.name || '',
        email: stored.email || '',
        phone: stored.phone || '',
        city: stored.address?.city || '',
        district: stored.address?.district || '',
        province: stored.address?.province || '',
        licenseNumber: stored.doctorCredentials?.licenseNumber || '',
        specialization: stored.doctorCredentials?.specialization || '',
        clinicName: stored.doctorCredentials?.clinicName || '',
      });
      setPreviewUrl(stored.profilePic || '');
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
    setSuccess('');
    setSaving(true);
    try {
      let picUrl = null;

      if (selectedFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('profilePic', selectedFile);
        const uploadRes = await userAPI.uploadProfilePic(fd);
        picUrl = uploadRes.profilePic;
        setUploading(false);
      }

      const payload = {
        name: form.name,
        phone: form.phone,
        address: { city: form.city, district: form.district, province: form.province },
        doctorCredentials: {
          licenseNumber: form.licenseNumber,
          specialization: form.specialization,
          clinicName: form.clinicName,
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
        doctorCredentials: { licenseNumber: form.licenseNumber, specialization: form.specialization, clinicName: form.clinicName },
        ...(picUrl && { profilePic: picUrl }),
      }));

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert to stored values
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored) {
      setForm({
        name: stored.name || '',
        email: stored.email || '',
        phone: stored.phone || '',
        city: stored.address?.city || '',
        district: stored.address?.district || '',
        province: stored.address?.province || '',
        licenseNumber: stored.doctorCredentials?.licenseNumber || '',
        specialization: stored.doctorCredentials?.specialization || '',
        clinicName: stored.doctorCredentials?.clinicName || '',
      });
      setPreviewUrl(stored.profilePic || '');
    }
    setSelectedFile(null);
    setError('');
    setIsEditing(false);
  };

  const isBusy = saving || uploading;

  const inputClass = (editing) =>
    `mt-1 block w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
      editing ? 'border-teal-300 bg-white' : 'border-gray-200 bg-gray-50 cursor-default'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <DoctorSidebar />
      <div className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-5">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isBusy}
                      className="flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50 transition disabled:opacity-60"
                    >
                      {isBusy ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isBusy}
                      className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition disabled:opacity-60"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsEditing(true); setSuccess(''); }}
                    className="bg-white text-teal-700 px-6 py-2 rounded-lg font-semibold hover:bg-teal-50 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {error && <p className="mb-4 text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">{error}</p>}
            {success && <p className="mb-4 text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-lg text-sm">{success}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Picture Column */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-36 h-36 rounded-full object-cover border-4 border-teal-400 shadow-lg"
                      onError={() => setPreviewUrl('')}
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center border-4 border-teal-400 shadow-lg">
                      <User className="w-16 h-16 text-teal-500" />
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-2 shadow-lg transition"
                      title="Change photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-lg">{form.name}</p>
                  <p className="text-teal-600 text-sm">{form.specialization || 'Doctor'}</p>
                  <p className="text-gray-500 text-sm">{form.email}</p>
                </div>
              </div>

              {/* Fields — 2-column grid */}
              <div className="md:col-span-2 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={form.email} disabled className={inputClass(false)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specialization</label>
                    <input type="text" name="specialization" value={form.specialization} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                    <input type="text" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clinic / Hospital</label>
                    <input type="text" name="clinicName" value={form.clinicName} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 border-t pt-4">Address</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input type="text" name="city" value={form.city} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">District</label>
                      <input type="text" name="district" value={form.district} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Province</label>
                      <input type="text" name="province" value={form.province} onChange={handleChange} disabled={!isEditing} className={inputClass(isEditing)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;

