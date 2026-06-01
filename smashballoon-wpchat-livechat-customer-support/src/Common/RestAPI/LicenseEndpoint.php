<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;
use SmashBalloon\WPChat\Common\Helpers\UTMUrlGenerator;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Class LicenseEndpoint
 *
 * REST API endpoint for license management operations.
 * Provides secure endpoints for license activation, deactivation, and status checking.
 *
 * @package SmashBalloon\WPChat\Common\RestAPI
 */
class LicenseEndpoint extends RestEndpoint
{
	/**
	 * The license service instance.
	 *
	 * @var LicenseServiceInterface
	 */
	private LicenseServiceInterface $licenseService;

	/**
	 * Route base for the endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'license';

	/**
	 * Constructor.
	 *
	 * @param LicenseServiceInterface $licenseService The license service.
	 */
	public function __construct(LicenseServiceInterface $licenseService)
	{
		$this->licenseService = $licenseService;
	}

	/**
	 * @inheritDoc
	 */
	protected function registerRoutesInner()
	{
		// POST /wpchat/v1/license/activate
		register_rest_route($this->namespace, $this->restBase . '/activate', [
			'methods' => 'POST',
			'callback' => [$this, 'activateLicense'],
			'permission_callback' => [$this, 'checkPermission'],
			'args' => [
				'license_key' => [
					'required' => true,
					'type' => 'string',
					'description' => __('The license key to activate.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateLicenseKey'],
					'sanitize_callback' => 'sanitize_text_field'
				],
				'nonce' => [
					'required' => true,
					'type' => 'string',
					'description' => __('Security nonce.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateNonce'],
					'sanitize_callback' => 'sanitize_text_field'
				]
			]
		]);

		// POST /wpchat/v1/license/deactivate
		register_rest_route($this->namespace, $this->restBase . '/deactivate', [
			'methods' => 'POST',
			'callback' => [$this, 'deactivateLicense'],
			'permission_callback' => [$this, 'checkPermission'],
			'args' => [
				'license_key' => [
					'required' => false,
					'type' => 'string',
					'description' => __('The license key to deactivate. Uses stored key if not provided.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateOptionalLicenseKey'],
					'sanitize_callback' => 'sanitize_text_field'
				],
				'nonce' => [
					'required' => true,
					'type' => 'string',
					'description' => __('Security nonce.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateNonce'],
					'sanitize_callback' => 'sanitize_text_field'
				]
			]
		]);

		// GET /wpchat/v1/license/status
		register_rest_route($this->namespace, $this->restBase . '/status', [
			'methods' => 'GET',
			'callback' => [$this, 'getLicenseStatus'],
			'permission_callback' => [$this, 'checkPermission'],
			'args' => [
				'force_refresh' => [
					'required' => false,
					'type' => 'boolean',
					'default' => false,
					'description' => __('Force refresh from server, bypassing cache.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateBoolean']
				],
				'nonce' => [
					'required' => true,
					'type' => 'string',
					'description' => __('Security nonce.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateNonce'],
					'sanitize_callback' => 'sanitize_text_field'
				]
			]
		]);

		// POST /wpchat/v1/license/clear-cache
		register_rest_route($this->namespace, $this->restBase . '/clear-cache', [
			'methods' => 'POST',
			'callback' => [$this, 'clearLicenseCache'],
			'permission_callback' => [$this, 'checkPermission'],
			'args' => [
				'nonce' => [
					'required' => true,
					'type' => 'string',
					'description' => __('Security nonce.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateNonce'],
					'sanitize_callback' => 'sanitize_text_field'
				]
			]
		]);

		// POST /wpchat/v1/license/manage-redirect
		register_rest_route($this->namespace, $this->restBase . '/manage-redirect', [
			'methods' => 'POST',
			'callback' => [$this, 'getManageLicenseUrl'],
			'permission_callback' => [$this, 'checkPermission'],
			'args' => [
				'nonce' => [
					'required' => true,
					'type' => 'string',
					'description' => __('Security nonce.', 'smashballoon-wpchat-livechat-customer-support'),
					'validate_callback' => [$this, 'validateNonce'],
					'sanitize_callback' => 'sanitize_text_field'
				]
			]
		]);
	}

