<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Services\SettingsService;
use SmashBalloon\WPChat\Common\Services\PrivateSettingsService;
use SmashBalloon\WPChat\Common\Services\ApiService;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Exception;

/**
 * Class SettingsEndpoint
 * Defines REST API endpoints for managing plugin settings.
 */
class SettingsEndpoint extends RestEndpoint
{
	/**
	 * The namespace of this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'settings';

	/**
	 * The settings service.
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * The private settings service.
	 *
	 * @var PrivateSettingsService
	 */
	private $privateSettingsService;

	/**
	 * Constructor.
	 *
	 * @param SettingsService $settingsService The settings service.
	 * @param PrivateSettingsService $privateSettingsService The private settings service.
	 */
	public function __construct(SettingsService $settingsService, PrivateSettingsService $privateSettingsService)
	{
		$this->settingsService = $settingsService;
		$this->privateSettingsService = $privateSettingsService;
	}

	/**
	 * Register the routes for the settings endpoint.
	 */
	protected function registerRoutesInner()
	{
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE, // GET.
					'callback'            => array($this, 'getSettings'),
					'permission_callback' => array($this, 'checkPublicPermission'),
				),
				array(
					'methods'             => array(\WP_REST_Server::EDITABLE, \WP_REST_Server::CREATABLE), // PUT/POST.
					'callback'            => array($this, 'updateSettings'),
					'permission_callback' => array($this, 'checkPermission'),
					'args'                => $this->getUpdateSettingsArgs(), // Define arguments for update.
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/(?P<key>[a-zA-Z0-9_]+)', // Route with key parameter.
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE, // PUT/POST for single setting update.
					'callback'            => array($this, 'updateSingleSetting'),
					'permission_callback' => array($this, 'checkPermission'),
					'args'                => $this->getUpdateSingleSettingArgs(), // Define arguments for single update.
				),
				'args' => array(
					'key' => array(
						'validate_callback' => function ($param, $request, $key) {
							return is_string($param) && ! empty($param);
						},
					),
				),
			)
		);
	}

	/**
	 * Get all settings.
	 *
	 * @return WP_REST_Response
	 */
	public function getSettings()
	{
		$settings = $this->settingsService->getAllSettings();

		// Add a flag to indicate if an access token exists
		// We don't expose the actual token for security reasons
		$apiToken = $this->privateSettingsService->getSetting('api_token', '');
		$settings['hasAccessToken'] = !empty($apiToken);

		// Add token usage information for the UI
		$settings['tokenUsage'] = [
			'token_limit' => (int)$this->privateSettingsService->getSetting('token_limit', 0),
			'used_tokens' => (int)$this->privateSettingsService->getSetting('used_tokens', 0),
		];

		// Add newsletter status information
		$isSubscribed = (bool)$this->privateSettingsService->getSetting('newsletter_subscribed', false);
		$isWithin24Hours = $this->isNewsletterWithin24Hours();

		$settings['newsletterStatus'] = [
			'subscribed' => $isSubscribed,
			'subscription_date' => $this->privateSettingsService->getSetting('newsletter_subscription_date', ''),
			'email' => $this->privateSettingsService->getSetting('newsletter_email', ''),
			'isWithin24Hours' => $isWithin24Hours,
			'shouldShowVerificationState' => $isWithin24Hours,
		];

		return rest_ensure_response($settings);
	}

	/**
	 * Update settings.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function updateSettings(WP_REST_Request $request)
	{
		$settingsData = $request->get_json_params();

		if (! is_array($settingsData)) {
			return new WP_Error(
				'invalid_data',
				__('[WPC-VAL-002] Invalid settings data provided. Must be an associative array', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		$sanitizedSettings = $this->sanitizeSettingsFromRequest($settingsData);

		if ($this->settingsService->updateSettings($sanitizedSettings)) {
			return rest_ensure_response([
				'message' => __('Settings updated successfully', 'smashballoon-wpchat-livechat-customer-support'),
				'status'  => 200
			]);
		} else {
			return new WP_Error(
				'update_failed',
				__('[WPC-SET-001] Failed to update settings', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 500)
			);
		}
	}

	/**
	 * Update a single setting.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function updateSingleSetting(WP_REST_Request $request)
	{
		$key = $request->get_param('key');
		$value = $request->get_param('value'); // Adjust to get value from appropriate source.

		if (empty($key)) {
			return new WP_Error(
				'invalid_key',
				__('[WPC-VAL-001] Setting key is required', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		$sanitizedValue = $this->sanitizeSingleSettingValue($key, $value);

		if (false === $sanitizedValue) {
			return new WP_Error(
				'invalid_value',
				/* translators: %s: Setting key name */
				sprintf(__('[WPC-VAL-002] Invalid value for setting key: %s', 'smashballoon-wpchat-livechat-customer-support'), $key),
				array('status' => 400)
			);
		}

		if ($this->settingsService->updateSetting($key, $sanitizedValue)) {
			return rest_ensure_response([
				/* translators: %s: Setting key name */
				'message' => sprintf(__('Setting "%s" updated successfully', 'smashballoon-wpchat-livechat-customer-support'), $key),
				'status'  => 200
			]);
		} else {
			return new WP_Error(
				'update_failed',
				/* translators: %s: Setting key name */
				sprintf(__('[WPC-SET-001] Failed to update setting "%s"', 'smashballoon-wpchat-livechat-customer-support'), $key),
				array('status' => 500)
			);
		}
	}

	/**
	 * Define arguments for updating settings (for schema/validation).
	 *
	 * @return array
	 */
	public function getUpdateSettingsArgs()
	{
		return array(
			// Define arguments for the main settings update endpoint if needed for schema/validation.
			'preserveSettings' => array(
				'type'        => 'boolean',
				'description' => __('Preserve settings setting', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'onboardingStatus' => array(
				'type'        => 'boolean',
				'description' => __('Onboarding status setting', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'faqOnboardingStatus' => array(
				'type'        => 'boolean',
				'description' => __('FAQ onboarding status', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'proUpsellStatus' => array(
				'type'        => 'boolean',
				'description' => __('Pro upsell banner status', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'smartSearchEnabled' => array(
				'type'        => 'boolean',
				'description' => __('Smart search enabled status', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'agentSettings' => array(
				'type'        => 'object',
				'description' => __('Agent settings including timings and platforms', 'smashballoon-wpchat-livechat-customer-support'),
				'properties'  => array(
					'timings'   => array(
						'type'        => 'boolean',
						'description' => __('Agent timing settings', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'platforms' => array(
						'type'        => 'object',
						'description' => __('Agent platform settings', 'smashballoon-wpchat-livechat-customer-support'),
					),
				),
			),
			'visibilitySettings' => array(
				'type'        => 'object',
				'description' => __('Visibility settings', 'smashballoon-wpchat-livechat-customer-support'),
				'properties'  => array(
					'mode' => array(
						'type'        => 'string',
						'description' => __('Visibility mode (include/exclude)', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'include' => array(
						'type'        => 'object',
						'description' => __('Include settings', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'exclude' => array(
						'type'        => 'object',
						'description' => __('Exclude settings', 'smashballoon-wpchat-livechat-customer-support'),
					),
				),
			),
			'customizerSettings' => array(
			'type'        => 'object',
			'description' => __('Customizer settings', 'smashballoon-wpchat-livechat-customer-support'),
			'properties'  => array(
				'theme' => array(
					'type'        => 'string',
					'description' => __('Theme settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'headerHeading' => array(
					'type'        => 'string',
					'description' => __('Header heading settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'chatToggleIcon' => array(
					'type'        => 'string',
					'description' => __('Send message settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'sendMessageHeading' => array(
					'type'        => 'string',
					'description' => __('Send message heading settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'sendMessageSubHeading' => array(
					'type'        => 'string',
					'description' => __('Send message sub heading settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'faqHeading' => array(
					'type'        => 'string',
					'description' => __('FAQ Heading settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'chatbotAvatar' => array(
					'type'        => 'string',
					'description' => __('Chatbot Avatar settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'chatbotCustomAvatar' => array(
					'type'        => 'string',
					'description' => __('Chatbot Custom Avatar settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'chatbotName' => array(
					'type'        => 'string',
					'description' => __('Chatbot Name settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'chatbotCustomName' => array(
					'type'        => 'string',
					'description' => __('Chatbot Custom Name settings', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'brandColor' => array(
					'type'        => 'float',
					'description' => __('Brand color (Hue value)', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'reorderableKeys' => array(
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
					'description' => __('Keys of reorderable sections', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'visibleMap' => array(
					'type'        => 'object',
					'description' => __('Map of visible sections', 'smashballoon-wpchat-livechat-customer-support'),
				),
				'chatInputVariation' => array(
					'type'        => 'string',
					'description' => __('Chat input variation', 'smashballoon-wpchat-livechat-customer-support'),
				),
			),
		),
		);
	}

	/**
	 * Define arguments for updating a single setting (for schema/validation).
	 *
	 * @return array
	 */
	public function getUpdateSingleSettingArgs()
	{
		return array(
			'value' => array( // Expecting 'value' in the request parameters for single setting update.
				'required' => true,
				// 'validate_callback' => ... (you can add validation here if needed based on setting key).
			),
		);
	}

	/**
	 * Sanitize settings data received from REST API request.
	 *
	 * @param array $settingsData The settings data.
	 * @return array
	 */
	private function sanitizeSettingsFromRequest(array $settingsData): array
	{
		$sanitizedSettings = array();

		foreach ($settingsData as $key => $value) {
			if (is_array($value)) {
				// Check if this is a platform object with the new format: { enabled: boolean, value: string }
				if ($this->isPlatformObject($value)) {
					$sanitizedSettings[$key] = $this->sanitizePlatformObject($value);
				} else {
					$sanitizedSettings[$key] = $this->sanitizeSettingsFromRequest($value);
				}
			} else {
				$sanitizedValue = $this->sanitizeSingleSettingValue($key, $value);
				if (false !== $sanitizedValue) {
					$sanitizedSettings[$key] = $sanitizedValue;
				} else {
					$sanitizedSettings[$key] = $value;
				}
			}
		}

		return $sanitizedSettings;
	}

	/**
	 * Check if an array is a platform object in the new format.
	 *
	 * @param array $value The value to check.
	 * @return bool True if it's a platform object, false otherwise.
	 */
	private function isPlatformObject(array $value): bool
	{
		// Platform objects have 'enabled' and 'value' keys
		// Check for both required keys to identify platform objects
		return array_key_exists('enabled', $value) && array_key_exists('value', $value);
	}

	/**
	 * Sanitize a platform object with the new format: { enabled: boolean, value: string }
	 *
	 * @param array $platformObject The platform object to sanitize.
	 * @return array The sanitized platform object.
	 */
	private function sanitizePlatformObject(array $platformObject): array
	{
		return array(
			'enabled' => rest_sanitize_boolean($platformObject['enabled'] ?? false),
			'value'   => sanitize_text_field($platformObject['value'] ?? ''),
		);
	}

	/**
	 * Sanitize a single setting value based on its key.
	 *
	 * @param string $key The setting key.
	 * @param mixed  $value The value to sanitize.
	 * @return mixed|false
	 */
	private function sanitizeSingleSettingValue(string $key, $value)
	{
		$sanitizationMap = [
			// Top level settings
			'preserveSettings'     => 'rest_sanitize_boolean',
			'onboardingStatus'    => 'rest_sanitize_boolean',
			'faqOnboardingStatus' => 'rest_sanitize_boolean',
			'proUpsellStatus'     => 'rest_sanitize_boolean',
			'smartSearchEnabled'  => 'rest_sanitize_boolean',
			
			// Agent settings
			'timings'             => 'rest_sanitize_boolean',
			// Note: Platform keys (whatsapp, telegram, instagram, etc.) are objects
			// with format { enabled: boolean, value: string } and are handled separately
			// in sanitizeSettingsFromRequest() via isPlatformObject() check.
			
			// Visibility settings
			'mode'               => 'sanitize_text_field',
			'pages'             => 'rest_sanitize_array',
			'categories'        => 'rest_sanitize_array',
			'tags'              => 'rest_sanitize_array',
			'postTypes'         => 'rest_sanitize_array',
			
			// Customizer settings
			'theme'              => 'sanitize_text_field',
			'headerHeading'      => 'sanitize_text_field',
			'chatToggleIcon'     => 'sanitize_text_field',
			'sendMessageHeading' => 'sanitize_text_field',
			'sendMessageSubHeading' => 'sanitize_text_field',
			'faqHeading'         => 'sanitize_text_field',
			'chatbotAvatar'      => 'sanitize_text_field',
			'chatbotCustomAvatar' => 'sanitize_text_field',
			'chatbotName'        => 'sanitize_text_field',
			'chatbotCustomName'  => 'sanitize_text_field',
			'brandColor'         => 'floatval',
			'reorderableKeys'    => 'rest_sanitize_array',
			'visibleMap'         => 'rest_sanitize_object',
			'chatInputVariation' => 'sanitize_text_field',

		];

		if (isset($sanitizationMap[$key]) && is_callable($sanitizationMap[$key])) {
			return call_user_func($sanitizationMap[$key], $value);
		}

		return false; // Unknown or invalid key.
	}

	/**
	 * Check if newsletter subscription is within 24-hour verification window.
	 *
	 * @return bool True if subscribed and within 24 hours, false otherwise.
	 */
	private function isNewsletterWithin24Hours(): bool
	{
		$isSubscribed = (bool)$this->privateSettingsService->getSetting('newsletter_subscribed', false);
		$subscriptionDate = $this->privateSettingsService->getSetting('newsletter_subscription_date', '');

		if (!$isSubscribed || empty($subscriptionDate)) {
			return false;
		}

		try {
			$subscriptionTime = new \DateTime($subscriptionDate);
			$now = new \DateTime();
			$hoursDiff = ($now->getTimestamp() - $subscriptionTime->getTimestamp()) / 3600;

			return $hoursDiff < 24;
		} catch (\Exception $e) {
			return false;
		}
	}
}
