import { makeWPChatRequest } from '@Utils/apiHelper';
import { __ } from '@wordpress/i18n';
/**
 * License API service for handling license operations.
 * Provides methods to interact with the license management endpoints.
 */
class LicenseApi {
  constructor() {
    // No base URL needed since we use makeWPChatRequest
  }

  /**
   * Activate a license key.
   *
   * @param {string} licenseKey - The license key to activate.
   * @returns {Promise<Object>} The activation response.
   */
  async activateLicense(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
      throw new Error(__( 'License key is required and must be a string', 'smashballoon-wpchat-livechat-customer-support'));
    }

    const response = await makeWPChatRequest('license/activate', {
      method: 'POST',
      data: {
        license_key: licenseKey.trim(),
        nonce: window.wpApiSettings?.nonce || window.wpchatLicense?.nonce
      }
    });

    return this.handleResponse(response);
  }

  /**
   * Deactivate the current license.
   *
   * @param {string} [licenseKey] - Optional license key. Uses stored key if not provided.
   * @returns {Promise<Object>} The deactivation response.
   */
  async deactivateLicense(licenseKey = null) {
    const data = {
      nonce: window.wpApiSettings?.nonce || window.wpchatLicense?.nonce
    };

    if (licenseKey) {
      data.license_key = licenseKey.trim();
    }

    const response = await makeWPChatRequest('license/deactivate', {
      method: 'POST',
      data
    });

    return this.handleResponse(response);
  }

  /**
   * Check the current license status.
   *
   * @param {boolean} [forceRefresh=false] - Whether to force refresh from server.
   * @returns {Promise<Object>} The license status response.
   */
  async checkLicenseStatus(forceRefresh = false) {
    const params = new URLSearchParams({
      nonce: window.wpApiSettings?.nonce || window.wpchatLicense?.nonce
    });

    if (forceRefresh) {
      params.append('force_refresh', 'true');
    }

    const response = await makeWPChatRequest('license/status', {
      method: 'GET',
      params: Object.fromEntries(params)
    });

    return this.handleResponse(response);
  }

  /**
   * Clear the license cache.
   *
   * @returns {Promise<Object>} The clear cache response.
   */
  async clearLicenseCache() {
    const response = await makeWPChatRequest('license/clear-cache', {
      method: 'POST',
      data: {
        nonce: window.wpApiSettings?.nonce || window.wpchatLicense?.nonce
      }
    });

    return this.handleResponse(response);
  }

  /**
   * Get the manage license URL with the actual license key.
   * This is handled securely on the backend to avoid exposing the license key.
   *
   * @returns {Promise<Object>} The manage license URL response.
   */
  async getManageLicenseUrl() {
    const response = await makeWPChatRequest('license/manage-redirect', {
      method: 'POST',
      data: {
        nonce: window.wpApiSettings?.nonce || window.wpchatLicense?.nonce
      }
    });

    return this.handleResponse(response);
  }

  /**
   * Handle API response and normalize the data structure.
   *
   * @param {Object} response - The raw API response.
   * @returns {Object} Normalized response.
   */
  handleResponse(response) {
    // Ensure we have a consistent response structure
    const normalizedResponse = {
      success: response?.success || false,
      message: response?.message || '',
      data: response?.data || {},
      error_code: response?.error_code || null,
      url: response?.url || null,
      raw: response
    };

    // Add convenience properties
    if (normalizedResponse.data) {
      normalizedResponse.isActive = normalizedResponse.data.is_active || false;
      normalizedResponse.status = normalizedResponse.data.status || 'unknown';
      normalizedResponse.fromCache = normalizedResponse.data.from_cache || false;
    }

    return normalizedResponse;
  }

  /**
   * Validate a license key format (basic client-side validation).
   *
   * @param {string} licenseKey - The license key to validate.
   * @returns {Object} Validation result with isValid boolean and message.
   */
  validateLicenseKey(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return {
        isValid: false,
        message: __( 'License key is required', 'smashballoon-wpchat-livechat-customer-support')
      };
    }

    const trimmed = licenseKey.trim();

    if (trimmed.length < 10) {
      return {
        isValid: false,
        message: __( 'License key appears to be too short', 'smashballoon-wpchat-livechat-customer-support')
      };
    }

    if (trimmed.length > 100) {
      return {
        isValid: false,
        message: __( 'License key appears to be too long', 'smashballoon-wpchat-livechat-customer-support')
      };
    }

    // Check for basic alphanumeric format (adjust pattern as needed)
    const pattern = /^[a-zA-Z0-9\-_]{10,}$/;
    if (!pattern.test(trimmed)) {
      return {
        isValid: false,
        message: __( 'License key contains invalid characters', 'smashballoon-wpchat-livechat-customer-support')
      };
    }

    return {
      isValid: true,
      message: __( 'License key format is valid', 'smashballoon-wpchat-livechat-customer-support')
    };
  }

  /**
   * Get formatted error message based on error code.
   *
   * @param {string} errorCode - The error code from the API.
   * @param {string} defaultMessage - Default message if no specific message is found.
   * @returns {string} Formatted error message.
   */
  getErrorMessage(errorCode, defaultMessage = 'An error occurred') {
    const errorMessages = {
      'missing_license_key': __( 'License key is required', 'smashballoon-wpchat-livechat-customer-support' ),
      'invalid_license_key': __( 'The license key format is invalid', 'smashballoon-wpchat-livechat-customer-support'),
      'no_license_found': __( 'No license key found', 'smashballoon-wpchat-livechat-customer-support'),
      'activation_exception': __( 'License activation failed due to a server error', 'smashballoon-wpchat-livechat-customer-support'),
      'deactivation_exception': __( 'License deactivation failed due to a server error', 'smashballoon-wpchat-livechat-customer-support'),
      'status_check_exception': __( 'License status check failed due to a server error', 'smashballoon-wpchat-livechat-customer-support'),
      'api_error': __( 'Unable to connect to the licensing server', 'smashballoon-wpchat-livechat-customer-support'),
      'invalid_nonce': __( 'Security token is invalid. Please refresh the page and try again', 'smashballoon-wpchat-livechat-customer-support'),

      // EDD-specific error codes
      'invalid_item_id': __( 'This license key is not valid for this product', 'smashballoon-wpchat-livechat-customer-support'),
      'no_activations_left': __( 'This license key has reached its activation limit. Please deactivate it from another site or upgrade your license', 'smashballoon-wpchat-livechat-customer-support'),
      'expired': __( 'Your license key has expired. Please renew your license to continue receiving updates', 'smashballoon-wpchat-livechat-customer-support'),
      'revoked': __( 'This license key has been revoked and is no longer valid', 'smashballoon-wpchat-livechat-customer-support'),
      'missing': __( 'License key not found in our system', 'smashballoon-wpchat-livechat-customer-support'),
      'invalid': __( 'Invalid license key. Please check that you entered it correctly', 'smashballoon-wpchat-livechat-customer-support'),
      'inactive': __( 'License key is not active for this site', 'smashballoon-wpchat-livechat-customer-support'),
      'site_inactive': __( 'License key is not active for this site', 'smashballoon-wpchat-livechat-customer-support'),
      'key_mismatch': __( 'This license key does not match the installed product', 'smashballoon-wpchat-livechat-customer-support'),
      'item_name_mismatch': __( 'This license key is not valid for this product', 'smashballoon-wpchat-livechat-customer-support')
    };

    return errorMessages[errorCode] || defaultMessage;
  }

  /**
   * Get the license status badge configuration.
   *
   * @param {string} status - The license status.
   * @param {boolean} isActive - Whether the license is active.
   * @returns {Object} Badge configuration with type and text.
   */
  getStatusBadge(status, isActive = false) {
    if (isActive && ['valid', 'active'].includes(status)) {
      return {
        type: 'success',
        text: 'Active'
      };
    }

    switch (status) {
      case 'expired':
        return {
          type: 'warning',
          text: __( 'Expired', 'smashballoon-wpchat-livechat-customer-support')
        };
      case 'invalid':
      case 'inactive':
        return {
          type: 'danger',
          text: __( 'Invalid', 'smashballoon-wpchat-livechat-customer-support')
        };
      case 'no_license':
        return {
          type: 'default',
          text: __( 'Lite', 'smashballoon-wpchat-livechat-customer-support')
        };
      default:
        return {
          type: 'default',
          text: __( 'Unknown', 'smashballoon-wpchat-livechat-customer-support')
        };
    }
  }
}

// Create and export a singleton instance
const licenseApi = new LicenseApi();
export default licenseApi;
