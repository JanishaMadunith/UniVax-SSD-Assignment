import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { vaccineAPI } from '../../../../api';

const VaccineForm = ({ vaccine = null, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    cvxCode: '',
    description: '',
    presentation: 'vial',
    volume: { value: 1, unit: 'mL' },
    storageRequirements: {
      minTemp: 2,
      maxTemp: 8,
      requiresRefrigeration: true,
    },
    totalDoses: 1,
    status: 'active',
    updateReason: 'Initial creation',
    approvedRegions: [],
    contraindications: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vaccine) {
      setFormData(vaccine);
    }
  }, [vaccine]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vaccine name is required';
    }
    if (!formData.genericName.trim()) {
      newErrors.genericName = 'Generic name is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    if (!formData.cvxCode || !/^\d+$/.test(formData.cvxCode)) {
      newErrors.cvxCode = 'CVX code must be numeric';
    }
    if (formData.totalDoses < 1) {
      newErrors.totalDoses = 'Total doses must be at least 1';
    }
    if (formData.volume.value < 0.1) {
      newErrors.volume = 'Volume must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      if (vaccine?._id) {
        await vaccineAPI.updateVaccine(vaccine._id, formData);
        toast.success('Vaccine updated successfully');
      } else {
        await vaccineAPI.createVaccine(formData);
        toast.success('Vaccine created successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save vaccine: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'requiresRefrigeration') {
        setFormData({
          ...formData,
          storageRequirements: {
            ...formData.storageRequirements,
            requiresRefrigeration: checked,
          },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value,
      },
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {vaccine ? 'Edit Vaccine' : 'Create New Vaccine'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vaccine Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vaccine Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled={!!vaccine}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., COVID-19 Vaccine"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generic Name *
                </label>
                <input
                  type="text"
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.genericName
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., mRNA COVID-19 Vaccine"
                />
                {errors.genericName && (
                  <p className="text-red-500 text-sm mt-1">{errors.genericName}</p>
                )}
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer *
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.manufacturer
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., Pfizer"
                />
                {errors.manufacturer && (
                  <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>
                )}
              </div>

              {/* CVX Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVX Code *
                </label>
                <input
                  type="text"
                  name="cvxCode"
                  value={formData.cvxCode}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.cvxCode
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., 208"
                />
                {errors.cvxCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvxCode}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add vaccine description..."
              />
            </div>
          </div>

          {/* Presentation & Storage */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Presentation & Storage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Presentation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presentation Type
                </label>
                <select
                  name="presentation"
                  value={formData.presentation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>vial</option>
                  <option>prefilled syringe</option>
                  <option>nasal spray</option>
                  <option>oral</option>
                </select>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.volume.value}
                    onChange={(e) =>
                      handleNestedChange('volume', 'value', parseFloat(e.target.value))
                    }
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.volume
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="1"
                  />
                  <select
                    value={formData.volume.unit}
                    onChange={(e) =>
                      handleNestedChange('volume', 'unit', e.target.value)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>mL</option>
                    <option>µL</option>
                  </select>
                </div>
                {errors.volume && (
                  <p className="text-red-500 text-sm mt-1">{errors.volume}</p>
                )}
              </div>

              {/* Total Doses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Doses *
                </label>
                <input
                  type="number"
                  name="totalDoses"
                  min="1"
                  value={formData.totalDoses}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.totalDoses
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.totalDoses && (
                  <p className="text-red-500 text-sm mt-1">{errors.totalDoses}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>active</option>
                  <option>discontinued</option>
                  <option>pending</option>
                  <option>archived</option>
                </select>
              </div>
            </div>

            {/* Storage Requirements */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  name="requiresRefrigeration"
                  checked={formData.storageRequirements.requiresRefrigeration}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Requires Refrigeration
                </span>
              </label>

              {formData.storageRequirements.requiresRefrigeration && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={formData.storageRequirements.minTemp}
                      onChange={(e) =>
                        handleNestedChange(
                          'storageRequirements',
                          'minTemp',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={formData.storageRequirements.maxTemp}
                      onChange={(e) =>
                        handleNestedChange(
                          'storageRequirements',
                          'maxTemp',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Additional Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Reason
              </label>
              <input
                type="text"
                name="updateReason"
                value={formData.updateReason}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Why was this vaccine updated?"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center gap-2 transition"
            >
              <Save size={18} />
              {loading ? 'Saving...' : vaccine ? 'Update Vaccine' : 'Create Vaccine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaccineForm;
