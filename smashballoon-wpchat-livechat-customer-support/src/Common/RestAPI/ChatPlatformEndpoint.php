<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\Platforms\PlatformFactory;
use SmashBalloon\WPChat\Common\Services\Database\AgentRoutingService;
use SmashBalloon\WPChat\Common\Services\SettingsService;
use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;
use SmashBalloon\WPChat\Common\Contracts\AnalyticsServiceInterface;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Class ChatPlatformEndpoint
 * Handles platform selection and redirection.
 *
 * @package SmashBalloon\WPChat\Common\RestAPI
 */
class ChatPlatformEndpoint extends RestEndpoint
{
	/**
	 * The namespace of this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'chatbot';

	/**
	 * The platform factory.
	 *
	 * @var PlatformFactory
	 */
	private PlatformFactory $platformFactory;

	/**
	 * The agent routing service.
	 *
	 * @var AgentRoutingService
	 */
	private AgentRoutingService $agentRoutingService;

	/**
	 * The settings service.
	 *
	 * @var SettingsService
	 */
	private SettingsService $settingsService;

	/**
	 * Analytics service for tracking events.
	 *
	 * @var AnalyticsServiceInterface|null
	 */
	private ?AnalyticsServiceInterface $analyticsService;

	/**
	 * Constructor.
	 *
	 * @param PlatformFactory                $platformFactory     The platform factory.
	 * @param AgentRoutingService            $agentRoutingService The agent routing service.
	 * @param SettingsService                $settingsService     The settings service.
	 * @param AnalyticsServiceInterface|null $analyticsService   The analytics service.
	 */
	public function __construct(
		PlatformFactory $platformFactory,
		AgentRoutingService $agentRoutingService,
		SettingsService $settingsService,
		?AnalyticsServiceInterface $analyticsService = null
	) {
		$this->platformFactory = $platformFactory;
		$this->agentRoutingService = $agentRoutingService;
		$this->settingsService = $settingsService;
		$this->analyticsService = $analyticsService;
	}

	/**
	 * Register the routes for the chatbot endpoint.
	 *
	 * @return void
	 */
	protected function registerRoutesInner(): void
	{
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase,
			array(
				array(
					'methods'             => array(\WP_REST_Server::EDITABLE, \WP_REST_Server::CREATABLE), // POST.
					'callback'            => array($this, 'getPlatformRedirection'),
					'permission_callback' => array($this, 'checkPublicPermission'),
					'args'                => $this->getChatbotArgs(),
				),
			)
		);