	/**
	 * Activate a license key.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function activateLicense(WP_REST_Request $request)
	{
		$license_key = $request->get_param('license_key');
		$site_url = $this->getSiteUrl();

		$result = $this->licenseService->activateLicense($license_key, $site_url);

		return new WP_REST_Response([
			'success' => $result['success'],
			'message' => $result['message'],
			'data' => array_merge($result['license_data'] ?? [], [
				'is_active' => $result['success'] ? $this->licenseService->isLicenseActive() : false
			]),
			'error_code' => $result['error_code'] ?? null
		], $result['success'] ? 200 : 400);
	}

	/**
	 * Deactivate a license key.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function deactivateLicense(WP_REST_Request $request)
	{
		$license_key = $request->get_param('license_key');

		// If no license key provided, try to use the stored one
		if (empty($license_key)) {
			$license_key = $this->licenseService->getStoredLicenseKey();
			if (!$license_key) {
				return new WP_REST_Response([
					'success' => false,
					'message' => __('No license key found to deactivate.', 'smashballoon-wpchat-livechat-customer-support'),
					'error_code' => 'no_license_found'
				], 400);
			}
		}

		$site_url = $this->getSiteUrl();
		$result = $this->licenseService->deactivateLicense($license_key, $site_url);

		return new WP_REST_Response([
			'success' => $result['success'],
			'message' => $result['message'],
			'error_code' => $result['error_code'] ?? null
		], $result['success'] ? 200 : 400);
	}

	/**
	 * Get license status.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getLicenseStatus(WP_REST_Request $request)
	{
		$force_refresh = $request->get_param('force_refresh');
		$license_key = $this->licenseService->getStoredLicenseKey();

		if (!$license_key) {
			return new WP_REST_Response([
				'success' => false,
				'message' => __('No license key found.', 'smashballoon-wpchat-livechat-customer-support'),
				'data' => [
					'status' => 'no_license',
					'is_active' => false
				],
				'error_code' => 'no_license_found'
			], 200); // Return 200 for no license as it's a valid state
		}

		$site_url = $this->getSiteUrl();
		$result = $this->licenseService->checkLicenseStatus($license_key, $site_url, $force_refresh);

		return new WP_REST_Response([
			'success' => $result['success'],
			'message' => $result['message'],
			'data' => array_merge($result['license_data'] ?? [], [
				'is_active' => $this->licenseService->isLicenseActive(),
				'from_cache' => $result['from_cache'] ?? false,
				'license_key' => $this->licenseService->maskLicenseKey($license_key) // Mask the license key for security
			]),
			'error_code' => $result['error_code'] ?? null
		], 200);
	}

	/**
	 * Clear license cache.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response.
	 */
	public function clearLicenseCache(WP_REST_Request $request)
	{
		$cleared = $this->licenseService->clearLicenseCache();

		return new WP_REST_Response([
			'success' => $cleared,
			'message' => $cleared
				? __('License cache cleared successfully.', 'smashballoon-wpchat-livechat-customer-support')
				: __('Failed to clear license cache.', 'smashballoon-wpchat-livechat-customer-support')
		], 200);
	}

	/**
	 * Validate license key parameter.
	 *
	 * @param string          $value The license key value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validateLicenseKey($value, $request, $param)
	{
		if (empty($value) || !is_string($value)) {
			return new WP_Error(
				'invalid_license_key',
				__('License key must be a non-empty string.', 'smashballoon-wpchat-livechat-customer-support')
			);
		}

		$value = trim($value);
		if (strlen($value) < 10) {
			return new WP_Error(
				'invalid_license_key',
				__('License key appears to be too short.', 'smashballoon-wpchat-livechat-customer-support')
			);
		}

		return true;
	}

	/**
	 * Validate optional license key parameter.
	 *
	 * @param string          $value The license key value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validateOptionalLicenseKey($value, $request, $param)
	{
		if (empty($value)) {
			return true; // Optional parameter
		}

		return $this->validateLicenseKey($value, $request, $param);
	}

	/**
	 * Validate boolean parameter.
	 *
	 * @param mixed           $value The value to validate.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param The parameter name.
	 * @return bool True if valid.
	 */
	public function validateBoolean($value, $request, $param)
	{
		return is_bool($value) || in_array($value, ['true', 'false', '1', '0', 1, 0], true);
	}

	/**
	 * Validate nonce parameter.
	 *
	 * @param string          $value The nonce value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validateNonce($value, $request, $param)
	{
		if (empty($value)) {
			return new WP_Error(
				'missing_nonce',
				__('Security nonce is required.', 'smashballoon-wpchat-livechat-customer-support')
			);
		}

		// Verify nonce - use wp_rest
		if (!wp_verify_nonce($value, 'wp_rest')) {
			return new WP_Error(
				'invalid_nonce',
				__('Invalid security nonce. Please refresh the page and try again.', 'smashballoon-wpchat-livechat-customer-support')
			);
		}

		return true;
	}

	/**
	 * Get the current site URL for license validation.
	 *
	 * @return string The site URL.
	 */
	private function getSiteUrl(): string
	{
		return untrailingslashit(home_url());
	}

	/**
	 * Get the manage license URL with the actual license key.
	 * This method securely handles the license key without exposing it to the frontend.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response with the manage license URL.
	 */
	public function getManageLicenseUrl(WP_REST_Request $request)
	{
		$license_key = $this->licenseService->getStoredLicenseKey();

		if (!$license_key) {
			return new WP_REST_Response([
				'success' => false,
				'message' => __('No license key found. Please activate your license first.', 'smashballoon-wpchat-livechat-customer-support'),
			], 404);
		}

		// Get the manage license URL using UTMUrlGenerator for consistent URL generation
		$manage_license_url = UTMUrlGenerator::generateUrl('/account/billing', ['utm_campaign' => 'license-management']);

		// Append the license key parameter securely
		$separator = strpos($manage_license_url, '?') !== false ? '&' : '?';
		$full_url = $manage_license_url . $separator . 'manage_license=true&license=' . urlencode($license_key);

		return new WP_REST_Response([
			'success' => true,
			'url' => $full_url,
			'message' => __('Manage license URL generated successfully.', 'smashballoon-wpchat-livechat-customer-support'),
		], 200);
	}

	/**
	 * Permission check for license operations.
	 * All license operations require admin capabilities.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool True if user has permission.
	 */
	public function checkPermission($request = null)
	{
		// All license operations require admin capabilities
		return current_user_can('manage_options') || current_user_can('wpchat_admin');
	}
}
