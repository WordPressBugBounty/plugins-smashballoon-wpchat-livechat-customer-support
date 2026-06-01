<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Services\SmartSearchManagerService;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Exception;

/**
 * Class SmartSearchEndpoint
 * Defines REST API endpoints for Smart Search functionality.
 */
class SmartSearchEndpoint extends RestEndpoint
{
	/**
	 * The namespace of this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'smart-search';

	/**
	 * The Smart Search manager service.
	 *
	 * @var SmartSearchManagerService
	 */
	private $smartSearchManager;

	/**
	 * Constructor.
	 *
	 * @param SmartSearchManagerService $smartSearchManager The Smart Search manager service.
	 */
	public function __construct(SmartSearchManagerService $smartSearchManager)
	{
		$this->smartSearchManager = $smartSearchManager;
	}

	/**
	 * Register the routes for the Smart Search endpoint.
	 */
	protected function registerRoutesInner()
	{
		// Route for claiming token offer
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/claim-offer',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE, // POST
					'callback'            => array($this, 'claimOffer'),
					'permission_callback' => array($this, 'checkPublicPermission'),
					'args'                => array(
						'email' => array(
							'required' => true,
							'type' => 'string',
							'format' => 'email',
							'description' => __('Email address for claiming the Smart Search token offer', 'smashballoon-wpchat-livechat-customer-support'),
						),
					),
				),
			)
		);
	}

	/**
	 * Handle claim offer request.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function claimOffer(WP_REST_Request $request)
	{
		$email = sanitize_email($request->get_param('email'));

		if (!is_email($email)) {
			return new WP_Error(
				'invalid_email',
				__('Invalid email address provided.', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		try {
			$result = $this->smartSearchManager->claimOffer($email);

			return rest_ensure_response([
				'message' => $result['message'],
				'status' => 200,
				'success' => true
			]);

		} catch (Exception $e) {
			return new WP_Error(
				'claim_offer_failed',
				__('Failed to claim offer: ', 'smashballoon-wpchat-livechat-customer-support') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}
}