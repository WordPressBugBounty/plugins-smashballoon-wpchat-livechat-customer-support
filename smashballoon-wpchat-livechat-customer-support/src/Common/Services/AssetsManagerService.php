<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

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
		add_filter('pre_load_script_translations', [$this, 'provideScriptTranslations'], 10, 4);
		add_action('init', [$this, 'registerStyles']);
		add_action('init', [$this, 'maybeStartSession'], 1);
		add_action('admin_enqueue_scripts', [$this, 'enqueueAdminScripts']);
		add_action('admin_enqueue_scripts', [$this, 'enqueueAdminStyles']);
		add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendScripts']);
		add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendStyles']);
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
			wp_set_script_translations('wp-chat-admin', 'smashballoon-wpchat-livechat-customer-support', WPCHAT_PLUGIN_DIR . 'languages');
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
		wp_set_script_translations('wp-chat-frontend', 'smashballoon-wpchat-livechat-customer-support', WPCHAT_PLUGIN_DIR . 'languages');

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
	 * Provide JavaScript translations for our scripts straight from the
	 * loaded text domain, regardless of where the .mo file came from.
	 *
	 * WordPress only looks for handle-named JSON inside the path passed to
	 * wp_set_script_translations() and for md5-named JSON in WP_LANG_DIR.
	 * Translations downloaded from the WPChat CDN land in WP_LANG_DIR/plugins
	 * as .mo files with no accompanying JSON, so neither lookup finds them.
	 *
	 * By short-circuiting pre_load_script_translations we build the Jed
	 * payload on the fly from the already-loaded domain (via
	 * get_translations_for_domain()), so the React GUI translates for any
	 * locale the CDN provides without any build-time JSON generation.
	 *
	 * @param mixed  $translations The pre-computed translations (null by default).
	 * @param string $file         The translation file path WordPress would load.
	 * @param string $handle       The script handle.
	 * @param string $domain       The text domain.
	 * @return mixed JSON string of locale data, or the original value to let core proceed.
	 */
	public function provideScriptTranslations($translations, $file, $handle, $domain)
	{
		if ($domain !== 'smashballoon-wpchat-livechat-customer-support') {
			return $translations;
		}

		if (!in_array($handle, ['wp-chat-frontend', 'wp-chat-admin'], true)) {
			return $translations;
		}

		$loaded = get_translations_for_domain($domain);
		$entries = $loaded->entries ?? [];

		// No translations loaded for this locale (e.g. en_US). Let core proceed
		// so the untranslated source strings are used.
		if (empty($entries)) {
			return $translations;
		}

		// Build the Jed/setLocaleData payload directly from the loaded text
		// domain. WP_Scripts::print_translations() reads locale_data.messages
		// and overrides the '' domain itself.
		$localeData = [
			'' => [
				'domain' => 'messages',
				'lang'   => is_admin() ? get_user_locale() : determine_locale(),
			],
		];

		if (!empty($loaded->headers['Plural-Forms'])) {
			$localeData['']['plural-forms'] = $loaded->headers['Plural-Forms'];
		}

		// Build each entry's lookup key from the entry itself: WP 6.5+ returns
		// a numerically-indexed entries array, so we cannot rely on the array
		// key. Translation_Entry::key() yields "{context}\4{singular}" (or just
		// the singular), which is exactly what @wordpress/i18n (Tannin) expects.
		// ->translations is the value array Tannin reads (index 0 = singular).
		foreach ($entries as $entry) {
			$key = $entry->key();

			if (false === $key) {
				continue;
			}

			$localeData[$key] = $entry->translations;
		}

		return wp_json_encode(
			[
				'domain'      => 'messages',
				'locale_data' => ['messages' => $localeData],
			]
		);
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
	public function filterScriptLoaderTag($tag, $handle, $source)
	{
		if (strpos($handle, 'wp-chat-') !== false) {
			// WordPress's do_item() concatenates translations, inline scripts, and
			// the main <script> tag into a single $tag string. We must only modify
			// the external script tag (has src=), not replace the entire string,
			// or we'd discard translation data and wp_localize_script output.
			// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- Modifying already-enqueued script to add type="module"
			$tag = preg_replace('#<script ([^>]*src=)#', '<script type="module" $1', $tag);
		}

		return $tag;
	}
}
