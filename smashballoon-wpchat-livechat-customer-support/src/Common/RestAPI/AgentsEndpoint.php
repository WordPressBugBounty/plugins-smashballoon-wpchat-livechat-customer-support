<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Contracts\AgentsServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\GateInterface;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class AgentsEndpoint
 * Handles CRUD operations for agents and their schedules.
 */
class AgentsEndpoint extends RestEndpoint
{
	/**
	 * The route base for this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'agents';

	/**
	 * The agents service instance (Free or Pro).
	 *
	 * @var AgentsServiceInterface
	 */
	private AgentsServiceInterface $agentsService;

	/**
	 * The gate service for entitlement checks.
	 *
	 * @var GateInterface
	 */
	private GateInterface $gateService;

	/**
	 * Constructor.
	 *
	 * @param AgentsServiceInterface $agentsService The agents service.
	 * @param GateInterface          $gateService The gate service.
	 */
	public function __construct(AgentsServiceInterface $agentsService, GateInterface $gateService)
	{
		$this->agentsService = $agentsService;
		$this->gateService = $gateService;
	}

	/**
	 * Register the routes for the agents endpoint.
	 */
	protected function registerRoutesInner()
	{
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase,
			array(
				array(
					'methods' => WP_REST_Server::READABLE, // GET.
					'callback' => array($this, 'getAllAgents'),
					'permission_callback' => array($this, 'checkPermission'),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE, // POST.
					'callback' => array($this, 'createAgent'),
					'permission_callback' => array($this, 'checkPermission'),
					'args' => $this->getAgentArgs(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/(?P<id>\d+)',
			array(
				array(
					'methods' => WP_REST_Server::READABLE, // GET.
					'callback' => array($this, 'getAgentById'),
					'permission_callback' => array($this, 'checkPermission'),
				),
				array(
					'methods' => WP_REST_Server::EDITABLE, // PUT.
					'callback' => array($this, 'updateAgent'),
					'permission_callback' => array($this, 'checkPermission'),
					'args' => $this->getAgentArgs(),
				),
				array(
					'methods' => WP_REST_Server::DELETABLE, // DELETE.
					'callback' => array($this, 'deleteAgent'),
					'permission_callback' => array($this, 'checkPermission'),
				),
			)
		);
	}

	/**
	 * Get all agents.
	 *
	 * @return WP_REST_Response
	 */
	public function getAllAgents()
	{
		$agents = $this->agentsService->getAllAgents();
		return rest_ensure_response($agents);
	}

	/**
	 * Get an agent by ID.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function getAgentById(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');
		$agent = $this->agentsService->findAgentById($id);

		if (!$agent) {
			return new WP_Error(
				'agent_not_found',
				__('[WPC-AGT-001] Agent not found', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 404)
			);
		}

		return rest_ensure_response($agent);
	}

	/**
	 * Create a new agent.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function createAgent(WP_REST_Request $request)
	{
		$data = $request->get_json_params();
		$data = $this->sanitizeAgentData($data);

		// Check agent limit before creating using centralized gating
		$currentAgents = $this->agentsService->getAllAgents();
		$currentCount = is_array($currentAgents) ? count($currentAgents) : 0;

		$limitCheck = $this->gateService->checkLimit('wpchat.agents.limit', $currentCount, 'Agent', 'create');
		if (is_wp_error($limitCheck)) {
			return $limitCheck;
		}

		$agentId = $this->agentsService->addAgent($data);
		if ($agentId) {
			return rest_ensure_response([
				'message' => __('Agent created successfully.', 'smashballoon-wpchat-livechat-customer-support'),
				'status' => 201,
				'id' => $agentId,
			]);
		}

		return new WP_Error(
			'agent_creation_failed',
			__('[WPC-AGT-002] Failed to create agent', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Update an existing agent.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function updateAgent(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');
		$data = $request->get_json_params();

		$data = $this->sanitizeAgentData($data);
		$data['id'] = $id;

		$agentId = $this->agentsService->addAgent($data);
		if ($agentId) {
			return rest_ensure_response([
				'message' => __('Agent updated successfully.', 'smashballoon-wpchat-livechat-customer-support'),
				'status' => 200,
				'id' => $agentId,
			]);
		}

		return new WP_Error(
			'agent_update_failed',
			__('[WPC-AGT-003] Failed to update agent', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Delete an agent by ID.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function deleteAgent(WP_REST_Request $request)
	{
		$id = (int)$request->get_param('id');

		if ($this->agentsService->removeAgent($id)) {
			return rest_ensure_response([
				'message' => __('Agent deleted successfully.', 'smashballoon-wpchat-livechat-customer-support'),
				'status' => 200,
			]);
		}

		return new WP_Error(
			'agent_deletion_failed',
			__('[WPC-AGT-004] Failed to delete agent', 'smashballoon-wpchat-livechat-customer-support'),
			array('status' => 500)
		);
	}

	/**
	 * Sanitize agent data.
	 *
	 * @param array $data The agent data.
	 * @return array The sanitized data.
	 */
	private function sanitizeAgentData(array $data)
	{
		// Normalize schedule to an array if it is an object.
		if (isset($data['schedule']) && is_object($data['schedule'])) {
			$data['schedule'] = array($data['schedule']);
		}

		if (!empty($data['schedule']) && is_array($data['schedule'])) {
			array_walk_recursive($data['schedule'], function (&$value) {
				$value = sanitize_text_field($value);
			});
		}

		$platforms = [];
		if (!empty($data['platforms']) && is_array($data['platforms'])) {
			foreach ($data['platforms'] as $platform => $value) {
				$platforms[sanitize_text_field($platform)] = sanitize_text_field($value);
			}
		}

		return array(
			'name' => sanitize_text_field($data['name'] ?? ''),
			'platforms' => $platforms,
			'status' => (int)($data['status'] ?? 1),
			'avatar' => esc_url_raw($data['avatar'] ?? ''),
			'schedule' => $data['schedule'] ?? [],
		);
	}

	/**
	 * Define arguments for agent creation and update.
	 *
	 * @return array
	 */
	private function getAgentArgs()
	{
		return array(
			'name' => array(
				'type' => 'string',
				'required' => true,
				'description' => __('The name of the agent.', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'platforms' => array(
				'type' => 'object',
				'required' => false,
				'description' => __('The platforms the agent is available on.', 'smashballoon-wpchat-livechat-customer-support'),
				'validate_callback' => function ($param) {
					return is_array($param) || is_object($param);
				},
				'properties' => array(
					'whatsapp' => array(
						'type' => 'string',
						'description' => __('WhatsApp phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'telegram' => array(
						'type' => 'string',
						'description' => __('Telegram phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'instagram' => array(
						'type' => 'string',
						'description' => __('Instagram phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'phone' => array(
						'type' => 'string',
						'description' => __('Regular phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'messenger' => array(
						'type' => 'string',
						'description' => __('Messenger phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'message' => array(
						'type' => 'string',
						'description' => __('iMessage phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
					'facetime' => array(
						'type' => 'string',
						'description' => __('FaceTime phone number.', 'smashballoon-wpchat-livechat-customer-support'),
					),
				),
			),
			'status' => array(
				'type' => 'integer',
				'required' => false,
				'description' => __('The status of the agent.', 'smashballoon-wpchat-livechat-customer-support'),
			),
			'avatar' => array(
				'type' => 'string',
				'required' => false,
				'description' => __('The profile picture URL of the agent.', 'smashballoon-wpchat-livechat-customer-support'),
				'format' => 'uri',
			),
			'schedule' => array(
				'type' => array('array', 'object'),
				'required' => false,
				'description' => __('The schedule of the agent.', 'smashballoon-wpchat-livechat-customer-support'),
				'validate_callback' => function ($param, $request, $key) {
					return is_array($param) || is_object($param);
				},
				'items' => array(
					'type' => 'object',
					'properties' => array(
						'days_of_week' => array(
							'type' => 'string',
							'description' => __('Days of the week for the schedule.', 'smashballoon-wpchat-livechat-customer-support'),
						),
						'start_time' => array(
							'type' => 'string',
							'description' => __('Start time for the schedule.', 'smashballoon-wpchat-livechat-customer-support'),
						),
						'end_time' => array(
							'type' => 'string',
							'description' => __('End time for the schedule.', 'smashballoon-wpchat-livechat-customer-support'),
						),
					),
				),
			),

		);
	}
}
