<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use WP_REST_Controller;
use WP_REST_Request;
use WP_Error;

/**
 * Abstract class for defining REST API endpoints.
 * All custom endpoint classes should extend this class.
 */
abstract class RestEndpoint extends WP_REST_Controller
{
	/**
	 * Namespace for the endpoint (e.g., 'wpchat/v1').
	 * Must be defined in the child class.
	 *
	 * @var string
	 */
	protected $namespace = 'wpchat/v1';

	/**
	 * Route base for the endpoint (e.g., '/settings').
	 * Must be defined in the child class.
	 *
	 * @var string
	 */
	protected $restBase;

	/**
	 * Registers the routes for this endpoint.
	 * This method should be called by the RestAPIService.
	 *
	 * Child classes must implement the `registerRoutesInner()` method to define specific routes.
	 */
	public function registerRoutes()
	{
		if (empty($this->namespace) || empty($this->restBase)) {
			_doing_it_wrong(
				__CLASS__ . '::registerRoutes',
				esc_html__('Namespace and RestBase properties must be defined in the child class.', 'smashballoon-wpchat-livechat-customer-support'),
				'1.0.0'
			);
			return;
		}

		$this->registerRoutesInner(); // Call the child class's route registration method.
	}

	/**
	 * Abstract method to register the specific routes for this endpoint.
	 * Child classes must implement this method to define their routes.
	 *
	 * @return void
	 */
	abstract protected function registerRoutesInner();

	/**
	 * Checks if the request has a valid security token for public endpoints.
	 *
	 * This method verifies the security token provided in the request headers or parameters.
	 * For logged-in users, it checks the 'X-WP-Nonce' header against the 'wp_rest' nonce.
	 * For non-logged-in users, it checks the 'nonce' parameter against the 'wpchat_frontend' nonce.
	 * If the token is invalid or missing, it returns a WP_Error object with a 403 status.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool|WP_Error Returns true if the token is valid, otherwise returns a WP_Error object.
	 */
	public function checkPublicPermission(WP_REST_Request $request)
	{
		if (is_user_logged_in()) {
			$nonce = $request->get_header('X-WP-Nonce');
			if (!wp_verify_nonce($nonce, 'wp_rest')) {
				return new WP_Error('invalid_nonce', __('[WPC-AUTH-001] Invalid security token', 'smashballoon-wpchat-livechat-customer-support'), array('status' => 403));
			}
			return true;
		}

		$nonce = $request->get_param('nonce');

		if (empty($nonce)) {
			return new WP_Error(
				'rest_forbidden',
				__('[WPC-AUTH-001] No security token provided', 'smashballoon-wpchat-livechat-customer-support'),
				['status' => 403]
			);
		}

		if (!wp_verify_nonce($nonce, 'wpchat_frontend')) {
			return new WP_Error(
				'rest_forbidden',
				__('[WPC-AUTH-001] Invalid security token. Please refresh the page and try again', 'smashballoon-wpchat-livechat-customer-support'),
				['status' => 403]
			);
		}

		return true;
	}

	/**
	 * Checks if the current user has permission to access this endpoint.
	 * This is a default permission check. Child classes can override this for custom logic.
	 *
	 * @return bool
	 */
	public function checkPermission()
	{
		return current_user_can('manage_options') || current_user_can('wpchat_admin');
	}
}
