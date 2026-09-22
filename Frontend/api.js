// API Service for Vaccines and Doses
export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// Helper function for making API calls
const makeRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============== VACCINE API CALLS ==============

export const vaccineAPI = {
  // Get all vaccines
  getAllVaccines: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    try {
      return await makeRequest(`/api/V1/vaccines?${queryParams}`);
    } catch (error) {
      // If no vaccines found (404), return empty array instead of throwing
      if (error.message.includes('No vaccines found')) {
        return { success: true, count: 0, data: [] };
      }
      throw error;
    }
  },

  // Get single vaccine by ID
  getVaccineById: async (id) => {
    return makeRequest(`/api/V1/vaccines/${id}`);
  },

  // Create new vaccine
  createVaccine: async (vaccineData) => {
    return makeRequest('/api/V1/vaccines', {
      method: 'POST',
      body: JSON.stringify(vaccineData),
    });
  },

  // Update vaccine
  updateVaccine: async (id, vaccineData) => {
    return makeRequest(`/api/V1/vaccines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vaccineData),
    });
  },

  // Delete vaccine
  deleteVaccine: async (id, reason = '') => {
    return makeRequest(`/api/V1/vaccines/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },

  // Get vaccine history/versions
  getVaccineHistory: async (id) => {
    return makeRequest(`/api/V1/vaccines/${id}/history`);
  },
};

// ============== DOSE API CALLS ==============

export const doseAPI = {
  // Get all doses for a vaccine
  getVaccineDoses: async (vaccineId) => {
    try {
      return await makeRequest(`/api/V1/doses/vaccine/${vaccineId}`);
    } catch (error) {
      // If no doses found (404), return empty array instead of throwing
      if (error.message.includes('No doses found') || error.message.includes('not exist')) {
        return { success: true, count: 0, data: [] };
      }
      throw error;
    }
  },

  // Get single dose by ID
  getDoseById: async (id) => {
    return makeRequest(`/api/V1/doses/${id}`);
  },

  // Create new dose for a vaccine
  createDose: async (vaccineId, doseData) => {
    return makeRequest(`/api/V1/doses/vaccine/${vaccineId}`, {
      method: 'POST',
      body: JSON.stringify(doseData),
    });
  },

  // Update dose
  updateDose: async (id, doseData) => {
    return makeRequest(`/api/V1/doses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doseData),
    });
  },

  // Delete dose
  deleteDose: async (id) => {
    return makeRequest(`/api/V1/doses/${id}`, {
      method: 'DELETE',
    });
  },

  // Calculate next due date
  calculateDueDate: async (vaccineId, patientAgeMonths, lastDoseDate = null, doseNumber = 1) => {
    return makeRequest('/api/V1/doses/calculate', {
      method: 'POST',
      body: JSON.stringify({
        vaccineId,
        patientAgeMonths,
        lastDoseDate,
        doseNumber,
      }),
    });
  },
};

// ============== USER API CALLS ==============

export const userAPI = {
  // Update own profile (JWT-based, no ID in URL)
  updateOwnProfile: async (data) => {
    return makeRequest('/api/V1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Upload profile picture (multipart – cannot use makeRequest's JSON Content-Type)
  uploadProfilePic: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/V1/users/profile/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Upload failed');
    }
    return response.json();
  },

  // Get all users
  getAllUsers: async () => {
    try {
      return await makeRequest('/api/V1/users', {
        method: 'GET',
      });
    } catch (error) {
      if (error.message.includes('No users found')) {
        return { success: true, count: 0, users: [] };
      }
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    return makeRequest(`/api/V1/users/${id}`, {
      method: 'GET',
    });
  },

  // Update user
  updateUser: async (id, userData) => {
    return makeRequest(`/api/V1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  deleteUser: async (id) => {
    return makeRequest(`/api/V1/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Change user role
  changeUserRole: async (id, newRole) => {
    return makeRequest(`/api/V1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    });
  },

  // Suspend/Unsuspend user account
  updateAccountStatus: async (id, status) => {
    return makeRequest(`/api/V1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ accountStatus: status }),
    });
  },
};

// ============== IMMUNIZATION LOG API CALLS ==============

export const immunizationLogAPI = {
  // Create a new immunization log (assign vaccine to patient)
  createLog: async (logData) => {
    return makeRequest('/api/V1/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },

  // Get all immunization logs
  getAllLogs: async () => {
    try {
      return await makeRequest('/api/V1/logs', {
        method: 'GET',
      });
    } catch (error) {
      if (error.message.includes('No logs found')) {
        return { success: true, count: 0, data: [] };
      }
      throw error;
    }
  },

  // Get logs for a specific patient
  getPatientLogs: async (patientId) => {
    try {
      return await makeRequest(`/api/V1/logs?userId=${patientId}`, {
        method: 'GET',
      });
    } catch (error) {
      if (error.message.includes('No logs found')) {
        return { success: true, count: 0, data: [] };
      }
      throw error;
    }
  },

  // Get a specific immunization log
  getLogById: async (logId) => {
    return makeRequest(`/api/V1/logs/${logId}`, {
      method: 'GET',
    });
  },

  // Update an immunization log
  updateLog: async (logId, logData) => {
    return makeRequest(`/api/V1/logs/${logId}`, {
      method: 'PUT',
      body: JSON.stringify(logData),
    });
  },

  // Delete an immunization log
  deleteLog: async (logId) => {
    return makeRequest(`/api/V1/logs/${logId}`, {
      method: 'DELETE',
    });
  },
};

// ============== APPOINTMENT API CALLS ==============

export const appointmentAPI = {
  // Get all appointments (Admin)
  getAllAppointments: async () => {
    try {
      return await makeRequest('/api/V1/appointments', {
        method: 'GET',
      });
    } catch (error) {
      if (error.message.includes('No appointments found')) {
        return { success: true, count: 0, appointments: [] };
      }
      throw error;
    }
  },

  // Get appointments by user email
  getByEmail: async (email) => {
    try {
      return await makeRequest(`/api/V1/appointments/user/${email}`, {
        method: 'GET',
      });
    } catch (error) {
      if (error.message.includes('No appointments found')) {
        return { success: true, count: 0, data: [] };
      }
      throw error;
    }
  },

  // Patch appointment (partial update – currentDose, appointmentDate)
  patchAppointment: async (id, patchData) => {
    return makeRequest(`/api/V1/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patchData),
    });
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    return makeRequest(`/api/V1/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============== CLINIC API CALLS ==============

export const clinicAPI = {
  // Get all clinics
  getAllClinics: async () => {
    try {
      return await makeRequest('/api/V1/clinics', {
        method: 'GET',
      });
    } catch (error) {
      if (error.message.includes('No clinics found')) {
        return { success: true, count: 0, data: [] };
      }
      throw error;
    }
  },
};
