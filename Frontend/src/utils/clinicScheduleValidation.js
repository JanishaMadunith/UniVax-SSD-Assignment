/**
 * Clinic Schedule Service
 * Utilities for working with clinic open days and operating hours.
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

const DAY_SHORT = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

/**
 * Convert an array of day name strings to JS getDay() numbers.
 * @param {string[]} openDays - e.g. ["Monday", "Wednesday"]
 * @returns {number[]} - e.g. [1, 3]
 */
export const getOpenDayNumbers = (openDays = []) =>
  openDays
    .map((day) => DAY_NAME_TO_NUMBER[day])
    .filter((n) => n !== undefined);

/**
 * Check whether a date string (YYYY-MM-DD) falls on a clinic open day.
 * @param {string} dateStr
 * @param {string[]} openDays
 * @returns {boolean}
 */
export const isDateAvailable = (dateStr, openDays = []) => {
  if (!dateStr || openDays.length === 0) return false;
  // Use local midnight to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return getOpenDayNumbers(openDays).includes(date.getDay());
};

/**
 * Get the next available date (YYYY-MM-DD) starting from today that
 * falls on one of the clinic's open days.
 * @param {string[]} openDays
 * @returns {string} YYYY-MM-DD
 */
export const getNextAvailableDate = (openDays = []) => {
  if (!openDays.length) return new Date().toISOString().split('T')[0];
  const openDayNumbers = getOpenDayNumbers(openDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 365; i++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + i);
    if (openDayNumbers.includes(candidate.getDay())) {
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, '0');
      const d = String(candidate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return new Date().toISOString().split('T')[0];
};

/**
 * Generate a list of time slot strings between openTime and closeTime.
 * Slots are spaced intervalMinutes apart and do NOT include closeTime.
 * @param {string} openTime   - "HH:MM"
 * @param {string} closeTime  - "HH:MM"
 * @param {number} intervalMinutes - default 30
 * @returns {string[]} - ["08:00", "08:30", ...]
 */
export const generateTimeSlots = (openTime, closeTime, intervalMinutes = 30) => {
  if (!openTime || !closeTime) return [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const start = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  const slots = [];
  for (let t = start; t < end; t += intervalMinutes) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
};

/**
 * Format a 24-hour "HH:MM" time string to 12-hour format.
 * @param {string} time24
 * @returns {string} - e.g. "2:30 PM"
 */
export const formatTimeTo12Hour = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Get abbreviated day names from a list of full day names.
 * @param {string[]} openDays
 * @returns {string[]} - ["Mon", "Wed", ...]
 */
export const getDayAbbreviations = (openDays = []) =>
  openDays.map((d) => DAY_SHORT[d] || d);

/**
 * Check whether an appointment time string falls within clinic hours.
 * @param {string} time      - "HH:MM"
 * @param {string} openTime  - "HH:MM"
 * @param {string} closeTime - "HH:MM"
 * @returns {boolean}
 */
export const isTimeWithinHours = (time, openTime, closeTime) => {
  if (!time || !openTime || !closeTime) return false;
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const apt = toMinutes(time);
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  return apt >= open && apt < close;
};
