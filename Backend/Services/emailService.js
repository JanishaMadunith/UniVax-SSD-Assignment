const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const getBrevoConfig = () => {
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
    const senderName = (process.env.BREVO_SENDER_NAME || 'UniVax Team').trim();

    const isValid = apiKey.length > 0
        && apiKey !== 'your_brevo_api_key_here'
        && !apiKey.toLowerCase().includes('replace_me')
        && senderEmail.length > 0;

    return { apiKey, senderEmail, senderName, isValid };
};

const sendEmail = async ({ to, subject, htmlContent }) => {
    const { apiKey, senderEmail, senderName, isValid } = getBrevoConfig();

    if (!isValid) {
        console.warn('Brevo email skipped: missing or placeholder API key / sender email');
        return false;
    }

    try {
        await axios.post(
            BREVO_API_URL,
            {
                sender: { name: senderName, email: senderEmail },
                to: [{ email: to }],
                subject,
                htmlContent,
            },
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`✓ Brevo email sent to ${to}`);
        return true;
    } catch (error) {
        const status = error?.response?.status;
        const details = error?.response?.data;
        if (status === 401) {
            console.error('Brevo email failed: Unauthorized (401). Check BREVO_API_KEY.');
        } else {
            console.error('Brevo email failed:', error.message);
        }
        if (details) console.error('Brevo response:', details);
        return false;
    }
};

// Email sent to patient after appointment is created
const sendAppointmentConfirmation = async (appointment, clinicName) => {
    const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return sendEmail({
        to: appointment.email,
        subject: `Appointment Confirmed - ${appointment.vaccineType}`,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Appointment Confirmation</h2>
                <p>Dear <strong>${appointment.fullName}</strong>,</p>
                <p>Your vaccination appointment has been successfully booked.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Vaccine</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${appointment.vaccineType}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${dateStr}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${appointment.appointmentTime}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Clinic</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${clinicName}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Age Group</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${appointment.ageGroup}</td></tr>
                </table>
                <p>Please arrive 10 minutes before your scheduled time.</p>
                <p style="color: #6b7280; font-size: 14px;">Thank you for using UniVax!</p>
            </div>
        `,
    });
};

// Email sent to patient after a vaccine (immunization log) is added
const sendVaccinationRecordNotification = async (log, patientEmail, patientName) => {
    const dateStr = new Date(log.dateAdministered).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return sendEmail({
        to: patientEmail,
        subject: `Vaccination Complete - ${log.brand}`,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Vaccination Confirmation</h2>
                <p>Dear ${patientName || 'Patient'},</p>
                <p>Your vaccination record has been successfully added to your UniVax profile.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Vaccine</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${log.brand}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Dose Number</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${log.doseNumber}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Date Administered</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${dateStr}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Clinic</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${log.clinic}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Batch Number</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${log.batchNumber}</td></tr>
                </table>
                ${log.nextDueDate ? `<p><strong>Next dose due:</strong> ${new Date(log.nextDueDate).toLocaleDateString()}</p>` : ''}
                <p>Please keep this record for your health records. You can view your complete vaccination history anytime in your UniVax profile.</p>
                <p style="color: #6b7280; font-size: 14px;">This is an automated notification from UniVax.</p>
            </div>
        `,
    });
};

// Email sent to doctor/creator after a new vaccine is added to the catalog
const sendNewVaccineNotification = async (vaccine, creatorEmail) => {
    return sendEmail({
        to: creatorEmail,
        subject: `New Vaccine Added - ${vaccine.name}`,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Vaccine Created</h2>
                <p>Dear Doctor,</p>
                <p>A new vaccine has been successfully added to the UniVax catalog.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.name}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Generic Name</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.genericName}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Manufacturer</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.manufacturer}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>CVX Code</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.cvxCode}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Presentation</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.presentation}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Total Doses</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.totalDoses}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${vaccine.status}</td></tr>
                </table>
                <p style="color: #6b7280; font-size: 14px;">This is an automated notification from UniVax.</p>
            </div>
        `,
    });
};

module.exports = {
    sendEmail,
    sendAppointmentConfirmation,
    sendVaccinationRecordNotification,
    sendNewVaccineNotification,
};
