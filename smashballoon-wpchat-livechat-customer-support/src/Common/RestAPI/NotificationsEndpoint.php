<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use SmashBalloon\WPChat\Common\Services\NotificationService;
use SmashBalloon\WPChat\Common\Services\SettingsService;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Class NotificationsEndpoint
 * REST API endpoints for in-plugin notifications.
 *
 * @package SmashBalloon\WPChat\Common\RestAPI
 */
class NotificationsEndpoint extends RestEndpoint {

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $restBase = 'notifications';

	/**
	 * The notification service.
	 *
	 * @var NotificationService
	 */
	private NotificationService $notificationService;

	/**
	 * The settings service.
	 *
	 * @var SettingsService
	 */
	private SettingsService $settingsService;

	/**
	 * Constructor.
	 *
	 * @param NotificationService $notificationService The notification service.
	 * @param SettingsService     $settingsService     The settings service.
	 */
	public function __construct( NotificationService $notificationService, SettingsService $settingsService ) {
		$this->notificationService = $notificationService;
		$this->settingsService     = $settingsService;
	}

	/**
	 * Register the routes for notifications.
	 */
	protected function registerRoutesInner() {
register_rest_route(
    $this->namespace,
    '/' . $this->restBase,
    array(
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'getNotifications' ),
			'permission_callback' => array( $this, 'checkPermission' ),
		),
    )
);

register_rest_route(
    $this->namespace,
    '/' . $this->restBase . '/dismiss',
    array(
		array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'dismissNotification' ),
			'permission_callback' => array( $this, 'checkPermission' ),
			'args'                => array(
				'id' => array(
					'required'          => true,
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => function ( $param ) {
						return is_string( $param ) && ! empty( $param );
					},
				),
			),
		),
    )
);
	}

	/**
	 * Get active notifications.
	 *
	 * @return WP_REST_Response
	 */
	public function getNotifications() {
		$settings             = $this->settingsService->getAllSettings();
		$notificationsEnabled = ! empty( $settings['notificationsEnabled'] );

		if ( ! $notificationsEnabled ) {
return rest_ensure_response(
    array(
		'notifications' => array(),
		'count'         => 0,
    )
);
		}

		$notifications = $this->notificationService->get();

return rest_ensure_response(
    array(
		'notifications' => $notifications,
		'count'         => count( $notifications ),
    )
);
	}

	/**
	 * Dismiss a notification.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function dismissNotification( WP_REST_Request $request ) {
		$id = $request->get_param( 'id' );

		if ( $this->notificationService->dismiss( $id ) ) {
return rest_ensure_response(
    array(
		'message' => __( 'Notification dismissed', 'smashballoon-wpchat-livechat-customer-support' ),
		'status'  => 200,
    )
);
		}

return new WP_Error(
    'dismiss_failed',
    __( '[WPC-NTF-001] Failed to dismiss notification', 'smashballoon-wpchat-livechat-customer-support' ),
    array( 'status' => 500 )
);
	}
}
