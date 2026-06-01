<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\VisibilityServiceInterface;
use SmashBalloon\WPChat\Common\Services\SupportService;
use SmashBalloon\WPChat\Common\Helpers\Utility;
use SmashBalloon\WPChat\Common\Helpers\UTMUrlGenerator;

/**
 * Class AssetsManagerService
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class AssetsManagerService implements ServiceProviderInterface
{
	/**
	 * The visibility service instance.
	 *
	 * @var VisibilityServiceInterface $visibilityService The visibility service instance.
	 */
	private VisibilityServiceInterface $visibilityService;

	/**
	 * The support service instance.
	 *
	 * @var SupportService $supportService The visibility service instance.
	 */
	private $supportService;

	/**
	 * The utility instance.
	 *
	 * @var Utility $utility The utility instance.
	 */
	private $utility;

	/**
	 * Service for retrieving settings.
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * Service for retrieving entitlement data.
	 *
	 * @var EntitlementDataService
	 */
	private $entitlementDataService;

	/**
	 * Private settings service.
	 *
	 * @var PrivateSettingsService
	 */
	private $privateSettingsService;

	/**
	 * AssestManagerService constructor.
	 *
	 * @param VisibilityServiceInterface $visibilityService The visibility service instance.
	 * @param SupportService             $supportService    The support service instance.
	 * @param Utility                    $utility           The utility instance.
	 * @param SettingsService            $settingsService   The settings service instance.
	 * @param EntitlementDataService     $entitlementDataService The entitlement data service instance.
	 * @param PrivateSettingsService     $privateSettingsService The private settings service instance.
	 */
	public function __construct(VisibilityServiceInterface $visibilityService, SupportService $supportService, Utility $utility, SettingsService $settingsService, EntitlementDataService $entitlementDataService, PrivateSettingsService $privateSettingsService)
	{
		$this->visibilityService = $visibilityService;
		$this->supportService = $supportService;
		$this->utility = $utility;
		$this->settingsService = $settingsService;
		$this->entitlementDataService = $entitlementDataService;
		$this->privateSettingsService = $privateSettingsService;
	}


	/**
	 * Get the hashed entry file path for a given entry name.
	 *
	 * @param string $entryName The entry name (e.g., 'admin', 'frontend').
	 * @return string|false The file URL or false if not found.
	 */
	private function getHashedEntryFile(string $entryName)
	{
		$jsDir = WPCHAT_PLUGIN_DIR . 'public/js/';
		$pattern = $jsDir . 'wp-chat-' . $entryName . '-*.js';
		$files = glob($pattern);

		if (empty($files)) {
			return false;
		}

		// Get the most recently modified file (in case multiple exist during deployment)
		usort($files, function ($a, $b) {
			return filemtime($b) - filemtime($a);
		});

		$filename = basename($files[0]);
		return WPCHAT_PLUGIN_URL . 'public/js/' . $filename;
	}

	/**
	 * Registers the service provider.
	 *
	 * This method is called to register the service provider with WordPress.
	 * It sets up hooks and filters for enqueuing scripts and styles.
	 *
	 * @return void
	 */
	public function register(): void
	{
		add_filter('script_loader_tag', [$this, 'filterScriptLoaderTag'], 10, 3);
		add_action('init', [$this, 'registerStyles']);
		add_action('init', [$this, 'maybeStartSession'], 1);
		add_action('admin_enqueue_scripts', [$this, 'enqueueAdminScripts']);
		add_action('admin_enqueue_scripts', [$this, 'enqueueAdminStyles']);
		add_action('admin_enqueue_scripts', [$this, 'addInlineTranslations'], 20);
		add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendScripts']);
		add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendStyles']);
		add_action('wp_enqueue_scripts', [$this, 'addInlineTranslations'], 20);
		add_filter('admin_body_class', [$this, 'addAdminBodyClass']);
	}

	/**
	 * Start PHP session early if needed for frontend.
	 *
	 * Must be called early (on init with priority 1) before any output is sent.
	 *
	 * @return void
	 */
	public function maybeStartSession(): void
	{
		// Only start session on frontend, not admin or AJAX/REST requests
		if (is_admin() || wp_doing_ajax() || defined('REST_REQUEST')) {
			return;
		}

		if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
			session_start();
		}
	}

	/**
	 * Adds 'wp-chat-admin-body' class to admin body if admin assets are enqueued.
	 *
	 * @param string $classes Existing admin body classes.
	 * @return string Modified admin body classes.
	 */
	public function addAdminBodyClass($classes): string
	{
		if ($this->shouldEnqueueAdminAssets()) {
			$classes .= ' wp-chat-admin-body';
		}
		return $classes;
	}

	/**
	 * Check if we should enqueue admin assets.
	 *
	 * @return bool
	 */
	private function shouldEnqueueAdminAssets(): bool
	{
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return is_admin() && !empty($_GET['page']) && strpos(sanitize_text_field(wp_unslash($_GET['page'])), 'wp-chat') !== false;
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function registerStyles(): void
	{
		$this->loadFonts();
	}

	/**
	 * Enqueues the Inter font for the WordPress admin panel.
	 *
	 * This function loads the Inter font from an external source
	 * and applies it to the WordPress admin area. It ensures
	 * the font is available for styling elements in the admin UI.
	 */
	public function loadFonts(): void
	{
		wp_register_style('wpchat-inter-font', WPCHAT_PLUGIN_URL . 'public/assets/fonts/inter/inter.css', [], WPCHAT_VERSION);
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueueAdminScripts(): void
	{
		// Enqueue admin scripts only on our admin pages.
		if ($this->shouldEnqueueAdminAssets()) {
			wp_enqueue_style('wpchat-inter-font');

			$adminScriptUrl = $this->getHashedEntryFile('admin');
			if (!$adminScriptUrl) {
				return;
			}

			wp_register_script(
				'wp-chat-admin',
				$adminScriptUrl,
				['wp-api-fetch', 'wp-i18n'],
				WPCHAT_VERSION,
				true
			);

			$getSystemInfo = $this->supportService->getSystemInfo();
			$timezoneDisplay = $this->utility->getFormattedTimezone();


			$settings = $this->settingsService->getAllSettings();
			$onboardingStatus = $settings['onboardingStatus'] ?? false;

			// Check if pro license exists in free version
			$hasProLicenseInFree = false;
			if (defined('WPCHAT_LITE') && WPCHAT_LITE) {
				$licenseKey = $this->privateSettingsService->getSetting('license_key');
				$hasProLicenseInFree = !empty($licenseKey);
			}

			wp_localize_script('wp-chat-admin', 'wpChatAdmin', [
				'pluginUrl' => WPCHAT_PLUGIN_URL,
				'pluginImageUrl' => WPCHAT_PLUGIN_URL . 'public/assets/images',
				'restNonce' => wp_create_nonce('wp_rest'),
				'restUrl' => rest_url('wpchat/v1/'),
				'mainPageUrl' => admin_url('admin.php?page=wp-chat'),
				'apiUrl' => WPCHAT_API_URL,
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				'currentPage' => isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '',
				'timezone'        => $timezoneDisplay,
				'systemInfo'      => $getSystemInfo,
				'systemInfoPlain' => str_replace('<br />', "\n", $getSystemInfo),
				'onboardingStatus' => $onboardingStatus,
				'accountUrl' => 'https://wpchat.com/account',
				'upgradeUrl' => 'https://wpchat.com/pricing',
				'adminEmail' => get_option('admin_email'),
				'productName' => defined('WPCHAT_PRODUCT_NAME') ? WPCHAT_PRODUCT_NAME : '',
				'storeUrl' => defined('WPCHAT_STORE_URL') ? WPCHAT_STORE_URL : 'https://wpchat.com',
				'urls' => [
					'upgrade' => UTMUrlGenerator::upgradeUrl(),
					'pricing' => UTMUrlGenerator::pricingUrl(),
					'support' => UTMUrlGenerator::supportUrl(),
					'manageLicense' => UTMUrlGenerator::generateUrl('/account/billing', ['utm_campaign' => 'license-management']),
					'downloadPro' => UTMUrlGenerator::generateUrl('/account/downloads/', [
						'utm_source' => 'wpchat-lite',
						'utm_medium' => 'admin-notice',
						'utm_campaign' => 'pro-license-detected',
					])
				],
				// Entitlement data
				'entitlement' => $this->entitlementDataService->getEntitlementData(),
				'features' => $this->entitlementDataService->getFeatureFlags(),
				'hasProLicenseInFree' => $hasProLicenseInFree
			]);

			// Localize license specific data
			wp_localize_script('wp-chat-admin', 'wpchatLicense', [
				'is_lite' => defined('WPCHAT_LITE') && WPCHAT_LITE,
				'is_pro' => defined('WPCHAT_PRO') && WPCHAT_PRO
			]);

			wp_enqueue_script('wp-chat-admin');
			wp_enqueue_media();
		}
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueueAdminStyles(): void
	{
		// Enqueue admin styles only on our admin pages.
		if ($this->shouldEnqueueAdminAssets()) {
			$this->loadFonts();
			wp_register_style(
				'wp-chat-admin-style',
				WPCHAT_PLUGIN_URL . 'public/assets/wp-chat-admin.css',
				[],
				WPCHAT_VERSION
			);

			wp_enqueue_style('wp-chat-admin-style');
		}
	}

	/**
	 * Check if frontend assets should be loaded.
	 *
	 * @return array|false Returns visibility result array if assets should be loaded, false otherwise.
	 */
	private function shouldLoadFrontendAssets()
	{
		if (!$this->shouldEnqueueFrontendAssets()) {
			return false;
		}

		// Get visibility result - consistent array format from both free and pro
		$visibilityResult = $this->visibilityService->shouldIncludeChatbot();

		if (!$visibilityResult['should_include']) {
			return false;
		}

		return $visibilityResult;
	}

	/**
	 * Enqueue frontend styles.
	 */
	public function enqueueFrontendStyles(): void
	{
		$visibilityResult = $this->shouldLoadFrontendAssets();
		if (!$visibilityResult) {
			return;
		}

		$this->loadFonts();
		wp_enqueue_style('wpchat-inter-font');
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueueFrontendScripts(): void
	{
		$visibilityResult = $this->shouldLoadFrontendAssets();
		if (!$visibilityResult) {
			return;
		}

		$funnelId = $visibilityResult['funnel_id'];

		$frontendScriptUrl = $this->getHashedEntryFile('frontend');
		if (!$frontendScriptUrl) {
			return;
		}

		wp_enqueue_script(
			'wp-chat-frontend',
			$frontendScriptUrl,
			['wp-i18n'],
			WPCHAT_VERSION,
			true
		);

		wp_localize_script('wp-chat-frontend', 'wpChatFrontend', [
			'restNonce' => wp_create_nonce('wp_rest'),
			'restUrl' => rest_url('wpchat/v1/'),
			'frontendNonce' => wp_create_nonce('wpchat_frontend'),
			'isPro' => defined('WPCHAT_PRO') && WPCHAT_PRO,
			'funnelId' => $funnelId,
			'brandingLogoUrl' => UTMUrlGenerator::brandingLogoUrl(),
			'sessionId' => session_id(),
			'connectionErrorMessage' => apply_filters('wpchat_connection_error_message', ''),
			'offHoursMessage' => apply_filters('wpchat_off_hours_message', ''),
		]);
	}

	/**
	 * Check if we should enqueue frontend assets.
	 *
	 * @return bool
	 */
	public function shouldEnqueueFrontendAssets(): bool
	{
		return apply_filters('wp_chat_should_enqueue_frontend_assets', !is_admin());
	}

	/**
	 * Filters the script loader tag for specific script handles.
	 *
	 * This method modifies the script tag for scripts with handles containing
	 * 'wp-chat-' to use the `type="module"` attribute.
	 *
	 * @param string $tag The HTML script tag to be filtered.
	 * @param string $handle The script handle for the enqueued script.
	 * @param string $source The source URL of the enqueued script.
	 *
	 * @return string The modified or unmodified script tag.
	 */
	/**
	 * Add inline translations for our scripts.
	 * This is needed because we use external WordPress globals, so WordPress
	 * can't auto-detect that our scripts need translations.
	 *
	 * @return void
	 */
	public function addInlineTranslations(): void
	{
		// Determine which script to load translations for
		$handle = is_admin() ? 'wp-chat-admin' : 'wp-chat-frontend';

		if (WP_DEBUG) {
			error_log(sprintf(
				'[WPChat] Checking translations - Handle: %s, Registered: %s, Enqueued: %s',
				$handle,
				wp_script_is($handle, 'registered') ? 'yes' : 'no',
				wp_script_is($handle, 'enqueued') ? 'yes' : 'no'
			));
		}

		// Only proceed if our script is enqueued
		if (!wp_script_is($handle, 'enqueued')) {
			if (WP_DEBUG) {
				error_log(sprintf('[WPChat] Script %s not enqueued yet', $handle));
			}
			return;
		}

		// Get current locale
		$locale = determine_locale();
		if (WP_DEBUG) {
			error_log(sprintf('[WPChat] Current locale: %s', $locale));
		}

		if ($locale === 'en_US') {
			return; // No translations needed for default English
		}

		// Find the JSON translation file (single file for both admin and frontend)
		$json_file = $this->findTranslationFile($locale);
		if (!$json_file || !file_exists($json_file)) {
			if (WP_DEBUG) {
				error_log(sprintf(
					'[WPChat] Translation file not found for locale %s',
					$locale
				));
			}
			return;
		}

		if (WP_DEBUG) {
			error_log(sprintf('[WPChat] Loading translations from: %s', $json_file));
		}

		// Load and validate the translations
		$json_data = file_get_contents($json_file);
		if (empty($json_data)) {
			if (WP_DEBUG) {
				error_log(sprintf('[WPChat] Empty translation file: %s', $json_file));
			}
			return;
		}

		// Decode and validate JSON structure
		$translations = json_decode($json_data, true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			error_log(sprintf(
				'[WPChat] Invalid JSON in translation file %s: %s',
				$json_file,
				json_last_error_msg()
			));
			return;
		}

		$domain = 'smashballoon-wpchat-livechat-customer-support';

		// Create inline script in WordPress format
		// Re-encode translations with wp_json_encode() for proper escaping
		$inline_script = sprintf(
			'( function( domain, translations ) {
				var localeData = translations.locale_data[ domain ] || translations.locale_data.messages;
				localeData[""].domain = domain;
				wp.i18n.setLocaleData( localeData, domain );
			} )( %s, %s );',
			wp_json_encode($domain),
			wp_json_encode($translations)
		);

		// Add as inline script to our script handle (before the main script runs)
		wp_add_inline_script('wp-i18n', $inline_script, 'after');

		if (WP_DEBUG) {
			error_log(sprintf('[WPChat] Translations loaded successfully for locale: %s, handle: %s', $locale, $handle));
		}
	}

	/**
	 * Find the translation JSON file for a given locale.
	 *
	 * @param string $locale Locale code
	 * @return string|false Path to JSON file or false if not found
	 */
	private function findTranslationFile($locale)
	{
		$languages_dir = WPCHAT_PLUGIN_DIR . 'languages/';
		$domain = 'smashballoon-wpchat-livechat-customer-support';

		// Build filename: smashballoon-wpchat-livechat-customer-support-ar.json
		$json_file = $languages_dir . $domain . '-' . $locale . '.json';

		return file_exists($json_file) ? $json_file : false;
	}

	public function filterScriptLoaderTag($tag, $handle, $source)
	{
		if (strpos($handle, 'wp-chat-') !== false) {
			// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- This is a filter modifying already-enqueued scripts to add type="module"
			$tag = '<script src="' . esc_url($source) . '" type="module" ></script>';
		}

		return $tag;
	}
}
