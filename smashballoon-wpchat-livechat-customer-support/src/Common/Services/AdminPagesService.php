<?php

namespace SmashBalloon\WPChat\Common\Services;

if ( ! defined( 'ABSPATH' ) ) {
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
class AdminPagesService implements ServiceProviderInterface {

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
	 * Nonce action for saving the access token from the verification email.
	 */
	public const CONNECT_TOKEN_NONCE_ACTION = 'wpchat_connect_access_token';

	/**
	 * Per-user transient holding a token from the verification link until the admin confirms it.
	 */
	public const PENDING_TOKEN_TRANSIENT = 'wpchat_pending_api_token_';

	/**
	 * Smart Search manager, for the record of this site's own claim.
	 *
	 * @var SmartSearchManagerService
	 */
	private SmartSearchManagerService $smartSearchManager;

	/**
	 * Constructor.
	 *
	 * @param SettingsService           $settingsService        The settings service.
	 * @param PrivateSettingsService    $privateSettingsService The private settings service.
	 * @param GateInterface             $gate                   The gate service.
	 * @param SmartSearchManagerService $smartSearchManager     The Smart Search manager.
	 */
	public function __construct(
		SettingsService $settingsService,
		PrivateSettingsService $privateSettingsService,
		GateInterface $gate,
		SmartSearchManagerService $smartSearchManager
	) {
		$this->settingsService = $settingsService;
		$this->privateSettingsService = $privateSettingsService;
		$this->gate = $gate;
		$this->smartSearchManager = $smartSearchManager;
	}

/**
 * Register the admin menu pages.
 *
 * @inheritDoc
 */
	public function register(): void {
		add_action( 'admin_menu', array($this, 'addAdminMenu') );
		add_action( 'admin_init', array($this, 'handleAccessToken') );
		add_action('load-toplevel_page_wp-chat', array($this, 'captureAccessTokenFromUrl'));
		add_action( 'in_admin_header', array($this, 'removeAdminNotices') );
		add_filter( 'user_has_cap', array($this, 'filterUserCapabilities'), 10, 4 );
		add_filter( 'members_get_capabilities', array($this, 'registerMembersCapabilities') );
	}

/**
 * Add admin menu pages
 *
 * @return void
 **/
	public function addAdminMenu() {
		$icon_url = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjEwODQgMi4wMDUxOUMxMy4zNjIgMi4wMDUxOSAxNiA0LjY0MzIxIDE2IDcuODk2NzlDMTYgMTEuMjI3NiAxMy4yNjIyIDEzLjgzMyAxMC4wNDEgMTMuNzg5NEwwIDE0LjMyNTVMMS4xMzE4NCAxMC44ODMxQzAuNDE4NzkxIDkuOTQ4MDMgMCA4Ljc4Mjg1IDAgNy41MzI1M0M2LjU1NDE0ZS0wNSA0LjQ4MDEyIDIuNDc0OTIgMi4wMDUxOSA1LjUyNzM0IDIuMDA1MTlIMTAuMTA4NFpNNC4zODA4NiA3LjU5MzA4VjcuNjU2NTZDNC4zODA5MiA5LjQ3OTkxIDUuODU5MjUgMTAuOTU4MyA3LjY4MjYyIDEwLjk1ODNDOS41MDU5IDEwLjk1ODIgMTAuOTg0MyA5LjQ3OTg1IDEwLjk4NDQgNy42NTY1NlY3LjU5MzA4SDkuMzMzMDEgVjcuNjU2NTZDOS4zMzI5NSA4LjU2ODE0IDguNTk0MiA5LjMwNjg0IDcuNjgyNjIgOS4zMDY5NUM2Ljc3MDk1IDkuMzA2OTUgNi4wMzEzMSA4LjU2ODIxIDYuMDMxMjUgNy42NTY1NlY3LjU5MzA4SDQuMzgwODZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=';

		$icon_url = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjEwODQgMi4wMDUxOUMxMy4zNjIgMi4wMDUxOSAxNiA0LjY0MzIxIDE2IDcuODk2NzlDMTYgMTEuMjI3NiAxMy4yNjIyIDEzLjgzMyAxMC4wNDEgMTMuNzg5NEwwIDE0LjMyNTVMMS4xMzE4NCAxMC44ODMxQzAuNDE4NzkxIDkuOTQ4MDMgMCA4Ljc4Mjg1IDAgNy41MzI1M0M2LjU1NDE0ZS0wNSA0LjQ4MDEyIDIuNDc0OTIgMi4wMDUxOSA1LjUyNzM0IDIuMDA1MTlIMTAuMTA4NFpNNC4zODA4NiA3LjU5MzA4VjcuNjU2NTZDNC4zODA5MiA5LjQ3OTkxIDUuODU5MjUgMTAuOTU4MyA3LjY4MjYyIDEwLjk1ODNDOS41MDU5IDEwLjk1ODIgMTAuOTg0MyA5LjQ3OTg1IDEwLjk4NDQgNy42NTY1NlY3LjU5MzA4SDkuMzMzMDEgVjcuNjU2NTZDOS4zMzI5NSA4LjU2ODE0IDguNTk0MiA5LjMwNjg0IDcuNjgyNjIgOS4zMDY5NUM2Ljc3MDk1IDkuMzA2OTUgNi4wMzEzMSA4LjU2ODIxIDYuMDMxMjUgNy42NTY1NlY3LjU5MzA4SDQuMzgwODZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=';

		add_menu_page(
		__( 'WPChat', 'smashballoon-wpchat-livechat-customer-support' ),
		__( 'WPChat', 'smashballoon-wpchat-livechat-customer-support' ),
		'wpchat_admin',
		'wp-chat',
		array($this, 'renderAdminPage'),
		$icon_url,
		26
		);

		// Add Overview as first submenu item
		add_submenu_page(
		'wp-chat',
		__( 'Overview', 'smashballoon-wpchat-livechat-customer-support' ),
		__( 'Overview', 'smashballoon-wpchat-livechat-customer-support' ),
		'wpchat_admin',
		'wp-chat',
		array($this, 'renderAdminPage'),
		);

		$settings         = $this->settingsService->getAllSettings();
		$onboardingStatus = $settings['onboardingStatus'] ?? false;

		if ( $onboardingStatus ) {
			add_submenu_page(
				'wp-chat',
				__( 'Visibility', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Visibility', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/visibility',
				array($this, 'renderAdminPage'),
			);

			add_submenu_page(
				'wp-chat',
				__( 'Customizer', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Customizer', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/customizer',
				array($this, 'renderAdminPage'),
			);


			add_submenu_page(
				'wp-chat',
				__( 'Agents', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Agents', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/agents',
				array($this, 'renderAdminPage'),
			);

			add_submenu_page(
				'wp-chat',
				__( 'Frequent Questions', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Frequent Questions', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/faqs',
				array($this, 'renderAdminPage'),
			);

			add_submenu_page(
				'wp-chat',
				__( 'Chat Funnels', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Chat Funnels', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/funnels',
				array($this, 'renderAdminPage'),
			);

			add_submenu_page(
				'wp-chat',
				__( 'Settings', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Settings', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/settings',
				array($this, 'renderAdminPage'),
			);

			add_submenu_page(
				'wp-chat',
				__( 'Support', 'smashballoon-wpchat-livechat-customer-support' ),
				__( 'Support', 'smashballoon-wpchat-livechat-customer-support' ),
				'wpchat_admin',
				'wp-chat#/support',
				array($this, 'renderAdminPage'),
			);

			if ( ! defined( 'WPCHAT_PRO' ) || ! WPCHAT_PRO ) {
						add_submenu_page(
				'wp-chat',
				__( 'Upgrade', 'smashballoon-wpchat-livechat-customer-support' ),
				sprintf(
					'<div class="sb-wpchat-pro-upgrade-link-container"><div class="sb-wpchat-pro-upgrade-link-bg"></div><strong class="sb-wpchat-pro-upgrade-link">%s</strong></div>',
					__( 'Upgrade', 'smashballoon-wpchat-livechat-customer-support' )
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Selects which screen to show; no write.
		$connectState = isset($_GET['wpchat_connect']) ? sanitize_key(wp_unslash($_GET['wpchat_connect'])) : '';

		if (in_array($connectState, array('confirm', 'none'), true) && $this->currentUserIsWpChatAdmin()) {
			$connectId = $this->getPending()['id'];
			if ('confirm' === $connectState && '' === $connectId) {
				$connectState = 'none';
			}
			include WPCHAT_PLUGIN_DIR . 'templates/admin-connect-token.php';
			return;
		}

		include WPCHAT_PLUGIN_DIR . 'templates/admin-ui.php';
	}

	/**
	 * Move the token from the verification link out of the URL, before the page renders.
	 *
	 * After email verification, the WPChat API sends the admin to admin.php?page=wp-chat&access_token=….
	 * That URL cannot carry a nonce, so the token is only parked for the current admin, and only
	 * when this site claimed Smart Search in the last 24 hours (the life of the emailed link).
	 * handleAccessToken() saves it after the admin confirms (SMASH-2676).
	 *
	 * @return void
	 */
	public function captureAccessTokenFromUrl()
	{
		$token = $this->getAccessTokenFromUrl();
		if ('' === $token || !$this->currentUserIsWpChatAdmin()) {
			return;
		}

		$state = 'none';
		if ($this->smartSearchManager->hasRecentClaimOffer()) {
			// The id goes into the Connect form, so the POST saves only the token its screen was for.
			$pending = array('token' => $token, 'id' => wp_generate_password(20, false, false));
			set_transient(self::PENDING_TOKEN_TRANSIENT . get_current_user_id(), $pending, 30 * MINUTE_IN_SECONDS);
			$state = 'confirm';
		}

		wp_safe_redirect(add_query_arg('wpchat_connect', $state, admin_url('admin.php?page=wp-chat')));
		exit();
	}

	/**
	 * Save the parked access token after the admin confirms it.
	 *
	 * The admin_init hook also fires on admin-post.php and admin-ajax.php, including for logged-out
	 * requests, so the capability and nonce checks here are the only guard (SMASH-2676).
	 *
	 * @return void
	 */
	public function handleAccessToken()
	{
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Presence check only; the nonce is verified below before any write.
		if (!isset($_POST['wpchat_connect_confirm'])) {
			return;
		}

		if (!$this->currentUserIsWpChatAdmin()) {
			return;
		}

		check_admin_referer(self::CONNECT_TOKEN_NONCE_ACTION, 'wpchat_connect_nonce');

		$accessToken = $this->pendingTokenForForm();
		delete_transient(self::PENDING_TOKEN_TRANSIENT . get_current_user_id());

		if ('' === $accessToken) {
			wp_safe_redirect(add_query_arg('wpchat_connect', 'none', admin_url('admin.php?page=wp-chat')));
			exit();
		}

		$this->privateSettingsService->updateSetting('api_token', $accessToken);

		// Hooks run before the redirect (vector generation, usage stats).
		do_action('wpchat_api_token_updated', $accessToken);

		wp_safe_redirect(admin_url('admin.php?page=wp-chat'));
		exit();
	}

	/**
	 * The token and one-time id parked for the current user by captureAccessTokenFromUrl().
	 * Both are '' when nothing is parked.
	 *
	 * @return array{token: string, id: string}
	 */
	private function getPending(): array
	{
		$pending = get_transient(self::PENDING_TOKEN_TRANSIENT . get_current_user_id());
		if (!is_array($pending) || !isset($pending['token'], $pending['id'])) {
			return array('token' => '', 'id' => '');
		}

		return array('token' => (string) $pending['token'], 'id' => (string) $pending['id']);
	}

	/**
	 * The parked token, but only when the confirmed form carries its one-time id; '' otherwise.
	 *
	 * A link loaded after the Connect screen rendered replaces the parked token and its id, so
	 * the older screen's POST saves nothing (SMASH-2676). Call after the nonce check.
	 *
	 * @return string
	 */
	private function pendingTokenForForm(): string
	{
		$pending = $this->getPending();
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- handleAccessToken() verified the nonce.
		$postedId = isset($_POST['wpchat_connect_id'])
			? sanitize_text_field(wp_unslash($_POST['wpchat_connect_id']))
			: '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		// Nothing parked gives '' for both, so the token returned is '' too.
		return hash_equals($pending['id'], $postedId) ? $pending['token'] : '';
	}

	/**
	 * The access token the WPChat API put in the admin page URL, or '' when there is none.
	 *
	 * @return string
	 */
	private function getAccessTokenFromUrl(): string
	{
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Parked for confirmation only; saving needs the nonce in handleAccessToken().
		if (!isset($_GET['access_token']) || !is_string($_GET['access_token'])) {
			return '';
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- As above.
		return sanitize_text_field(wp_unslash($_GET['access_token']));
	}

	/**
	 * Same check as the admin REST routes (RestEndpoint::checkPermission()).
	 *
	 * @return bool
	 */
	private function currentUserIsWpChatAdmin(): bool
	{
		return current_user_can('manage_options') || current_user_can('wpchat_admin');
	}

/**
 * Remove admin notices on WPChat pages
 *
 * @return void
 */
	public function removeAdminNotices() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only check of admin page parameter, no data modification
		$currentPage  = $_GET['page'] ?? '';
		$isWpChatPage = (strpos( $currentPage, 'wp-chat' ) === 0);

		if ( $isWpChatPage ) {
			remove_all_actions( 'admin_notices' );
			remove_all_actions( 'all_admin_notices' );
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
	public function filterUserCapabilities( array $allcaps, array $caps, array $args, $user ): array {
		if ( isset( $allcaps['manage_options'] ) && $allcaps['manage_options'] ) {
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
	public function registerMembersCapabilities( array $caps ): array {
		$caps[] = 'wpchat_admin';

		return $caps;
	}
}
