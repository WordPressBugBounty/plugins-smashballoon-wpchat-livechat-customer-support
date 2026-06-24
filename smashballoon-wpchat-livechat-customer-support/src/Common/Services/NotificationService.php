<?php

namespace SmashBalloon\WPChat\Common\Services;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Helpers\Utility;

/**
 * Class NotificationService
 *
 * Manages in-plugin notifications: reading from local JSON or remote endpoint,
 * filtering by type/version/dates, and tracking dismissals.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class NotificationService implements ServiceProviderInterface {

	/**
	 * Option name for storing notification state.
	 */
	const OPTION_NAME = 'wpchat_notifications';

	/**
	 * Plugin identifier for filtering notifications.
	 */
	const PLUGIN = 'wpchat';

	/**
	 * Transient key for caching the remote notifications feed.
	 */
	const REMOTE_TRANSIENT_KEY = 'wpchat_remote_notifications_cache';

	/**
	 * Cron hook name for refreshing remote notifications.
	 */
	const CRON_HOOK = 'wpchat_refresh_remote_notifications';

	/**
	 * Option storing the Unix timestamp of the plugin's first activation.
	 */
	const FIRST_INSTALL_OPTION = 'wpchat_first_install_time';

	/**
	 * How long after first install notifications are suppressed.
	 */
	const RECENT_INSTALL_WINDOW = WEEK_IN_SECONDS;

	/**
	 * Source file path for local notifications.
	 *
	 * @var string
	 */
	private string $sourceFile;

	/**
	 * In-memory cache of the option data.
	 *
	 * @var array|null
	 */
	private ?array $optionCache = null;

	/**
	 * In-memory cache of the active notification count.
	 *
	 * @var int|null
	 */
	private ?int $countCache = null;

	/**
	 * The settings service instance.
	 *
	 * @var SettingsService
	 */
	private SettingsService $settingsService;

	/**
	 * The license service instance.
	 *
	 * @var LicenseServiceInterface
	 */
	private LicenseServiceInterface $licenseService;

	/**
	 * NotificationService constructor.
	 *
	 * @param SettingsService         $settingsService The settings service instance.
	 * @param LicenseServiceInterface $licenseService  The license service instance.
	 */
	public function __construct( SettingsService $settingsService, LicenseServiceInterface $licenseService ) {
		$this->settingsService = $settingsService;
		$this->licenseService = $licenseService;
		$this->sourceFile = WPCHAT_PLUGIN_DIR . 'src/Common/Data/notifications.json';
	}

	/**
	 * Whether the remote notifications feed should be fetched.
	 *
	 * Both Pro and Free require notificationsEnabled AND dataSharingConsent.
	 * Pro users can opt out of remote notifications by turning consent off.
	 *
	 * @param array $settings Settings array from SettingsService.
	 * @return bool
	 */
	private function shouldFetchRemote( array $settings ): bool {
		return ! empty( $settings['notificationsEnabled'] )
			&& ! empty( $settings['dataSharingConsent'] );
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void {
		add_action( self::CRON_HOOK, array( $this, 'cronRefreshRemoteNotifications' ) );

		$settings = $this->settingsService->getAllSettings();
		$shouldFetchRemote = $this->shouldFetchRemote( $settings );

		if ( $shouldFetchRemote ) {
			if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
				wp_schedule_event( time(), 'daily', self::CRON_HOOK );
			}
		} else {
			$this->clearCron();
		}

		add_action( 'wpchat_plugin_deactivated', array( $this, 'clearCron' ) );
		add_action( 'wpchat_settings_updated', array( $this, 'onSettingsUpdated' ) );
	}

	/**
	 * Handle settings updates to clear remote cache and reschedule cron.
	 *
	 * When data sharing consent or notifications settings change,
	 * clear the stale remote cache so fresh data is fetched immediately.
	 *
	 * The action payload may be a raw, partial settings array (e.g. from a
	 * single-key updateSetting() call) that lacks the notification flags. Read
	 * the authoritative merged-with-defaults settings instead so we never
	 * mistake "key absent" for "feature off" and clear the cron on Pro sites
	 * that never explicitly saved these flags.
	 *
	 * @param array $settings The updated settings (unused; payload may be partial).
	 * @return void
	 */
	public function onSettingsUpdated( array $settings ): void {
		$settings = $this->settingsService->getAllSettings();
		$shouldFetchRemote = $this->shouldFetchRemote( $settings );

		if ( $shouldFetchRemote ) {
			// Both toggles are on. If we don't already have a cached remote
			// feed, fetch it synchronously so the notification stack renders
			// the moment the settings-save response lands — covers first-time
			// onboarding accept and the Dashboard consent-modal accept. An
			// already-populated transient means a valid ≤24h-old feed is
			// ready, so ordinary settings saves don't pay the network cost.
			if ( get_transient( self::REMOTE_TRANSIENT_KEY ) === false ) {
				$this->fetchRemoteNotifications( true );
			}

			if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
				wp_schedule_event( time(), 'daily', self::CRON_HOOK );
			}
		} else {
			// Either flag off — stop the daily refresh cron. get() will
			// serve the local JSON (src/Common/Data/notifications.json) the
			// next time the UI requests notifications.
			$this->clearCron();
		}
	}

	/**
	 * Cron callback to refresh remote notifications.
	 *
	 * Only fetches if both in-plugin notifications and data sharing consent are enabled.
	 *
	 * @return void
	 */
	public function cronRefreshRemoteNotifications(): void {
		$settings = $this->settingsService->getAllSettings();
		if ( $this->shouldFetchRemote( $settings ) ) {
			$this->fetchRemoteNotifications( true );
		}
	}

	/**
	 * Clear the cron event on plugin deactivation.
	 *
	 * @return void
	 */
	public function clearCron(): void {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/**
	 * Get the stored notification option data.
	 *
	 * @param bool $cache Whether to use cached data.
	 * @return array
	 */
	public function getOption( bool $cache = true ): array {
		if ( $cache && null !== $this->optionCache ) {
			return $this->optionCache;
		}

		$option = get_option( self::OPTION_NAME, array() );

		$this->optionCache = wp_parse_args(
			$option,
			array(
				'events'    => array(),
				'dismissed' => array(),
			)
		);

		return $this->optionCache;
	}

	/**
	 * Read notifications from the local JSON file.
	 *
	 * @return array
	 */
	public function getNotificationsData(): array {
		if ( ! file_exists( $this->sourceFile ) ) {
			return array();
		}

		// wp_json_file_decode() only exists in WP 5.9+, but the plugin supports
		// WP 5.8. Fall back to a manual decode so 5.8 sites don't fatal.
		if ( function_exists( 'wp_json_file_decode' ) ) {
			$data = wp_json_file_decode( $this->sourceFile, array( 'associative' => true ) );
		} else {
			$contents = file_get_contents( $this->sourceFile ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$data     = ( false !== $contents ) ? json_decode( $contents, true ) : null;
		}

		return is_array( $data ) ? $data : array();
	}

	/**
	 * Fetch notifications from the remote Smash Balloon endpoint.
	 *
	 * Caches the response in a 24-hour transient. The cron callback and the
	 * consent-transition handler can bypass the cache by passing $force=true.
	 *
	 * @param bool $force When true, skip the cached value and re-fetch.
	 * @return array
	 */
	public function fetchRemoteNotifications( bool $force = false ): array {
		if ( ! $force ) {
			$cached = get_transient( self::REMOTE_TRANSIENT_KEY );
			if ( is_array( $cached ) ) {
				return $cached;
			}
		}

		$response = wp_remote_get(
			WPCHAT_NOTIFICATIONS_URL,
			array(
				'timeout'   => 3,
				'sslverify' => true,
			)
		);

		if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
			$cached = get_transient( self::REMOTE_TRANSIENT_KEY );
			return is_array( $cached ) ? $cached : array();
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			$cached = get_transient( self::REMOTE_TRANSIENT_KEY );
			return is_array( $cached ) ? $cached : array();
		}

		set_transient( self::REMOTE_TRANSIENT_KEY, $data, DAY_IN_SECONDS );

		return $data;
	}

	/**
	 * Get active, non-dismissed notifications.
	 * Uses the remote source only when both in-plugin notifications and data
	 * sharing consent are enabled; otherwise uses the local JSON file. Applies
	 * to both Pro and Free.
	 *
	 * @return array
	 */
	public function get(): array {
		$settings = $this->settingsService->getAllSettings();

		if ( empty( $settings['notificationsEnabled'] ) ) {
			$this->countCache = 0;
			return array();
		}

		$useRemote = ! empty( $settings['dataSharingConsent'] );

		if ( $useRemote ) {
			$feed = $this->fetchRemoteNotifications();
		} else {
			$feed = $this->getNotificationsData();
		}

		$notifications = $this->verify( $feed );
		$notifications = $this->verifyActive( $notifications );

		$notifications = $this->sanitizeNotifications( $notifications );

		// Limit to latest 3 notifications.
		$result = array_slice( array_values( $notifications ), 0, 3 );

		// Cache the count to avoid re-reading JSON on subsequent getCount() calls.
		$this->countCache = count( $result );

		return $result;
	}

	/**
	 * Filter notifications by plugin, type (free/pro), version ranges, and dismissed IDs.
	 *
	 * @param array $notifications Raw notifications array.
	 * @return array Filtered notifications.
	 */
	public function verify( array $notifications ): array {
		$option    = $this->getOption();
		$dismissed = $option['dismissed'];
		$isPro     = defined( 'WPCHAT_PRO' ) && WPCHAT_PRO && $this->licenseService->isLicenseActive();
		$type      = $isPro ? 'pro' : 'free';

return array_filter(
    $notifications,
    function ( $notification ) use ( $dismissed, $type ) {
    // Must have an ID.
    if ( empty( $notification['id'] ) ) {
     return false;
    }

    // Skip dismissed.
    if ( in_array( (string) $notification['id'], $dismissed, true ) ) {
     return false;
    }

    // Filter by plugin.
    if ( ! empty( $notification['plugin'] ) && ! in_array( self::PLUGIN, $notification['plugin'], true ) ) {
     return false;
    }

    // Filter by type (free/pro).
    if ( ! empty( $notification['type'] ) && ! in_array( $type, $notification['type'], true ) ) {
     return false;
    }

    // Filter by plugin version range.
    if ( defined( 'WPCHAT_VERSION' ) ) {
     if ( ! empty( $notification['minver'] ) && version_compare( WPCHAT_VERSION, $notification['minver'], '<' ) ) {
      return false;
     }
     if ( ! empty( $notification['maxver'] ) && version_compare( WPCHAT_VERSION, $notification['maxver'], '>' ) ) {
      return false;
     }
    }

    // Filter by WordPress version range.
    global $wp_version;
    if ( ! empty( $notification['minwpver'] ) && version_compare( $wp_version, $notification['minwpver'], '<' ) ) {
     return false;
    }
    if ( ! empty( $notification['maxwpver'] ) && version_compare( $wp_version, $notification['maxwpver'], '>' ) ) {
     return false;
    }

    return true;
    }
);
	}

	/**
	 * Filter notifications by start/end date window and the recent-install
	 * suppression gate.
	 *
	 * Notifications are hidden during {@see self::RECENT_INSTALL_WINDOW} after
	 * the plugin's first activation unless the notification opts out with
	 * `recent_install_override: true` (set by the feed author).
	 *
	 * @param array $notifications Pre-filtered notifications.
	 * @return array Active notifications only.
	 */
	public function verifyActive( array $notifications ): array {
		$now             = time();
		$isRecentInstall = $this->isRecentlyInstalled();

return array_filter(
    $notifications,
    function ( $notification ) use ( $now, $isRecentInstall ) {
    // strtotime() returns false on a malformed date; ignore the gate in that
    // case rather than coercing false to 0 (which would wrongly hide the card).
    if ( ! empty( $notification['start'] ) ) {
     $start = strtotime( $notification['start'] );
     if ( false !== $start && $now < $start ) {
      return false;
     }
    }
    if ( ! empty( $notification['end'] ) ) {
     $end = strtotime( $notification['end'] );
     if ( false !== $end && $now > $end ) {
      return false;
     }
    }
    if ( $isRecentInstall && empty( $notification['recent_install_override'] ) ) {
     return false;
    }
    return true;
    }
);
	}

	/**
	 * Whether the plugin was installed within the recent-install window.
	 *
	 * Returns false when the install timestamp is missing (treats existing
	 * installs as "not recent" so they see notifications normally). The
	 * `wpchat_skip_recent_install_check` filter bypasses the gate entirely
	 * for QA / dev overrides.
	 *
	 * @return bool
	 */
	public function isRecentlyInstalled(): bool {
		if ( apply_filters( 'wpchat_skip_recent_install_check', false ) ) {
			return false;
		}

		$firstInstall = (int) get_option( self::FIRST_INSTALL_OPTION, 0 );

		if ( $firstInstall <= 0 ) {
			return false;
		}

		return (time() - $firstInstall) < self::RECENT_INSTALL_WINDOW;
	}

	/**
	 * Dismiss a notification by ID.
	 *
	 * @param string $id Notification ID to dismiss.
	 * @return bool
	 */
	public function dismiss( string $id ): bool {
		$option = $this->getOption( false );

		// Idempotent: if it's already dismissed the state is already correct.
		// Returning early avoids calling update_option() with unchanged data,
		// which returns false and would surface as an HTTP 500 to the client.
		if ( in_array( $id, $option['dismissed'], true ) ) {
			return true;
		}

		$option['dismissed'][] = sanitize_text_field( $id );

		// Invalidate count cache since dismissed list changed.
		$this->countCache = null;

		return $this->saveOption( $option );
	}

	/**
	 * Get count of active notifications.
	 *
	 * Uses in-memory cache when available to avoid re-reading the JSON file
	 * on every admin page load.
	 *
	 * @return int
	 */
	public function getCount(): int {
		if ( null !== $this->countCache ) {
			return $this->countCache;
		}

		return count( $this->get() );
	}

	/**
	 * Sanitize content_html in notifications using wp_kses.
	 *
	 * @param array $notifications Notifications array.
	 * @return array Sanitized notifications.
	 */
	private function sanitizeNotifications( array $notifications ): array {
		$allowedTags = $this->getAllowedContentHtmlTags();

		return array_map(
			function ( $notification ) use ( $allowedTags ) {
				if ( ! empty( $notification['content_html'] ) ) {
					$notification['content_html'] = wp_kses( $notification['content_html'], $allowedTags );
				}

				if ( ! empty( $notification['btns'] ) && is_array( $notification['btns'] ) ) {
					$replacements = array(
						'{wpc_plugin}'     => self::PLUGIN,
						'{wpc_admin_url}'  => admin_url( 'admin.php?page=wp-chat' ),
						'{wpc_utm_source}' => Utility::isProBuild() ? 'wpchat-pro' : 'wpchat-free',
					);
					foreach ( $notification['btns'] as &$btn ) {
						// A remote feed may send a null/non-array button entry
						// (e.g. "btns": {"primary": null}); skip it so we never
						// access an array offset on a non-array (PHP 8+ warning).
						if ( ! is_array( $btn ) ) {
							continue;
						}
						if ( ! empty( $btn['url'] ) ) {
							// esc_url_raw() (not esc_url()) because this URL is JSON-encoded
							// and consumed by the React app as an href; the display-context
							// esc_url() would encode & as &#038; and break the link.
							$btn['url'] = esc_url_raw( strtr( $btn['url'], $replacements ) );
						}
					}
					unset( $btn );
				}

				return $notification;
			},
			$notifications
		);
	}

	/**
	 * Get allowed HTML tags for content_html field.
	 *
	 * @return array
	 */
	private function getAllowedContentHtmlTags(): array {
		return array(
			'a'      => array(
				'href'   => array(),
				'target' => array(),
				'rel'    => array(),
				'title'  => array(),
			),
			'strong' => array(),
			'em'     => array(),
			'b'      => array(),
			'i'      => array(),
			'p'      => array(),
			'br'     => array(),
			'ul'     => array(),
			'ol'     => array(),
			'li'     => array(),
			'code'   => array(),
		);
	}

	/**
	 * Save the notification option data.
	 *
	 * @param array $option Option data to save.
	 * @return bool
	 */
	private function saveOption( array $option ): bool {
		$this->optionCache = $option;
		return update_option( self::OPTION_NAME, $option, false );
	}
}
