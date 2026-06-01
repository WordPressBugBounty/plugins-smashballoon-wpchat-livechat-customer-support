/**
 * Converts a time string in 24-hour format (e.g. "14:30") to 12-hour format with AM/PM.
 *
 * @function
 * @param {string} time - The time string in 24-hour format ("HH:mm").
 * @returns {string} The formatted time string in 12-hour format with AM/PM (e.g. "2:30 PM").
 *
 * @example
 * to12HourTime("14:30"); // "2:30 PM"
 * to12HourTime("09:00"); // "9:00 AM"
 */
export const to12HourTime = (time) => {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || '0', 10);

  const period = hour < 12 || hour === 24 ? 'AM' : 'PM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
};
