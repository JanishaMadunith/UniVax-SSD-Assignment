/**
 * Appointment Validation Service
 * Validates appointment form data against clinic schedule rules.
 */

import { isDateAvailable, isTimeWithinHours } from './clinicScheduleValidation';

/**
 * Validate a phone number (Sri Lanka format or general 10-digit).
 * @param {string} phone
 * @returns {string|null} error message or null
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Phone number is required';
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!/^\d{10}$/.test(cleaned)) return 'Phone number must be 10 digits';
  return null;
};

/**
 * Validate that the appointment date falls on a clinic open day.
 * @param {string} dateStr   - YYYY-MM-DD
 * @param {string[]} openDays
 * @returns {string|null} error message or null
 */
export const validateAppointmentDate = (dateStr, openDays = []) => {
  if (!dateStr) return 'Appointment date is required';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const selected = new Date(y, mo - 1, d);
  if (selected < today) return 'Appointment date cannot be in the past';
  // Only check open days if the clinic has openDays configured
  if (openDays.length > 0 && !isDateAvailable(dateStr, openDays)) {
    const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    return `Clinic is closed on ${dayName}. Open days: ${openDays.join(', ')}`;
  }
  return null;
};

/**
 * Validate that the appointment time is within clinic operating hours.
 * @param {string} time
 * @param {string} openTime
 * @param {string} closeTime
 * @returns {string|null} error message or null
 */
export const validateAppointmentTime = (time, openTime, closeTime) => {
  if (!time) return 'Appointment time is required';
  if (openTime && closeTime && !isTimeWithinHours(time, openTime, closeTime)) {
    return `Time must be between ${openTime} and ${closeTime}`;
  }
  return null;
};

/**
 * Validate the full appointment form.
 * Returns an object with field names as keys and error strings as values.
 * An empty object means no errors.
 * @param {object} formData
 * @param {object|null} clinic  - the selected clinic document (with openDays, openTime, closeTime)
 * @returns {object} errors
 */
export const validateAppointmentForm = (formData, clinic) => {
  const errors = {};

  if (!formData.clinicId) {
    errors.clinicId = 'Please select a vaccination center from the Clinics page before booking';
  }

  if (!formData.fullName || formData.fullName.trim() === '') {
    errors.fullName = 'Full name is required';
  }
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email is required';
  }

  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;

  if (!formData.vaccineType) errors.vaccineType = 'Vaccine type is required';
  if (!formData.ageGroup) errors.ageGroup = 'Age group is required';

  const dateError = validateAppointmentDate(
    formData.appointmentDate,
    clinic?.openDays || []
  );
  if (dateError) errors.appointmentDate = dateError;

  const timeError = validateAppointmentTime(
    formData.appointmentTime,
    clinic?.openTime,
    clinic?.closeTime
  );
  if (timeError) errors.appointmentTime = timeError;

  return errors;
};