		// Register available platforms endpoint
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/available-platforms',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE, // GET.
					'callback'            => array($this, 'getAvailablePlatforms'),
					'permission_callback' => array($this, 'checkPublicPermission'),
				),
			)
		);
	}

	/**
	 * Get available platforms that have at least one agent configured.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function getAvailablePlatforms()
	{
		try {
			// Get available platforms from routing service (platforms that have agents)
			$agentPlatforms = $this->agentRoutingService->getAvailablePlatforms();

			// Get settings to filter by enabled platforms
			$settings = $this->settingsService->getAllSettings();
			$enabledPlatforms = $settings['agentSettings']['platforms'] ?? [
				'whatsapp' => ['enabled' => true, 'value' => ''],
				'telegram' => ['enabled' => true, 'value' => ''],
				'instagram' => ['enabled' => true, 'value' => ''],
				'messenger' => ['enabled' => true, 'value' => ''],
			];

			// Filter to only include platforms that are both:
			// 1. Enabled in global settings (new format: ['enabled' => bool, 'value' => string])
			// 2. Configured on at least one agent
			$availablePlatforms = array_filter($agentPlatforms, function($platform) use ($enabledPlatforms) {
				return isset($enabledPlatforms[$platform]['enabled']) && $enabledPlatforms[$platform]['enabled'] === true;
			});

			return rest_ensure_response([
				'success' => true,
				'platforms' => array_values($availablePlatforms), // Re-index array
				'count' => count($availablePlatforms)
			]);
		} catch (\Exception $e) {
			return new WP_Error(
				'platform_check_failed',
				__('[WPC-NET-003] Failed to check platform availability', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 500)
			);
		}
	}

	/**
	 * Get platform redirection link.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function getPlatformRedirection(WP_REST_Request $request)
	{
		$platform = sanitize_text_field($request->get_param('platform'));
		$customText = sanitize_text_field($request->get_param('customText'));
		$pdfFile = esc_url_raw($request->get_param('pdfFile'));
		$source = sanitize_text_field($request->get_param('source')) ?: 'chat';
		$funnelId = $request->get_param('funnel_id') ? sanitize_text_field($request->get_param('funnel_id')) : null;

		$platformInstance = $this->platformFactory->create($platform);
		if ($platformInstance === null) {
			return new WP_Error(
				'invalid_platform',
				__('Unsupported platform specified.', 'smashballoon-wpchat-livechat-customer-support'),
				array('status' => 400)
			);
		}

		try {
			$response = $this->getAgentRedirection($platformInstance, $platform, $customText, $pdfFile);

			// Track successful platform redirect and agent assignment with source and funnel_id
			$this->trackAnalyticsEvents($platform, $response, $source, $funnelId);

			return rest_ensure_response($response);
		} catch (\Exception $e) {
			// Track both failed platform redirect and agent assignment with source and funnel_id
			$this->trackFailedAnalyticsEvents($platform, $e, $source, $funnelId);

			// Try to decode JSON error data for structured responses
			$errorData = json_decode($e->getMessage(), true);

			if (json_last_error() === JSON_ERROR_NONE && is_array($errorData)) {
				// Structured error response (like off-hours info)
				return new WP_Error(
					$errorData['error_type'],
					$errorData['message'],
					array(
						'status' => 503,
						'data' => $errorData
					)
				);
			}

			// Simple error message
			return new WP_Error(
				'exception',
				__('An error occurred: ', 'smashballoon-wpchat-livechat-customer-support') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Get redirection response data.
	 *
	 * @param ChatPlatformInterface $platformInstance The platform instance.
	 * @param string                $platform        The platform name.
	 * @param string|null           $customText      The custom text.
	 * @param string|null           $pdfFile         The PDF file URL.
	 * @return array The response data.
	 * @throws \Exception If redirection link cannot be generated.
	 */
	private function getAgentRedirection(
		ChatPlatformInterface $platformInstance,
		string $platform,
		?string $customText,
		?string $pdfFile
	): array {
		// Use optimized availability check (single database query)
		$availability = $this->agentRoutingService->checkAgentAvailability($platform);
		$agentId = $availability['agent_id'];

		if (!$agentId) {
			// Handle different unavailability scenarios
			switch ($availability['status']) {
				case 'off_hours':
					// Off-hours scenario with timing info
					throw new \Exception(json_encode([
						'error_type' => 'agents_offline_off_hours',
						'message' => __('Agents are currently offline.', 'smashballoon-wpchat-livechat-customer-support'),
						'off_hours_data' => $availability['off_hours_info'] ?? null
					]));

				case 'no_platform_agents':
					// Agents exist but none have this platform
					$platformName = ucfirst($platform);
					throw new \Exception(esc_html(
						sprintf(
							__('[WPC-AGT-005] No agents available for %s. Please try another platform or contact us later.', 'smashballoon-wpchat-livechat-customer-support'),
							$platformName
						)
					));

				case 'no_agents':
				default:
					// No agents available at all
					throw new \Exception(esc_html(__('[WPC-AGT-006] No agents are currently available. Please try again later.', 'smashballoon-wpchat-livechat-customer-support')));
			}
		}

		$platformNumber = $this->getAgentPlatformNumber($agentId, $platform);
		$agentInfo = $this->getAgentInfo($agentId);

		if (!$platformNumber || !$agentInfo) {
			// This shouldn't happen now with platform filtering, but keep as safety check
			throw new \Exception(esc_html(__('[WPC-SYS-004] System configuration error. Please contact support.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		$redirectionLink = $platformInstance->getRedirectionLink($customText, $pdfFile, $platformNumber);
		if (empty($redirectionLink)) {
			throw new \Exception(esc_html(__('Unable to generate redirection link for the assigned agent.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		return array_merge([
			'link'     => $redirectionLink,
			'success'  => true,
			'agent_id' => $agentId,
			'phone_number' => $platformNumber,
		], $agentInfo ?? []);
	}

	/**
	 * Get agent info excluding ID, platforms, and status.
	 *
	 * @param int $agentId The agent ID.
	 * @return array|null The agent info without ID, platforms, and status, or null if not found or invalid.
	 */
	private function getAgentInfo(int $agentId): ?array
	{
		$agent = $this->agentRoutingService->getAgentById($agentId);

		// Check if agent is a non-empty array
		if (!is_array($agent) || empty($agent)) {
			return null;
		}

		// Remove keys only if they exist to avoid warnings
		foreach (['id', 'platforms', 'status'] as $key) {
			if (array_key_exists($key, $agent)) {
				unset($agent[$key]);
			}
		}


		return $agent;
	}


	/**
	 * Get agent's platform number.
	 *
	 * @param int    $agentId  The agent ID.
	 * @param string $platform The platform name.
	 * @return string|null The platform number or null if not found.
	 */
	private function getAgentPlatformNumber(int $agentId, string $platform): ?string
	{
		$agent = $this->agentRoutingService->getAgentById($agentId);
		if (!$agent || empty($agent['platforms'])) {
			return null;
		}

		$platformKey = strtolower($platform);
		return $agent['platforms'][$platformKey] ?? null;
	}

	/**
	 * Get the endpoint arguments for item schema.
	 *
	 * @return array
	 */
	protected function getChatbotArgs(): array
	{
		return [
			'platform' => [
				'required' => true,
				'type' => 'string',
				'validate_callback' => function ($param) {
					return in_array($param, ['whatsapp', 'telegram', 'messenger', 'instagram'], true);
				},
				'description' => __('The platform to redirect to (e.g., whatsapp, telegram, messenger, instagram).', 'smashballoon-wpchat-livechat-customer-support'),
			],
			'customText' => [
				'required' => false,
				'type' => 'string',
				'description' => __('Custom text to include in the redirection link.', 'smashballoon-wpchat-livechat-customer-support'),
			],
			'pdfFile' => [
				'required' => false,
				'type' => 'string',
				'validate_callback' => function ($param) {
					// Allow empty string or valid URL
					return empty($param) || filter_var($param, FILTER_VALIDATE_URL) !== false;
				},
				'description' => __('URL of a PDF file to include in the redirection link.', 'smashballoon-wpchat-livechat-customer-support'),
			],
			'source' => [
				'required' => false,
				'type' => 'string',
				'default' => 'chat',
				'enum' => ['chat', 'funnel'],
				'description' => __('Source of the redirect request (chat or funnel).', 'smashballoon-wpchat-livechat-customer-support'),
			],
			'funnel_id' => [
				'required' => false,
				'type' => 'string',
				'description' => __('Funnel ID if the source is funnel.', 'smashballoon-wpchat-livechat-customer-support'),
			],
			'nonce' => [
				'required' => true,
				'type' => 'string',
				'description' => __('Nonce for security.', 'smashballoon-wpchat-livechat-customer-support'),
			],
		];
	}

	/**
	 * Track successful analytics events for platform redirect and agent assignment.
	 *
	 * @param string $platform The platform name.
	 * @param array $response The successful response data.
	 * @param string $source The source of the redirect (chat or funnel).
	 * @param string|null $funnelId The funnel ID if source is funnel.
	 */
	private function trackAnalyticsEvents(string $platform, array $response, string $source = 'chat', ?string $funnelId = null): void
	{
		if (!$this->analyticsService) {
			return;
		}

		$agentId = $response['agent_id'] ?? '';
		$agentName = $response['agent_name'] ?? '';

		// Build event data
		$eventData = [
			'platform' => $platform,
			'agent_id' => $agentId,
			'agent_name' => $agentName,
			'source' => $source,
			'status' => 'success',
		];
		
		// Add funnel_id if source is funnel
		if ($source === 'funnel' && $funnelId) {
			$eventData['funnel_id'] = $funnelId;
		}

		// Track platform redirect
		$this->analyticsService->logEvent('REDIRECT_TO_PLATFORM', $eventData);

		// Track successful agent assignment with same data
		$eventData['status'] = 'assigned';
		$this->analyticsService->logEvent('AGENT_ASSIGNMENT', $eventData);
	}

	/**
	 * Track both failed platform redirect and agent assignment events efficiently.
	 *
	 * @param string     $platform The platform name.
	 * @param \Exception $exception The exception that occurred.
	 * @param string $source The source of the redirect (chat or funnel).
	 * @param string|null $funnelId The funnel ID if source is funnel.
	 */
	private function trackFailedAnalyticsEvents(string $platform, \Exception $exception, string $source = 'chat', ?string $funnelId = null): void
	{
		if (!$this->analyticsService) {
			return;
		}

		// Parse error data if it's JSON
		$errorData = json_decode($exception->getMessage(), true);
		$errorType = 'general_error';
		$errorMessage = $exception->getMessage();

		if (json_last_error() === JSON_ERROR_NONE && is_array($errorData)) {
			$errorType = $errorData['error_type'] === 'agents_offline_off_hours' ? 'off_hours' : 'general_error';
		}

		// Build event data for redirect
		$redirectData = [
			'platform' => $platform,
			'source' => $source,
			'status' => 'failed',
		];
		
		// Build event data for assignment
		$assignmentData = [
			'platform' => $platform,
			'source' => $source,
			'error' => $errorMessage,
			'error_type' => $errorType,
			'status' => 'error',
		];
		
		// Add funnel_id if source is funnel
		if ($source === 'funnel' && $funnelId) {
			$redirectData['funnel_id'] = $funnelId;
			$assignmentData['funnel_id'] = $funnelId;
		}

		// Track failed platform redirect
		$this->analyticsService->logEvent('REDIRECT_TO_PLATFORM', $redirectData);

		// Track failed agent assignment
		$this->analyticsService->logEvent('AGENT_ASSIGNMENT', $assignmentData);
	}
}
