<?php

namespace SmashBalloon\WPChat\Common\Services;

if ( ! defined( 'ABSPATH' ) ) {
exit;
}

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Helpers\Utility;

/**
 * DebugService
 *
 * Single home for all dev/QA debug tooling. Owns the hidden
 * /wp-admin/admin.php?page=wp-chat-debug page and the POST action
 * handler that backs its buttons.
 *
 * Convention: any new debug surface belongs here. Add a new section to
 * render() and a new case to handleActions() — do not add debug code to
 * production services.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class DebugService implements ServiceProviderInterface {

/**
 * @var SettingsService
 */
private SettingsService $settingsService;

/**
 * @var NotificationService
 */
private NotificationService $notificationService;

public function __construct( SettingsService $settingsService, NotificationService $notificationService ) {
    $this->settingsService     = $settingsService;
    $this->notificationService = $notificationService;
}

/**
 * @inheritDoc
 */
public function register(): void {
    add_action( 'admin_menu', array($this, 'addDebugPage') );
    add_action( 'admin_init', array($this, 'handleActions') );
}

/**
 * Register the hidden debug submenu page (not shown in the menu).
 */
public function addDebugPage(): void {
add_submenu_page(
    '',
    'WPChat Debug',
    'WPChat Debug',
    'wpchat_admin',
    'wp-chat-debug',
    array($this, 'render')
);
}

/**
 * Render the debug page.
 */
