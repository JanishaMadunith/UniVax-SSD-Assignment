import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { doseAPI, vaccineAPI } from '../../../../api';

const DoseForm = ({ dose = null, vaccineId = null, onClose }) => {
  const [formData, setFormData] = useState({
    doseNumber: 1,
    doseName: '',
    minAge: { value: 0, unit: 'months' },
    maxAge: { value: null, unit: 'months' },
    intervalFromPrevious: {
      minDays: 0,
      maxDays: null,
      exactDays: null,
    },
    allowableDelay: 0,
    priority: 'routine',
    status: 'active',
    validFrom: new Date().toISOString(),
    validUntil: null,
    notes: '',
    guidelines: [],
  });

  const [vaccines, setVaccines] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState(vaccineId || '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [newGuideline, setNewGuideline] = useState({ authority: '', reference: '', url: '' });

  useEffect(() => {
    fetchVaccines();
    if (dose) {
      // Normalize date fields if they come as Date objects from backend
      const normalizedDose = {
        ...dose,
        validFrom: typeof dose.validFrom === 'string' ? dose.validFrom : new Date(dose.validFrom).toISOString(),
        validUntil: dose.validUntil ? (typeof dose.validUntil === 'string' ? dose.validUntil : new Date(dose.validUntil).toISOString()) : null,
      };
      setFormData(normalizedDose);
      setSelectedVaccine(dose.vaccineId._id || dose.vaccineId);
    }
  }, [dose]);

  const fetchVaccines = async () => {
    try {
      const response = await vaccineAPI.getAllVaccines();
      setVaccines(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch vaccines');
      console.error(error);
    }
  };

  // Helper function to convert age to months for comparison
  const convertAgeToMonths = (value, unit) => {
    const conversions = {
      days: value / 30,
      weeks: (value * 7) / 30,
      months: value,
      years: value * 12
    };
    return conversions[unit] || value;
  };

  // Helper function to format ISO date to yyyy-MM-dd for input field
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert yyyy-MM-dd to ISO timestamp
  const formatDateForSubmit = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedVaccine) {
      newErrors.vaccine = 'Vaccine is required';
    }
    if (formData.doseNumber < 1) {
      newErrors.doseNumber = 'Dose number must be at least 1';
    }
    if (formData.minAge.value < 0) {
      newErrors.minAge = 'Minimum age cannot be negative';
    }
    // Only validate max age if it's provided
    if (formData.maxAge.value) {
      const minAgeInMonths = convertAgeToMonths(formData.minAge.value, formData.minAge.unit);
      const maxAgeInMonths = convertAgeToMonths(formData.maxAge.value, formData.maxAge.unit);
      if (maxAgeInMonths <= minAgeInMonths) {
        newErrors.maxAge = 'Maximum age must be greater than minimum age';
      }
    }
    if (formData.intervalFromPrevious.minDays < 0) {
      newErrors.minDays = 'Minimum days cannot be negative';
    }
    if (
      formData.intervalFromPrevious.maxDays &&
      formData.intervalFromPrevious.maxDays < formData.intervalFromPrevious.minDays
    ) {
      newErrors.maxDays = 'Maximum days must be greater than minimum days';
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

      const submitData = {
        ...formData,
        vaccineId: selectedVaccine,
      };

      if (dose?._id) {
        await doseAPI.updateDose(dose._id, submitData);
        toast.success('Dose updated successfully');
      } else {
        await doseAPI.createDose(selectedVaccine, submitData);
        toast.success('Dose created successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save dose: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === '' ? null : isNaN(value) ? value : Number(value),
    });
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value === '' ? null : isNaN(value) ? value : Number(value),
      },
    });
  };

  const addGuideline = () => {
    if (newGuideline.authority && newGuideline.reference) {
      setFormData({
        ...formData,
        guidelines: [...formData.guidelines, newGuideline],
      });
      setNewGuideline({ authority: '', reference: '', url: '' });
    }
  };

  const removeGuideline = (index) => {
    setFormData({
      ...formData,
      guidelines: formData.guidelines.filter((_, i) => i !== index),
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
            {dose ? 'Edit Dose' : 'Create New Dose'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vaccine Selection */}
          {!dose && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                Select Vaccine
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vaccine *
                </label>
                <select
                  value={selectedVaccine}
                  onChange={(e) => setSelectedVaccine(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.vaccine
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Select a vaccine --</option>
                  {vaccines.map((vaccine) => (
                    <option key={vaccine._id} value={vaccine._id}>
                      {vaccine.name}
                    </option>
                  ))}
                </select>
                {errors.vaccine && (
                  <p className="text-red-500 text-sm mt-1">{errors.vaccine}</p>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dose Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose Number *
                </label>
                <input
                  type="number"
                  name="doseNumber"
                  min="1"
                  value={formData.doseNumber}
                  onChange={handleInputChange}
                  disabled={!!dose}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.doseNumber
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  } ${dose ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.doseNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.doseNumber}</p>
                )}
              </div>

              {/* Dose Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose Name
                </label>
                <input
                  type="text"
                  name="doseName"
                  value={formData.doseName}
                  onChange={handleInputChange}
                  disabled={!!dose}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dose ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., Primary Dose 1"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>routine</option>
                  <option>catchup</option>
                  <option>special</option>
                </select>
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
                  <option>superseded</option>
                  <option>pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Age Requirements */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Age Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Min Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Age *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.minAge.value}
                    onChange={(e) => handleNestedChange('minAge', 'value', e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.minAge
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <select
                    value={formData.minAge.unit}
                    onChange={(e) => handleNestedChange('minAge', 'unit', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>days</option>
                    <option>weeks</option>
                    <option>months</option>
                    <option>years</option>
                  </select>
                </div>
                {errors.minAge && (
                  <p className="text-red-500 text-sm mt-1">{errors.minAge}</p>
                )}
              </div>

              {/* Max Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Age
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.maxAge.value || ''}
                    onChange={(e) => handleNestedChange('maxAge', 'value', e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.maxAge
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <select
                    value={formData.maxAge.unit}
                    onChange={(e) => handleNestedChange('maxAge', 'unit', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>days</option>
                    <option>weeks</option>
                    <option>months</option>
                    <option>years</option>
                  </select>
                </div>
                {errors.maxAge && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxAge}</p>
                )}
              </div>
            </div>
          </div>

          {/* Interval Requirements */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Interval from Previous Dose
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Min Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Days *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.intervalFromPrevious.minDays}
                  onChange={(e) =>
                    handleNestedChange('intervalFromPrevious', 'minDays', e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.minDays
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.minDays && (
                  <p className="text-red-500 text-sm mt-1">{errors.minDays}</p>
                )}
              </div>

              {/* Max Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Days (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.intervalFromPrevious.maxDays || ''}
                  onChange={(e) =>
                    handleNestedChange('intervalFromPrevious', 'maxDays', e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.maxDays
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.maxDays && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxDays}</p>
                )}
              </div>

              {/* Exact Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exact Days (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.intervalFromPrevious.exactDays || ''}
                  onChange={(e) =>
                    handleNestedChange('intervalFromPrevious', 'exactDays', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Allowable Delay */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowable Delay (days)
              </label>
              <input
                type="number"
                min="0"
                name="allowableDelay"
                value={formData.allowableDelay}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Grace period in days"
              />
            </div>
          </div>

          {/* Validity Dates */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Validity Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valid From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formatDateForInput(formData.validFrom)}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: formatDateForSubmit(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until (Optional)
                </label>
                <input
                  type="date"
                  value={formatDateForInput(formData.validUntil)}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: formatDateForSubmit(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Guidelines */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Guidelines
            </h2>

            {formData.guidelines.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.guidelines.map((guideline, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{guideline.authority}</p>
                      <p className="text-sm text-gray-600">{guideline.reference}</p>
                      {guideline.url && (
                        <a
                          href={guideline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          {guideline.url}
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGuideline(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Authority (e.g., WHO)"
                  value={newGuideline.authority}
                  onChange={(e) =>
                    setNewGuideline({ ...newGuideline, authority: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Reference"
                  value={newGuideline.reference}
                  onChange={(e) =>
                    setNewGuideline({ ...newGuideline, reference: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  placeholder="URL (optional)"
                  value={newGuideline.url}
                  onChange={(e) =>
                    setNewGuideline({ ...newGuideline, url: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={addGuideline}
                className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Guideline
              </button>
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
              {loading ? 'Saving...' : dose ? 'Update Dose' : 'Create Dose'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoseForm;
