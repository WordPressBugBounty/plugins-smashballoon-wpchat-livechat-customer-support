<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\GateInterface;
use SmashBalloon\WPChat\Common\Helpers\UTMUrlGenerator;

/**
 * Class AdminPagesService
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class AdminPagesService implements ServiceProviderInterface
{
	/**
	 * Settings service.
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * Private settings service.
	 *
	 * @var PrivateSettingsService
	 */
	private $privateSettingsService;

	/**
	 * Gate service for entitlement checks.
	 *
	 * @var GateInterface
	 */
	private GateInterface $gate;

	/**
	 * Constructor.
	 *
	 * @param SettingsService        $settingsService The settings service.
	 * @param PrivateSettingsService $privateSettingsService The private settings service.
	 * @param GateInterface          $gate The gate service.
	 */
	public function __construct(SettingsService $settingsService, PrivateSettingsService $privateSettingsService, GateInterface $gate)
	{
		$this->settingsService = $settingsService;
		$this->privateSettingsService = $privateSettingsService;
		$this->gate = $gate;
	}

	/**
	 * Register the admin menu pages.
	 *
	 * @inheritDoc
	 */
	public function register(): void
	{
		add_action('admin_menu', [$this, 'addAdminMenu']);
		add_action('admin_init', [$this, 'handleAccessToken']);
		add_action('in_admin_header', [$this, 'removeAdminNotices']);
		add_filter('user_has_cap', [$this, 'filterUserCapabilities'], 10, 4);
		add_filter('members_get_capabilities', [$this, 'registerMembersCapabilities']);
	}

	/**
	 * Add admin menu pages
	 *
	 * @return void
	 **/
	public function addAdminMenu()
	{
		$icon_url = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjEwODQgMi4wMDUxOUMxMy4zNjIgMi4wMDUxOSAxNiA0LjY0MzIxIDE2IDcuODk2NzlDMTYgMTEuMjI3NiAxMy4yNjIyIDEzLjgzMyAxMC4wNDEgMTMuNzg5NEwwIDE0LjMyNTVMMS4xMzE4NCAxMC44ODMxQzAuNDE4NzkxIDkuOTQ4MDMgMCA4Ljc4Mjg1IDAgNy41MzI1M0M2LjU1NDE0ZS0wNSA0LjQ4MDEyIDIuNDc0OTIgMi4wMDUxOSA1LjUyNzM0IDIuMDA1MTlIMTAuMTA4NFpNNC4zODA4NiA3LjU5MzA4VjcuNjU2NTZDNC4zODA5MiA5LjQ3OTkxIDUuODU5MjUgMTAuOTU4MyA3LjY4MjYyIDEwLjk1ODNDOS41MDU5IDEwLjk1ODIgMTAuOTg0MyA5LjQ3OTg1IDEwLjk4NDQgNy42NTY1NlY3LjU5MzA4SDkuMzMzMDEgVjcuNjU2NTZDOS4zMzI5NSA4LjU2ODE0IDguNTk0MiA5LjMwNjg0IDcuNjgyNjIgOS4zMDY5NUM2Ljc3MDk1IDkuMzA2OTUgNi4wMzEzMSA4LjU2ODIxIDYuMDMxMjUgNy42NTY1NlY3LjU5MzA4SDQuMzgwODZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=";

		$icon_url = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjEwODQgMi4wMDUxOUMxMy4zNjIgMi4wMDUxOSAxNiA0LjY0MzIxIDE2IDcuODk2NzlDMTYgMTEuMjI3NiAxMy4yNjIyIDEzLjgzMyAxMC4wNDEgMTMuNzg5NEwwIDE0LjMyNTVMMS4xMzE4NCAxMC44ODMxQzAuNDE4NzkxIDkuOTQ4MDMgMCA4Ljc4Mjg1IDAgNy41MzI1M0M2LjU1NDE0ZS0wNSA0LjQ4MDEyIDIuNDc0OTIgMi4wMDUxOSA1LjUyNzM0IDIuMDA1MTlIMTAuMTA4NFpNNC4zODA4NiA3LjU5MzA4VjcuNjU2NTZDNC4zODA5MiA5LjQ3OTkxIDUuODU5MjUgMTAuOTU4MyA3LjY4MjYyIDEwLjk1ODNDOS41MDU5IDEwLjk1ODIgMTAuOTg0MyA5LjQ3OTg1IDEwLjk4NDQgNy42NTY1NlY3LjU5MzA4SDkuMzMzMDEgVjcuNjU2NTZDOS4zMzI5NSA4LjU2ODE0IDguNTk0MiA5LjMwNjg0IDcuNjgyNjIgOS4zMDY5NUM2Ljc3MDk1IDkuMzA2OTUgNi4wMzEzMSA4LjU2ODIxIDYuMDMxMjUgNy42NTY1NlY3LjU5MzA4SDQuMzgwODZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=";

		add_menu_page(
			__('WPChat', 'smashballoon-wpchat-livechat-customer-support'),
			__('WPChat', 'smashballoon-wpchat-livechat-customer-support'),
			'wpchat_admin',
			'wp-chat',
			[$this, 'renderAdminPage'],
			$icon_url,
			26
		);

		// Add Overview as first submenu item
		add_submenu_page(
			'wp-chat',
			__('Overview', 'smashballoon-wpchat-livechat-customer-support'),
			__('Overview', 'smashballoon-wpchat-livechat-customer-support'),
			'wpchat_admin',
			'wp-chat',
			[$this, 'renderAdminPage'],
		);

		$settings = $this->settingsService->getAllSettings();
		$onboardingStatus = $settings['onboardingStatus'] ?? false;

		if ($onboardingStatus) {
			add_submenu_page(
				'wp-chat',
				__('Visibility', 'smashballoon-wpchat-livechat-customer-support'),
				__('Visibility', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/visibility',
				[$this, 'renderAdminPage'],
			);

			add_submenu_page(
				'wp-chat',
				__('Customizer', 'smashballoon-wpchat-livechat-customer-support'),
				__('Customizer', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/customizer',
				[$this, 'renderAdminPage'],
			);


			add_submenu_page(
				'wp-chat',
				__('Agents', 'smashballoon-wpchat-livechat-customer-support'),
				__('Agents', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/agents',
				[$this, 'renderAdminPage'],
			);

			add_submenu_page(
				'wp-chat',
				__('Frequent Questions', 'smashballoon-wpchat-livechat-customer-support'),
				__('Frequent Questions', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/faqs',
				[$this, 'renderAdminPage'],
			);

			add_submenu_page(
				'wp-chat',
				__('Chat Funnels', 'smashballoon-wpchat-livechat-customer-support'),
				__('Chat Funnels', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/funnels',
				[$this, 'renderAdminPage'],
			);

			add_submenu_page(
				'wp-chat',
				__('Settings', 'smashballoon-wpchat-livechat-customer-support'),
				__('Settings', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/settings',
				[$this, 'renderAdminPage'],
			);

			add_submenu_page(
				'wp-chat',
				__('Support', 'smashballoon-wpchat-livechat-customer-support'),
				__('Support', 'smashballoon-wpchat-livechat-customer-support'),
				'wpchat_admin',
				'wp-chat#/support',
				[$this, 'renderAdminPage'],
			);

			if (! defined('WPCHAT_PRO') || ! WPCHAT_PRO) {
				add_submenu_page(
					'wp-chat',
					__('Upgrade', 'smashballoon-wpchat-livechat-customer-support'),
					sprintf( '<div class="sb-wpchat-pro-upgrade-link-container"><div class="sb-wpchat-pro-upgrade-link-bg"></div><strong class="sb-wpchat-pro-upgrade-link">%s</strong></div>',
						__('Upgrade', 'smashballoon-wpchat-livechat-customer-support')
					),
					'wpchat_admin',
					UTMUrlGenerator::upgradeUrl(),
					''
				);
			}
		}
	}

	/**
	 * Render admin page
	 *
	 * @return void
	 */
	public function renderAdminPage()
	{
		include WPCHAT_PLUGIN_DIR . 'templates/admin-ui.php';
	}

	/**
	 * Handle access token capture from URL parameters
	 *
	 * @return void
	 */
	public function handleAccessToken()
	{
		// Check if we're on a WPChat admin page and have an access_token parameter
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only check of admin page parameter, no data modification
		$currentPage = $_GET['page'] ?? '';
		$isWpChatPage = (strpos($currentPage, 'wp-chat') === 0);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- OAuth callback from external service cannot include nonce
		if ($isWpChatPage && isset($_GET['access_token'])) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.NonceVerification.Recommended -- OAuth access token from external service, properly sanitized
			$accessToken = sanitize_text_field(wp_unslash($_GET['access_token']));

			// Validate that the token is not empty
			if (!empty($accessToken)) {
				// Store the access token in private settings
				$this->privateSettingsService->updateSetting('api_token', $accessToken);

				// Trigger any actions that need to happen after token update
				// This ensures hooks are processed before redirect
				do_action('wpchat_api_token_updated', $accessToken);

				// Redirect to remove the token from the URL for security
				$redirectUrl = remove_query_arg('access_token');
				wp_safe_redirect($redirectUrl);
				exit();
			}
		}
	}

	/**
	 * Remove admin notices on WPChat pages
	 *
	 * @return void
	 */
	public function removeAdminNotices()
	{
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only check of admin page parameter, no data modification
		$currentPage = $_GET['page'] ?? '';
		$isWpChatPage = (strpos($currentPage, 'wp-chat') === 0);

		if ($isWpChatPage) {
			remove_all_actions('admin_notices');
			remove_all_actions('all_admin_notices');
		}
	}

	/**
	 * Auto-grant wpchat_admin capability to users who have manage_options.
	 *
	 * @param array   $allcaps All capabilities of the user.
	 * @param array   $caps    Required capabilities for the requested action.
	 * @param array   $args    Additional arguments passed to has_cap.
	 * @param \WP_User $user   The user object.
	 * @return array Modified capabilities.
	 */
	public function filterUserCapabilities(array $allcaps, array $caps, array $args, $user): array
	{
		if (isset($allcaps['manage_options']) && $allcaps['manage_options']) {
			$allcaps['wpchat_admin'] = true;
		}

		return $allcaps;
	}

	/**
	 * Register wpchat_admin capability with the Members plugin.
	 *
	 * @param array $caps Existing capabilities registered with Members.
	 * @return array Modified capabilities array.
	 */
	public function registerMembersCapabilities(array $caps): array
	{
		$caps[] = 'wpchat_admin';

		return $caps;
	}
}
