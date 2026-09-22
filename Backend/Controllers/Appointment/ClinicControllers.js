const ClinicService = require("../../Services/Appointment/ClinicService");

// Create Clinic
const createClinic = async (req, res) => {
    try {
        const {
            clinicName,
            address,
            city,
            district,
            phone,
            email,
            clinicType,
            description,
            openDays,
            openTime,
            closeTime,
            availableVaccines
        } = req.body;

        
        if (!clinicName || !address || !city || !district || !phone || !email ||
            !clinicType || !openDays || !openTime || !closeTime) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        const result = await ClinicService.createClinic({
            clinicName,
            address,
            city,
            district,
            phone,
            email,
            clinicType,
            description,
            openDays,
            openTime,
            closeTime,
            availableVaccines: availableVaccines || []
        });

        res.status(201).json(result);

    } catch (error) {
        console.error("Create clinic error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error during clinic creation"
        });
    }
};

// Get All Clinics
const getAllClinics = async (req, res) => {
    try {
        const result = await ClinicService.getAllClinics();
        res.status(200).json(result);

    } catch (error) {
        console.error("Get clinics error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while fetching clinics"
        });
    }
};

// Get Clinic by ID
const getClinicById = async (req, res) => {
    try {
        const result = await ClinicService.getClinicById(req.params.id);
        res.status(200).json(result);

    } catch (error) {
        console.error("Get clinic error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while fetching clinic"
        });
    }
};

// Update Clinic
const updateClinic = async (req, res) => {
    try {
        const result = await ClinicService.updateClinic(req.params.id, req.body);
        res.status(200).json(result);

    } catch (error) {
        console.error("Update clinic error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while updating clinic"
        });
    }
};

// Delete Clinic
const deleteClinic = async (req, res) => {
    try {
        const result = await ClinicService.deleteClinic(req.params.id);
        res.status(200).json(result);

    } catch (error) {
        console.error("Delete clinic error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while deleting clinic"
        });
    }
};

module.exports = {
    createClinic,
    getAllClinics,
    getClinicById,
    updateClinic,
    deleteClinic
};