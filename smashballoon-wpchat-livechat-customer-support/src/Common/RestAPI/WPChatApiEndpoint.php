<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Services\WPChatApiService;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Class WPChatApiEndpoint
 * Defines REST API endpoints for WPChat API operations like
 * newsletter collection, user registration, ChatAI assistant, and other integrations.
 */
class WPChatApiEndpoint extends RestEndpoint
{
	/**
	 * The namespace of this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'wpchat-api';

	/**
	 * The WPChat API service.
	 *
	 * @var WPChatApiService
	 */
	private $wpChatApiService;

	/**
	 * Constructor.
	 *
	 * @param WPChatApiService $wpChatApiService The WPChat API service.
	 */
	public function __construct(WPChatApiService $wpChatApiService)
	{
		$this->wpChatApiService = $wpChatApiService;
	}

	/**
	 * Register the routes for the WPChat API endpoint.
	 */
	protected function registerRoutesInner()
	{
		// Email collection and registration endpoints
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/collect-email',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE, // POST
					'callback'            => array($this, 'collectEmail'),
					'permission_callback' => array($this, 'checkPermission'),
					'args'                => $this->getCollectEmailArgs(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/register',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE, // POST
					'callback'            => array($this, 'register'),
					'permission_callback' => array($this, 'checkPermission'),
					'args'                => $this->getRegisterArgs(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/register-and-collect',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE, // POST
					'callback'            => array($this, 'registerAndCollectEmail'),
					'permission_callback' => array($this, 'checkPermission'),
					'args'                => $this->getRegisterAndCollectArgs(),
				),
			)
		);
	}

	/**
	 * Collect email for newsletter subscription.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function collectEmail(WP_REST_Request $request)
	{
		$email = sanitize_email($request->get_param('email'));
		$additionalData = $request->get_param('additionalData') ?: [];

		if (empty($email)) {
			return new WP_Error(
				'missing_email',
				__('Email address is required.', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		$result = $this->wpChatApiService->collectEmail($email, $additionalData);

		if (is_wp_error($result)) {
			return $result;
		}

		return rest_ensure_response([
			'message' => __('Email collected successfully.', 'smashballoon-wpchat-livechat-customer-support'),
			'success' => true,
			'data' => $result,
		]);
	}

	/**
	 * Register user's domain and email.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function register(WP_REST_Request $request)
	{
		$email = sanitize_email($request->get_param('email'));
		$domain = sanitize_text_field($request->get_param('domain'));
		$additionalData = $request->get_param('additionalData') ?: [];

		if (empty($email)) {
			return new WP_Error(
				'missing_email',
				__('Email address is required.', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		$result = $this->wpChatApiService->registerUser($email, $domain, $additionalData);

		if (is_wp_error($result)) {
			return $result;
		}

		return rest_ensure_response([
			'message' => __('User registered successfully.', 'smashballoon-wpchat-livechat-customer-support'),
			'success' => true,
			'data' => $result,
		]);
	}

	/**
	 * Register user and collect email in one action.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function registerAndCollectEmail(WP_REST_Request $request)
	{
		$email = sanitize_email($request->get_param('email'));
		$domain = sanitize_text_field($request->get_param('domain'));
		$additionalData = $request->get_param('additionalData') ?: [];

		if (empty($email)) {
			return new WP_Error(
				'missing_email',
				__('Email address is required.', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		$result = $this->wpChatApiService->registerAndCollectEmail($email, $domain, $additionalData);

		if (!$result['success']) {
			return new WP_Error(
				'registration_failed',
				__('User registration failed.', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 500)
			);
		}

		return rest_ensure_response([
			'message' => __('User registered and email collected successfully.', 'smashballoon-wpchat-livechat-customer-support'),
			'success' => true,
			'data' => $result,
		]);
	}

	/**
	 * Define arguments for collecting email.
	 *
	 * @return array
	 */
	public function getCollectEmailArgs()
	{
		return array(
			'email' => array(
				'type'              => 'string',
				'description'       => __('Email address to collect for newsletter subscription.', 'smashballoon-wpchat-livechat-customer-support'),
				'required'          => true,
				'validate_callback' => function ($param) {
					return is_email($param);
				},
				'sanitize_callback' => 'sanitize_email',
			),
			'additionalData' => array(
				'type'        => 'object',
				'description' => __('Additional data to send with the newsletter subscription.', 'smashballoon-wpchat-livechat-customer-support'),
				'default'     => array(),
			),
		);
	}

	/**
	 * Define arguments for registering user.
	 *
	 * @return array
	 */
	public function getRegisterArgs()
	{
		return array(
			'email' => array(
				'type'              => 'string',
				'description'       => __('Email address to register.', 'smashballoon-wpchat-livechat-customer-support'),
				'required'          => true,
				'validate_callback' => function ($param) {
					return is_email($param);
				},
				'sanitize_callback' => 'sanitize_email',
			),
			'domain' => array(
				'type'        => 'string',
				'description' => __('Domain to register (optional, will use site domain if not provided).', 'smashballoon-wpchat-livechat-customer-support'),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'additionalData' => array(
				'type'        => 'object',
				'description' => __('Additional data to send with the registration.', 'smashballoon-wpchat-livechat-customer-support'),
				'default'     => array(),
			),
		);
	}

	/**
	 * Define arguments for registering and collecting email.
	 *
	 * @return array
	 */
	public function getRegisterAndCollectArgs()
	{
		return array(
			'email' => array(
				'type'              => 'string',
				'description'       => __('Email address to register and collect.', 'smashballoon-wpchat-livechat-customer-support'),
				'required'          => true,
				'validate_callback' => function ($param) {
					return is_email($param);
				},
				'sanitize_callback' => 'sanitize_email',
			),
			'domain' => array(
				'type'        => 'string',
				'description' => __('Domain to register (optional, will use site domain if not provided).', 'smashballoon-wpchat-livechat-customer-support'),
				'sanitize_callback' => 'sanitize_text_field',
			),
			'additionalData' => array(
				'type'        => 'object',
				'description' => __('Additional data to send with both registration and newsletter subscription.', 'smashballoon-wpchat-livechat-customer-support'),
				'default'     => array(),
			),
		);
	}
}
