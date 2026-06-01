/**
 * Newsletter utility functions
 */

/**
 * Check if user should see the verification state (uses backend-calculated flag)
 * @param {Object} newsletterStatus - Newsletter status object from settings
 * @param {boolean} newsletterStatus.shouldShowVerificationState - Backend-calculated flag
 * @returns {boolean} True if should show verification message, false otherwise
 */
export const shouldShowVerificationState = (newsletterStatus) => {
  return newsletterStatus?.shouldShowVerificationState || false;
};