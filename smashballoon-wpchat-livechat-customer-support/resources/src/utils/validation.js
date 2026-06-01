/**
 * Generic validation utility that checks input against regex patterns
 * @param {string} value - Value to validate
 * @param {Array<RegExp>} patterns - Array of regex patterns (OR logic)
 * @param {Object} options - Optional validation options
 * @param {number} options.minLength - Minimum length requirement
 * @param {Function} options.customValidator - Custom validation function for additional checks
 * @returns {boolean} - Returns true if value passes validation
 */
const validateInput = (value, patterns, options = {}) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  // Check minimum length if specified
  if (options.minLength && trimmed.length < options.minLength) {
    return false;
  }

  // Test against regex patterns (OR logic)
  const matchesPattern = patterns.some((pattern) => pattern.test(trimmed));
  if (!matchesPattern) {
    return false;
  }

  // Run custom validator if provided
  if (options.customValidator) {
    return options.customValidator(trimmed);
  }

  return true;
};

/**
 * Email validation utility
 * @param {string} email - Email address to validate
 * @returns {boolean} - Returns true if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  // Basic email regex (covers most real-world cases)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateInput(email, [emailRegex]);
};

/**
 * Phone validation utility
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Returns true if phone has valid format
 */
export const isValidPhone = (phone) => {
  // Accepts +, digits, spaces, dashes, parentheses. Requires at least 10 digits.
  const phoneRegex = /^\+?[0-9\s\-().]{10,20}$/;
  return validateInput(phone, [phoneRegex], { minLength: 10 });
};

/**
 * Telegram validation utility
 * Accepts either username (starting with @ is optional) or phone number
 * @param {string} telegram - Telegram phone number or username to validate
 * @returns {boolean} - Returns true if telegram has valid format
 */
export const isValidTelegram = (telegram) => {
  if (!telegram || typeof telegram !== 'string') {
    return false;
  }

  // Strip @ prefix if present for username validation
  const normalizedValue = telegram.trim().replace(/^@/, '');

  const phoneRegex = /^\+?[0-9]{10,15}$/; // international format, '+' prefix optional to match backend
  const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/; // alphanumeric + underscores
  return validateInput(normalizedValue, [phoneRegex, usernameRegex], { minLength: 5 });
};

/**
 * Facebook Messenger validation utility
 * Accepts usernames or numeric IDs (no phone numbers)
 * @param {string} messenger - Messenger username or numeric ID
 * @returns {boolean} - Returns true if valid
 */
export const isValidMessenger = (messenger) => {
  if (!messenger || typeof messenger !== 'string') {
    return false;
  }

  // Strip @ prefix if present for username validation
  const normalizedValue = messenger.trim().replace(/^@/, '');

  const numericIdRegex = /^[0-9]{10,20}$/;

  // Username: 5–50 chars, no trailing dot, no consecutive dots
  const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{5,50}$/;

  return validateInput(normalizedValue, [numericIdRegex, usernameRegex], {
    minLength: 5,
    customValidator: (v) => !v.startsWith('.'),
  });
};

/**
 * Instagram validation utility
 * Accepts 1–30 char usernames with alphanumerics, underscore, periods
 * No leading/trailing dot, no consecutive dots
 * @param {string} instagram - Instagram username
 * @returns {boolean} - Returns true if valid
 */
export const isValidInstagram = (instagram) => {
  if (!instagram || typeof instagram !== 'string') {
    return false;
  }

  // Strip @ prefix if present for username validation
  const normalizedValue = instagram.trim().replace(/^@/, '');

  const instagramRegex = /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;

  return validateInput(normalizedValue, [instagramRegex], {
    customValidator: (v) => !v.startsWith('.'),
  });
};
