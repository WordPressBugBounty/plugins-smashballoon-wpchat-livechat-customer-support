/**
 * Retrieves a localized variable from either the backend (wpChatAdmin) or frontend (wpChatFrontend) context.
 *
 * @function
 * @param {string} variable - The name of the variable to retrieve.
 * @returns {any} The localized variable value, or an empty string if not found.
 */
export function getLocalizeVariables(variable) {
  if (!variable) return '';

  return window?.wpChatAdmin?.[variable] ?? window?.wpChatFrontend?.[variable] ?? '';
}
