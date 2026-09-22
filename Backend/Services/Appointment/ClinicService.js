const Clinic = require("../../Model/Appointment/ClinicModel");

// Create Clinic Service
const createClinic = async (clinicData) => {
    try {
        const newClinic = new Clinic(clinicData);
        await newClinic.save();
        return {
            success: true,
            message: "Clinic created successfully",
            clinic: newClinic
        };
    } catch (error) {
        throw {
            status: 500,
            message: "Server error during clinic creation",
            error: error.message
        };
    }
};

// Get All Clinics Service
const getAllClinics = async () => {
    try {
        const clinics = await Clinic.find().populate('availableVaccines.vaccineId', 'name genericName');

        return {
            success: true,
            count: clinics.length,
            clinics: clinics || []
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while fetching clinics",
            error: error.message
        };
    }
};

// Get Clinic by ID Service
const getClinicById = async (clinicId) => {
    try {
        const clinic = await Clinic.findById(clinicId).populate('availableVaccines.vaccineId', 'name genericName');

        if (!clinic) {
            throw {
                status: 404,
                message: "Clinic not found"
            };
        }

        return {
            success: true,
            clinic
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while fetching clinic",
            error: error.message
        };
    }
};

// Update Clinic Service
const updateClinic = async (clinicId, updateData) => {
    try {
        const updatedClinic = await Clinic.findByIdAndUpdate(
            clinicId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedClinic) {
            throw {
                status: 404,
                message: "Clinic not found"
            };
        }

        return {
            success: true,
            message: "Clinic updated successfully",
            clinic: updatedClinic
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while updating clinic",
            error: error.message
        };
    }
};

// Delete Clinic Service
const deleteClinic = async (clinicId) => {
    try {
        const clinic = await Clinic.findByIdAndDelete(clinicId);

        if (!clinic) {
            throw {
                status: 404,
                message: "Clinic not found"
            };
        }

        return {
            success: true,
            message: "Clinic deleted successfully"
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while deleting clinic",
            error: error.message
        };
    }
};

module.exports = {
    createClinic,
    getAllClinics,
    getClinicById,
    updateClinic,
    deleteClinic
};
