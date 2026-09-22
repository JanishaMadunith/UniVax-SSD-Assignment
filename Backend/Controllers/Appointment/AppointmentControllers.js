const AppointmentService = require("../../Services/Appointment/AppointmentService");
const ClinicService = require("../../Services/Appointment/ClinicService");
const { validateAppointmentSchedule } = require("../../Services/Appointment/AppointmentScheduleValidation");
const { sendAppointmentConfirmation } = require("../../Services/emailService");

// Create Appointment
const createAppointment = async (req, res, next) => {
    try {
        const {
            clinicId,
            fullName,
            email,
            phone,
            vaccineType,
            ageGroup,
            appointmentDate,
            appointmentTime
        } = req.body;

        // Validation – required fields
        if (!clinicId || !fullName || !email || !phone || !vaccineType || !ageGroup || !appointmentDate || !appointmentTime) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Schedule validation – verify date/time against clinic schedule
        const clinicResult = await ClinicService.getClinicById(clinicId);
        if (!clinicResult.success) {
            return res.status(404).json({ success: false, message: "Clinic not found" });
        }
        const scheduleCheck = validateAppointmentSchedule(
            { appointmentDate, appointmentTime },
            clinicResult.clinic
        );
        if (!scheduleCheck.valid) {
            return res.status(400).json({
                success: false,
                message: scheduleCheck.errors.join('. ')
            });
        }

        // Duplicate vaccine check – prevent booking same vaccine while active booking exists
        const existingAppointments = await AppointmentService.getAppointmentsByEmail(email);
        if (existingAppointments.data && existingAppointments.data.length > 0) {
            const duplicate = existingAppointments.data.find(apt => {
                const aptDate = new Date(apt.appointmentDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return apt.vaccineType === vaccineType && aptDate >= today;
            });
            if (duplicate) {
                const clinicName = duplicate.clinicId?.clinicName || 'another clinic';
                return res.status(400).json({
                    success: false,
                    message: `You already have an active appointment for ${vaccineType} at ${clinicName}. Please cancel it first or wait until it is completed.`
                });
            }
        }

        const result = await AppointmentService.createAppointment({
            clinicId,
            fullName,
            email,
            phone,
            vaccineType,
            ageGroup,
            appointmentDate,
            appointmentTime
        });

        // Send confirmation email to patient (non-blocking)
        const clinicName = clinicResult.clinic.clinicName || 'Clinic';
        sendAppointmentConfirmation(result.appointment, clinicName).catch(err =>
            console.error('Appointment email error:', err.message)
        );

        res.status(201).json(result);

    } catch (error) {
        console.error("Create appointment error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error during appointment creation"
        });
    }
};

// Get All Appointments
const getAllAppointments = async (req, res, next) => {
    try {
        const result = await AppointmentService.getAllAppointments();
        res.status(200).json(result);

    } catch (error) {
        console.error("Get appointments error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while fetching appointments"
        });
    }
};

// Get Appointment by ID
const getAppointmentById = async (req, res, next) => {
    try {
        const result = await AppointmentService.getAppointmentById(req.params.id);
        res.status(200).json(result);

    } catch (error) {
        console.error("Get appointment error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while fetching appointment"
        });
    }
};

// Update Appointment
const updateAppointment = async (req, res, next) => {
    try {
        const {
            clinicId,
            fullName,
            email,
            phone,
            vaccineType,
            ageGroup,
            appointmentDate,
            appointmentTime
        } = req.body;

        const result = await AppointmentService.updateAppointment(
            req.params.id,
            {
                clinicId,
                fullName,
                email,
                phone,
                vaccineType,
                ageGroup,
                appointmentDate,
                appointmentTime
            }
        );

        res.status(200).json(result);

    } catch (error) {
        console.error("Update appointment error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while updating appointment"
        });
    }
};

// Delete Appointment
const deleteAppointment = async (req, res, next) => {
    try {
        const result = await AppointmentService.deleteAppointment(req.params.id);
        res.status(200).json(result);

    } catch (error) {
        console.error("Delete appointment error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while deleting appointment"
        });
    }
};

// Get Appointments by User Email
const getAppointmentsByEmail = async (req, res, next) => {
    try {
        const { email } = req.params;
        
        console.log('Getting appointments for email:', email);
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const result = await AppointmentService.getAppointmentsByEmail(email);
        console.log('Service result:', result);
        res.status(200).json(result);

    } catch (error) {
        console.error("Get user appointments error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while fetching user appointments"
        });
    }
};

exports.createAppointment = createAppointment;
exports.getAllAppointments = getAllAppointments;
exports.getAppointmentById = getAppointmentById;
exports.updateAppointment = updateAppointment;
exports.deleteAppointment = deleteAppointment;
exports.getAppointmentsByEmail = getAppointmentsByEmail;

// Patch Appointment (partial update – currentDose, appointmentDate)
const patchAppointment = async (req, res, next) => {
    try {
        const result = await AppointmentService.patchAppointment(req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error("Patch appointment error:", error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Server error while patching appointment"
        });
    }
};

exports.patchAppointment = patchAppointment;
