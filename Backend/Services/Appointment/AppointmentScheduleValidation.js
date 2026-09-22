/**
 * Appointment Schedule Validation Service
 *
 * Validates that an appointment's date and time comply with the
 * chosen clinic's open days and operating hours.
 */

const DAY_NAME_TO_NUMBER = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Return true if appointmentDate falls on one of the clinic's open days.
 * @param {Date|string} appointmentDate
 * @param {string[]} openDays - e.g. ["Monday", "Wednesday"]
 * @returns {boolean}
 */
const isValidOpenDay = (appointmentDate, openDays) => {
  const date = new Date(appointmentDate);
  const dayNumber = date.getDay();
  const openDayNumbers = openDays
    .map((d) => DAY_NAME_TO_NUMBER[d])
    .filter((n) => n !== undefined);
  return openDayNumbers.includes(dayNumber);
};

/**
 * Return true if appointmentTime is within [openTime, closeTime).
 * @param {string} appointmentTime - "HH:MM"
 * @param {string} openTime        - "HH:MM"
 * @param {string} closeTime       - "HH:MM"
 * @returns {boolean}
 */
const isValidOpenTime = (appointmentTime, openTime, closeTime) => {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const apt = toMinutes(appointmentTime);
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  return apt >= open && apt < close;
};

/**
 * Validate appointment date and time against the clinic's schedule.
 * Returns { valid: boolean, errors: string[] }.
 * @param {{ appointmentDate: string, appointmentTime: string }} appointmentData
 * @param {{ openDays: string[], openTime: string, closeTime: string }|null} clinic
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateAppointmentSchedule = (appointmentData, clinic) => {
  const errors = [];

  if (!clinic) {
    errors.push('Clinic not found');
    return { valid: false, errors };
  }

  const { appointmentDate, appointmentTime } = appointmentData;

  if (!isValidOpenDay(appointmentDate, clinic.openDays)) {
    const dayName = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
    });
    errors.push(
      `Clinic is not open on ${dayName}. Open days: ${clinic.openDays.join(', ')}`
    );
  }

  if (!isValidOpenTime(appointmentTime, clinic.openTime, clinic.closeTime)) {
    errors.push(
      `Appointment time must be between ${clinic.openTime} and ${clinic.closeTime}`
    );
  }

  return { valid: errors.length === 0, errors };
};

module.exports = {
  validateAppointmentSchedule,
  isValidOpenDay,
  isValidOpenTime,
};
