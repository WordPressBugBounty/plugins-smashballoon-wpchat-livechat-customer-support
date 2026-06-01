<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Contracts\FaqsServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\GateInterface;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class FaqsEndpoint
 * Handles CRUD operations for FAQs.
 */
class FaqsEndpoint extends RestEndpoint
{
	/**
	 * The route base for this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'faqs';

	/**
	 * The FAQs service.
	 *
	 * @var FaqsServiceInterface
	 */
	private FaqsServiceInterface $faqsService;

	/**
	 * The gate service for entitlement checks.
	 *
	 * @var GateInterface
	 */
	private GateInterface $gateService;

	/**
	 * Constructor.
	 *
	 * @param FaqsServiceInterface $faqsService The FAQs service.
	 * @param GateInterface        $gateService The gate service.
	 */
	public function __construct(FaqsServiceInterface $faqsService, GateInterface $gateService)
	{
		$this->faqsService = $faqsService;
		$this->gateService = $gateService;
	}

	/**
	 * Register the routes for the FAQs endpoint.
	 */
	protected function registerRoutesInner()
	{
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase,
			array(
				array(
					'methods' => WP_REST_Server::READABLE, // GET.
					'callback' => array($this, 'getAllFaqs'),
					'permission_callback' => array($this, 'checkPublicPermission'),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE, // POST.
					'callback' => array($this, 'createFaq'),
					'permission_callback' => array($this, 'checkPermission'),
					'args' => $this->getFaqArgs(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/(?P<id>\d+)',
			array(
				array(
					'methods' => WP_REST_Server::READABLE, // GET.
					'callback' => array($this, 'getFaqById'),
					'permission_callback' => array($this, 'checkPermission'),
				),
				array(
					'methods' => WP_REST_Server::EDITABLE, // PUT.
					'callback' => array($this, 'updateFaq'),
					'permission_callback' => array($this, 'checkPermission'),
					'args' => $this->getFaqArgs(),
				),
				array(
					'methods' => WP_REST_Server::DELETABLE, // DELETE.
					'callback' => array($this, 'deleteFaq'),
					'permission_callback' => array($this, 'checkPermission'),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/by-page/(?P<page_id>\d+)',
			array(
				array(
					'methods' => WP_REST_Server::READABLE, // GET.
					'callback' => array($this, 'getFaqsByPage'),
					'permission_callback' => array($this, 'checkPermission'),
				),
			)
		);

		// Bulk deletion endpoint.
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/bulk-delete',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE, // POST.
					'callback' => array($this, 'bulkDeleteFaqs'),
					'permission_callback' => array($this, 'checkPermission'),
					'args' => array(
						'ids' => array(
							'type' => 'array',
							'required' => true,
							'description' => __('Array of FAQ IDs to delete.', 'smashballoon-wpchat-livechat-customer-support'),
							'validate_callback' => function ($param) {
								return is_array($param) && !empty($param);
							},
							'items' => array(
								'type' => 'integer',
								'description' => __('FAQ ID', 'smashballoon-wpchat-livechat-customer-support'),
							),
						),
					),
				),
			)
		);

		// Clone FAQ endpoint.
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/(?P<id>\d+)/clone',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE, // POST.
					'callback' => array($this, 'cloneFaq'),
					'permission_callback' => array($this, 'checkPermission'),
				),
			)
		);

		// Search FAQs endpoint.
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/search',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'searchFaqs'),
					'permission_callback' => array($this, 'checkPublicPermission'),
					'args' => array(
						'query' => array(
							'required' => true,
							'type' => 'string',
							'description' => __('Search query.', 'smashballoon-wpchat-livechat-customer-support'),
							'sanitize_callback' => 'sanitize_text_field',
						),
						'limit' => array(
							'required' => false,
							'type' => 'integer',
							'default' => 5,
							'description' => __('Maximum number of results to return.', 'smashballoon-wpchat-livechat-customer-support'),
						),
						'offset' => array(
							'required' => false,
							'type' => 'integer',
							'default' => 0,
							'description' => __('Number of results to skip.', 'smashballoon-wpchat-livechat-customer-support'),
						),
					),
				),
			)
		);

		// Click tracking endpoint
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/click',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE, // POST.
					'callback' => array($this, 'trackFaqClick'),
					'permission_callback' => array($this, 'checkPublicPermission'),
					'args' => array(
						'faq_id' => array(
							'required' => true,
							'type' => 'integer',
							'description' => __('The ID of the FAQ to track.', 'smashballoon-wpchat-livechat-customer-support'),
							'validate_callback' => function ($param) {
								return is_numeric($param) && $param > 0;
							},
						),
					),
				),
			)
		);
	}

	/**
	 * Get all FAQs.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	public function getAllFaqs(WP_REST_Request $request)
	{
		$page = (int) $request->get_param('page') ?: 1;
		$per_page = (int) $request->get_param('per_page') ?: 5;
		$popular = $request->get_param('popular') ?? false;

		if ($popular) {
			$result = $this->faqsService->getPopularFaqs($per_page);
		} else {
			$result = $this->faqsService->getFaqs($page, $per_page);
		}

		return rest_ensure_response($result);
	}

	/**
	 * Get a FAQ by ID.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function getFaqById(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');
		$faq = $this->faqsService->getFaqById($id);

		if (!$faq) {
			return new WP_Error(
				'faq_not_found',
				__('[WPC-FAQ-001] FAQ not found', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 404)
			);
		}

		return rest_ensure_response($faq);
	}

	/**
	 * Get FAQs by page ID.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	public function getFaqsByPage(WP_REST_Request $request)
	{
		$page_id = (int)$request->get_param('page_id');
		$faqs = $this->faqsService->getFaqsByPage($page_id);
		return rest_ensure_response($faqs);
	}

	/**
	 * Create a new FAQ.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function createFaq(WP_REST_Request $request)
	{
		// Get current FAQ count - we need to get all FAQs to count them properly
		$currentFaqs = $this->faqsService->getFaqs(1, 999999); // Get all FAQs for accurate count
		$currentCount = isset($currentFaqs['faqs']) && is_array($currentFaqs['faqs']) ? count($currentFaqs['faqs']) : 0;

		// Use the centralized method for checking both feature and limits
		$entitlementCheck = $this->gateService->checkFeatureAndLimit(
			'wpchat.faqs',
			'wpchat.faqs.limit',
			$currentCount,
			'FAQ',
			'create'
		);
		
		if (is_wp_error($entitlementCheck)) {
			return $entitlementCheck;
		}

		$data = $request->get_json_params();

		try {
			$faqId = $this->faqsService->createFaq($data);
			if ($faqId) {
				return rest_ensure_response([
					'message' => __('FAQ created successfully.', 'smashballoon-wpchat-livechat-customer-support'),
					'status' => 201,
					'id' => $faqId,
				]);
			}
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_creation_failed',
				'[WPC-FAQ-002] ' . $e->getMessage(),
				array('status' => 400)
			);
		}

		return new WP_Error(
			'faq_creation_failed',
			__('[WPC-FAQ-002] Failed to create FAQ', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Update an existing FAQ.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function updateFaq(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');
		$data = $request->get_json_params();

		try {
			if ($this->faqsService->updateFaq($id, $data)) {
				return rest_ensure_response([
					'message' => __('FAQ updated successfully.', 'smashballoon-wpchat-livechat-customer-support'),
					'status' => 200,
				]);
			}
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_update_failed',
				'[WPC-FAQ-003] ' . $e->getMessage(),
				array('status' => 400)
			);
		}

		return new WP_Error(
			'faq_update_failed',
			__('[WPC-FAQ-003] Failed to update FAQ', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Delete a FAQ by ID.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function deleteFaq(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');

		try {
			if ($this->faqsService->deleteFaq($id)) {
				return rest_ensure_response([
					'message' => __('FAQ deleted successfully.', 'smashballoon-wpchat-livechat-customer-support'),
					'status' => 200,
				]);
			}
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_deletion_failed',
				'[WPC-FAQ-004] ' . $e->getMessage(),
				array('status' => 400)
			);
		}

		return new WP_Error(
			'faq_deletion_failed',
			__('[WPC-FAQ-004] Failed to delete FAQ', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Bulk delete FAQs.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function bulkDeleteFaqs(WP_REST_Request $request)
	{
		$data = $request->get_json_params();
		$ids = isset($data['ids']) ? $data['ids'] : [];

		// Sanitize IDs.
		$ids = array_map('intval', $ids);

		try {
			$deleted_count = $this->faqsService->bulkDeleteFaqs($ids);

			if ($deleted_count > 0) {
				return rest_ensure_response([
					'message' => sprintf(
					/* translators: %d: Number of FAQs deleted */
						_n(
							'%d FAQ deleted successfully.',
							'%d FAQs deleted successfully.',
							$deleted_count,
							'smashballoon-wpchat-livechat-customer-support'
						),
						$deleted_count
					),
					'count' => $deleted_count,
					'status' => 200,
				]);
			}
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_bulk_deletion_failed',
				'[WPC-FAQ-004] ' . $e->getMessage(),
				array('status' => 400)
			);
		}

		return new WP_Error(
			'faq_bulk_deletion_failed',
			__('[WPC-FAQ-004] Failed to delete FAQs', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Clone a FAQ.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function cloneFaq(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');

		// Get current FAQ count for accurate limit checking
		$currentFaqs = $this->faqsService->getFaqs(1, 999999); // Get all FAQs for accurate count
		$currentCount = isset($currentFaqs['faqs']) && is_array($currentFaqs['faqs']) ? count($currentFaqs['faqs']) : 0;

		// Use the centralized method for checking both feature and limits
		$entitlementCheck = $this->gateService->checkFeatureAndLimit(
			'wpchat.faqs',
			'wpchat.faqs.limit',
			$currentCount,
			'FAQ',
			'clone'
		);
		
		if (is_wp_error($entitlementCheck)) {
			return $entitlementCheck;
		}

		try {
			$clonedId = $this->faqsService->cloneFaq($id);

			if ($clonedId !== false) {
				return rest_ensure_response([
					'message' => __('FAQ cloned successfully.', 'smashballoon-wpchat-livechat-customer-support'),
					'status' => 201,
				]);
			}
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_cloning_failed',
				'[WPC-FAQ-005] ' . $e->getMessage(),
				array('status' => 400)
			);
		}

		return new WP_Error(
			'faq_cloning_failed',
			__('[WPC-FAQ-005] Failed to clone FAQ', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Search FAQs.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function searchFaqs(WP_REST_Request $request)
	{
		$query = $request->get_param('query');
		$limit = (int) $request->get_param('limit');
		$offset = (int) $request->get_param('offset');

		try {
			$results = $this->faqsService->searchFaqs($query, [
				'limit' => $limit,
				'offset' => $offset,
			]);

			return rest_ensure_response($results);
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_search_failed',
				$e->getMessage(),
				array('status' => 400)
			);
		}
	}

	/**
	 * Track a FAQ click.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function trackFaqClick(WP_REST_Request $request)
	{
		$faqId = (int) $request->get_param('faq_id');

		try {
			if ($this->faqsService->trackFaqClick($faqId)) {
				return rest_ensure_response([
					'message' => __('FAQ click tracked successfully.', 'smashballoon-wpchat-livechat-customer-support'),
					'faq_id' => $faqId,
					'status' => 200,
				]);
			}
		} catch (\InvalidArgumentException $e) {
			return new WP_Error(
				'faq_click_tracking_failed',
				$e->getMessage(),
				array('status' => 400)
			);
		}

		return new WP_Error(
			'faq_click_tracking_failed',
			__('Failed to track FAQ click.', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Define arguments for FAQ creation and update.
	 *
	 * @return array
	 */
	private function getFaqArgs()
	{
		return array(
			'question' => array(
				'type' => 'string',
				'required' => true,
				'description' => __('The question for the FAQ.', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'answer' => array(
				'type' => 'string',
				'required' => true,
				'description' => __('The answer for the FAQ.', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'priority' => array(
				'type' => 'integer',
				'required' => false,
				'description' => __('The priority of the FAQ (higher numbers appear first).', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'click_count' => array(
				'type' => 'integer',
				'required' => false,
				'description' => __('The number of times this FAQ has been viewed.', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'page_rules' => array(
				'type' => ['array', 'null'],
				'required' => false,
				'description' => __('The pages this FAQ should appear on.', 'smashballoon-wpchat-livechat-customer-support'),
				'validate_callback' => function ($param) {
					return $param === null || is_array($param);
				},
				'items' => array(
					'type' => 'integer',
					'description' => __('Page ID', 'smashballoon-wpchat-livechat-customer-support'),
				),
			),
			'image' => array(
				'type' => ['string', 'null'],
				'required' => false,
				'description' => __('The image URL for the FAQ.', 'smashballoon-wpchat-livechat-customer-support'),
				'format' => 'uri',
				'validate_callback' => function ($param) {
					if ($param === null || $param === '') {
						return true;
					}
					return filter_var($param, FILTER_VALIDATE_URL) !== false;
				},
			),
		);
	}
}