public function render(): void {
    $settings  = $this->settingsService->getAllSettings();
    $isPro     = Utility::isProBuild();
    $url       = defined( 'WPCHAT_NOTIFICATIONS_URL' ) ? WPCHAT_NOTIFICATIONS_URL : '(undefined)';
    $transient = get_transient( NotificationService::REMOTE_TRANSIENT_KEY );
    $cronNext  = wp_next_scheduled( NotificationService::CRON_HOOK );
    $option    = get_option( NotificationService::OPTION_NAME, array() );
    $rendered  = $this->notificationService->get();

    echo '<div class="wrap"><h1>WPChat Debug</h1>';
    echo '<style>
			.wpchat-debug-table { border-collapse: collapse; margin: 12px 0; max-width: 1000px; }
			.wpchat-debug-table th, .wpchat-debug-table td { border: 1px solid #ccd0d4; padding: 8px 12px; text-align: left; vertical-align: top; font-family: monospace; font-size: 13px; }
			.wpchat-debug-table th { background: #f0f0f1; width: 260px; }
			.wpchat-debug-pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 4px; overflow: auto; max-height: 400px; font-size: 12px; }
			.wpchat-debug-ok { color: #00a32a; font-weight: bold; }
			.wpchat-debug-bad { color: #d63638; font-weight: bold; }
			.wpchat-debug-actions { background: #f6f7f7; border: 1px solid #ccd0d4; border-radius: 4px; padding: 12px 16px; margin: 12px 0 20px; max-width: 1000px; }
			.wpchat-debug-actions form { display: inline-block; margin: 4px 8px 4px 0; }
		</style>';

    $nonce     = wp_create_nonce( 'wpchat_debug_actions' );
    $actionUrl = admin_url( 'admin.php?page=wp-chat-debug' );

    echo '<div class="wpchat-debug-actions">';
    echo '<h2 style="margin-top:0;">Actions</h2>';
    echo '<form method="post" action="' . esc_url( $actionUrl ) . '">';
    echo '<input type="hidden" name="wpchat_debug_action" value="flush_transient" />';
    echo '<input type="hidden" name="wpchat_debug_nonce" value="' . esc_attr( $nonce ) . '" />';
    echo '<button type="submit" class="button">Flush transient cache</button>';
    echo '</form>';
    echo '<form method="post" action="' . esc_url( $actionUrl ) . '">';
    echo '<input type="hidden" name="wpchat_debug_action" value="force_refetch" />';
    echo '<input type="hidden" name="wpchat_debug_nonce" value="' . esc_attr( $nonce ) . '" />';
    echo '<button type="submit" class="button button-primary">Force refetch from URL</button>';
    echo '</form>';
    echo '<form method="post" action="' . esc_url( $actionUrl ) . '">';
    echo '<input type="hidden" name="wpchat_debug_action" value="clear_dismissed" />';
    echo '<input type="hidden" name="wpchat_debug_nonce" value="' . esc_attr( $nonce ) . '" />';
    echo '<button type="submit" class="button">Clear dismissed list</button>';
    echo '</form>';

    echo '<h3 style="margin-top:16px;">Simulate user scenarios</h3>';
    echo '<p style="margin:4px 0 8px; color:#646970;">Each button rewrites <code>wpchat_first_install_time</code> to put the site in a particular state, then reloads this page so you can see the gate verdict update.</p>';

    echo '<form method="post" action="' . esc_url( $actionUrl ) . '">';
    echo '<input type="hidden" name="wpchat_debug_action" value="install_time_now" />';
    echo '<input type="hidden" name="wpchat_debug_nonce" value="' . esc_attr( $nonce ) . '" />';
    echo '<button type="submit" class="button" title="Sets install time = now. Notifications should be hidden for ~7 days.">1. Fresh install — should NOT see notifications (waiting period active)</button>';
    echo '</form>';
    echo '<form method="post" action="' . esc_url( $actionUrl ) . '">';
    echo '<input type="hidden" name="wpchat_debug_action" value="install_time_past_window" />';
    echo '<input type="hidden" name="wpchat_debug_nonce" value="' . esc_attr( $nonce ) . '" />';
    echo '<button type="submit" class="button" title="Sets install time = 8 days ago. Waiting period is over.">2. Installed &gt; 1 week ago — SHOULD see notifications</button>';
    echo '</form>';
    echo '<form method="post" action="' . esc_url( $actionUrl ) . '">';
    echo '<input type="hidden" name="wpchat_debug_action" value="install_time_clear" />';
    echo '<input type="hidden" name="wpchat_debug_nonce" value="' . esc_attr( $nonce ) . '" />';
    echo '<button type="submit" class="button" title="Deletes the option. Pre-feature users who never had an install timestamp.">3. Existing user (pre-feature) — SHOULD see notifications</button>';
    echo '</form>';
    echo '</div>';

    echo '<h2>Resolved state</h2>';
    echo '<table class="wpchat-debug-table">';
    printf( '<tr><th>WPCHAT_NOTIFICATIONS_URL</th><td>%s</td></tr>', esc_html( $url ) );
    printf( '<tr><th>WPCHAT_PRO constant</th><td>%s</td></tr>', defined( 'WPCHAT_PRO' ) ? (WPCHAT_PRO ? '<span class="wpchat-debug-ok">true</span>' : 'false') : '<em>undefined</em>' );
    printf( '<tr><th>Utility::isProBuild()</th><td>%s</td></tr>', $isPro ? '<span class="wpchat-debug-ok">true</span>' : '<span class="wpchat-debug-bad">false</span>' );
    printf( '<tr><th>WPCHAT_VERSION</th><td>%s</td></tr>', defined( 'WPCHAT_VERSION' ) ? esc_html( WPCHAT_VERSION ) : '<em>undefined</em>' );
    echo '</table>';

    echo '<h2>Settings (relevant to notifications)</h2>';
    echo '<table class="wpchat-debug-table">';
    printf( '<tr><th>notificationsEnabled</th><td>%s</td></tr>', ! empty( $settings['notificationsEnabled'] ) ? 'true' : 'false' );
    printf( '<tr><th>dataSharingConsent</th><td>%s</td></tr>', ! empty( $settings['dataSharingConsent'] ) ? 'true' : 'false' );
    printf( '<tr><th>dataSharingConsentDismissed</th><td>%s</td></tr>', ! empty( $settings['dataSharingConsentDismissed'] ) ? 'true' : 'false' );
    printf( '<tr><th>onboardingStatus</th><td>%s</td></tr>', ! empty( $settings['onboardingStatus'] ) ? 'true' : 'false' );
    echo '</table>';

    echo '<h2>Recent-install gate</h2>';
    $firstInstall    = (int) get_option( NotificationService::FIRST_INSTALL_OPTION, 0 );
    $filterOverride  = (bool) apply_filters( 'wpchat_skip_recent_install_check', false );
    $isRecentInstall = $this->notificationService->isRecentlyInstalled();
    echo '<table class="wpchat-debug-table">';
    if ( $firstInstall > 0 ) {
printf(
				'<tr><th>wpchat_first_install_time</th><td>%d &nbsp;(<em>%s — %s ago</em>)</td></tr>',
				$firstInstall,
				esc_html( date_i18n( 'Y-m-d H:i:s', $firstInstall ) ),
				esc_html( human_time_diff( $firstInstall, time() ) )
);
    } else {
    echo '<tr><th>wpchat_first_install_time</th><td><em>not set (treated as old install)</em></td></tr>';
    }
    printf( '<tr><th>RECENT_INSTALL_WINDOW</th><td>%d seconds (%s)</td></tr>', NotificationService::RECENT_INSTALL_WINDOW, esc_html( human_time_diff( 0, NotificationService::RECENT_INSTALL_WINDOW ) ) );
    printf( '<tr><th>wpchat_skip_recent_install_check filter</th><td>%s</td></tr>', $filterOverride ? '<span class="wpchat-debug-ok">true (gate bypassed)</span>' : 'false' );
printf(
    '<tr><th>Recently installed?</th><td>%s</td></tr>',
    $isRecentInstall
				? '<span class="wpchat-debug-bad">yes — notifications suppressed unless recent_install_override is set</span>'
				: '<span class="wpchat-debug-ok">no</span>'
);
    echo '</table>';

    echo '<h2>Remote feed cache (transient)</h2>';
    echo '<table class="wpchat-debug-table">';
    printf( '<tr><th>Transient key</th><td>%s</td></tr>', esc_html( NotificationService::REMOTE_TRANSIENT_KEY ) );
    printf( '<tr><th>Cached?</th><td>%s</td></tr>', is_array( $transient ) ? '<span class="wpchat-debug-ok">yes</span>' : '<span class="wpchat-debug-bad">no</span>' );
    printf( '<tr><th>Item count</th><td>%d</td></tr>', is_array( $transient ) ? count( $transient ) : 0 );
    printf( '<tr><th>Cron hook</th><td>%s</td></tr>', esc_html( NotificationService::CRON_HOOK ) );
    printf( '<tr><th>Next cron run</th><td>%s</td></tr>', $cronNext ? esc_html( date_i18n( 'Y-m-d H:i:s', $cronNext ) . ' (' . human_time_diff( time(), $cronNext ) . ')' ) : '<em>not scheduled</em>' );
    echo '</table>';

    echo '<h2>Final rendered notifications (' . count( $rendered ) . ')</h2>';
    echo '<pre class="wpchat-debug-pre">' . esc_html( wp_json_encode( $rendered, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) ) . '</pre>';

    echo '<h2>Raw transient payload</h2>';
    echo '<pre class="wpchat-debug-pre">' . esc_html( wp_json_encode( $transient, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) ) . '</pre>';

    echo '<h2>Dismissed IDs</h2>';
    echo '<pre class="wpchat-debug-pre">' . esc_html( wp_json_encode( $option['dismissed'] ?? array(), JSON_PRETTY_PRINT ) ) . '</pre>';

    echo '</div>';
}

/**
 * Handle POST actions submitted from the debug page.
 */
public function handleActions(): void {
    if ( empty( $_POST['wpchat_debug_action'] ) || empty( $_POST['wpchat_debug_nonce'] ) ) {
    return;
    }
    if ( ! current_user_can( 'wpchat_admin' ) ) {
    return;
    }
    $nonce = sanitize_text_field( wp_unslash( $_POST['wpchat_debug_nonce'] ) );
    if ( ! wp_verify_nonce( $nonce, 'wpchat_debug_actions' ) ) {
    return;
    }
    $action = sanitize_text_field( wp_unslash( $_POST['wpchat_debug_action'] ) );

    switch ( $action ) {
    case 'flush_transient':
				delete_transient( NotificationService::REMOTE_TRANSIENT_KEY );
				break;
    case 'force_refetch':
				$this->notificationService->fetchRemoteNotifications( true );
				break;
    case 'clear_dismissed':
				$option              = get_option( NotificationService::OPTION_NAME, array() );
				$option['dismissed'] = array();
				update_option( NotificationService::OPTION_NAME, $option, false );
				break;
    case 'install_time_now':
				update_option( NotificationService::FIRST_INSTALL_OPTION, time(), false );
				break;
    case 'install_time_past_window':
				update_option( NotificationService::FIRST_INSTALL_OPTION, time() - (8 * DAY_IN_SECONDS), false );
				break;
    case 'install_time_clear':
				delete_option( NotificationService::FIRST_INSTALL_OPTION );
				break;
    }

    wp_safe_redirect( admin_url( 'admin.php?page=wp-chat-debug' ) );
    exit;
}
}
