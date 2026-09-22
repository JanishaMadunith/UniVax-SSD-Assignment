const Appointment = require("../../Model/Appointment/AppointmentModel");

// Create Appointment Service
const createAppointment = async (appointmentData) => {
    try {
        const newAppointment = new Appointment(appointmentData);
        await newAppointment.save();
        return {
            success: true,
            message: "Appointment created successfully",
            appointment: newAppointment
        };
    } catch (error) {
        throw {
            status: 500,
            message: "Server error during appointment creation",
            error: error.message
        };
    }
};

// Get All Appointments Service
const getAllAppointments = async () => {
    try {
        const appointments = await Appointment.find().populate('clinicId', 'clinicName address city');

        if (!appointments || appointments.length === 0) {
            throw {
                status: 404,
                message: "No appointments found"
            };
        }

        return {
            success: true,
            count: appointments.length,
            appointments
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while fetching appointments",
            error: error.message
        };
    }
};

// Get Appointment by ID Service
const getAppointmentById = async (appointmentId) => {
    try {
        const appointment = await Appointment.findById(appointmentId).populate('clinicId', 'clinicName address city');

        if (!appointment) {
            throw {
                status: 404,
                message: "Appointment not found"
            };
        }

        return {
            success: true,
            appointment
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while fetching appointment",
            error: error.message
        };
    }
};

// Update Appointment Service
const updateAppointment = async (appointmentId, updateData) => {
    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedAppointment) {
            throw {
                status: 404,
                message: "Appointment not found"
            };
        }

        return {
            success: true,
            message: "Appointment updated successfully",
            appointment: updatedAppointment
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while updating appointment",
            error: error.message
        };
    }
};

// Delete Appointment Service
const deleteAppointment = async (appointmentId) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(appointmentId);

        if (!appointment) {
            throw {
                status: 404,
                message: "Appointment not found"
            };
        }

        return {
            success: true,
            message: "Appointment deleted successfully"
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw {
            status: 500,
            message: "Server error while deleting appointment",
            error: error.message
        };
    }
};

// Get Appointments by User Email Service
const getAppointmentsByEmail = async (email) => {
    try {
        console.log('Service: Looking for appointments with email:', email);
        const appointments = await Appointment.find({ email: email.toLowerCase() }).populate('clinicId', 'clinicName address city');
        
        console.log('Service: Found appointments count:', appointments.length);
        console.log('Service: Appointments data:', appointments);

        return {
            success: true,
            count: appointments.length,
            data: appointments
        };
    } catch (error) {
        console.error('Service error:', error);
        throw {
            status: 500,
            message: "Server error while fetching user appointments",
            error: error.message
        };
    }
};

exports.createAppointment = createAppointment;
exports.getAllAppointments = getAllAppointments;
exports.getAppointmentById = getAppointmentById;
exports.updateAppointment = updateAppointment;
exports.deleteAppointment = deleteAppointment;
exports.getAppointmentsByEmail = getAppointmentsByEmail;

// Patch Appointment Service (partial update)
const patchAppointment = async (appointmentId, patchData) => {
    try {
        const allowedFields = ['currentDose', 'appointmentDate', 'appointmentTime'];
        const update = {};
        for (const key of allowedFields) {
            if (patchData[key] !== undefined) {
                update[key] = patchData[key];
            }
        }

        const patched = await Appointment.findByIdAndUpdate(
            appointmentId,
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!patched) {
            throw { status: 404, message: "Appointment not found" };
        }

        return {
            success: true,
            message: "Appointment patched successfully",
            appointment: patched
        };
    } catch (error) {
        if (error.status) throw error;
        throw {
            status: 500,
            message: "Server error while patching appointment",
            error: error.message
        };
    }
};

exports.patchAppointment = patchAppointment;
