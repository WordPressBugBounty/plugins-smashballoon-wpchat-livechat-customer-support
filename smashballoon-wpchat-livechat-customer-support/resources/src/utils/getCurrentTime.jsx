/**
 * Returns the current time in 12-hour format with AM/PM.
 *
 * @function
 * @returns {string} The formatted current time (e.g., "3:05pm").
 */
export const getCurrentTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Format minutes to always be two digits
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${formattedMinutes}${ampm}`;
};
