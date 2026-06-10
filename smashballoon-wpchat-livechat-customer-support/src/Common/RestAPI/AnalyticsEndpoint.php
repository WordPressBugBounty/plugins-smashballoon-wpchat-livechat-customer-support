<?php

namespace SmashBalloon\WPChat\Common\RestAPI;

use SmashBalloon\WPChat\Common\RestAPI\RestEndpoint;
use SmashBalloon\WPChat\Common\Contracts\AnalyticsServiceInterface;
use SmashBalloon\WPChat\Common\Services\Analytics\EventLogger;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * REST API endpoint for analytics operations using the high-level AnalyticsService.
 * Provides simplified access to analytics functionality through a unified service.
 */
class AnalyticsEndpoint extends RestEndpoint
{
	/**
	 * The namespace of this endpoint.
	 *
	 * @var string
	 */
	protected $restBase = 'analytics';

	/**
	 * The analytics service instance.
	 *
	 * @var AnalyticsServiceInterface
	 */
	private AnalyticsServiceInterface $analyticsService;

	/**
	 * Constructor.
	 *
	 * @param AnalyticsServiceInterface $analyticsService The analytics service instance.
	 */
	public function __construct(AnalyticsServiceInterface $analyticsService)
	{
		$this->analyticsService = $analyticsService;
	}

	/**
	 * Register the routes for the analytics endpoint.
	 */
	protected function registerRoutesInner(): void
	{
		// Event logging endpoint
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/log',
			[
				[
					'methods' => \WP_REST_Server::CREATABLE,
					'callback' => [$this, 'logEvent'],
					'permission_callback' => [$this, 'checkPublicPermission'],
					'args' => $this->getLogEventArgs(),
				],
			]
		);

		// Batch event logging endpoint
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/batch',
			[
				[
					'methods' => \WP_REST_Server::CREATABLE,
					'callback' => [$this, 'logBatchEvents'],
					'permission_callback' => [$this, 'checkAnalyticsBatchPermission'],
					'args' => $this->getBatchEventArgs(),
				],
			]
		);

		// Simple data retrieval endpoints
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/overview',
			[
				[
					'methods' => \WP_REST_Server::READABLE,
					'callback' => [$this, 'getOverview'],
					'permission_callback' => [$this, 'checkPermission'],
					'args' => $this->getBasicTimeArgs(),
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/busy-times',
			[
				[
					'methods' => \WP_REST_Server::READABLE,
					'callback' => [$this, 'getBusyTimes'],
					'permission_callback' => [$this, 'checkPermission'],
					'args' => $this->getBasicTimeArgs(),
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/faq-analytics',
			[
				[
					'methods' => \WP_REST_Server::READABLE,
					'callback' => [$this, 'getFaqAnalytics'],
					'permission_callback' => [$this, 'checkPermission'],
					'args' => $this->getBasicTimeArgs(),
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/agent-performance',
			[
				[
					'methods' => \WP_REST_Server::READABLE,
					'callback' => [$this, 'getAgentPerformance'],
					'permission_callback' => [$this, 'checkPermission'],
					'args' => $this->getBasicTimeArgs(),
				],
			]
		);

		// Funnel analytics endpoints
		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/funnel-analytics',
			[
				[
					'methods' => \WP_REST_Server::READABLE,
					'callback' => [$this, 'getFunnelAnalytics'],
					'permission_callback' => [$this, 'checkPermission'],
					'args' => $this->getBasicTimeArgs(),
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->restBase . '/funnel-step-analysis/(?P<funnel_id>[a-zA-Z0-9\-_]+)',
			[
				[
					'methods' => \WP_REST_Server::READABLE,
					'callback' => [$this, 'getFunnelStepAnalysis'],
					'permission_callback' => [$this, 'checkPermission'],
					'args' => array_merge($this->getBasicTimeArgs(), [
						'funnel_id' => [
							'required' => true,
							'type' => 'string',
							'description' => __('The funnel ID to analyze', 'smashballoon-wpchat-livechat-customer-support'),
						],
					]),
				],
			]
		);

	}

	/**
	 * Log an event.
	 * Session ID and timestamp are handled automatically by EventLogger.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function logEvent(WP_REST_Request $request)
	{
		try {
			$eventType = $request->get_param('event_type');
			$eventData = $request->get_param('event_data') ?? [];

			// Optional context data for overriding automatic assignment.
			$contextData = $request->get_param('context') ?? [];

			$success = $this->analyticsService->logEvent(
				$eventType,
				$eventData,
				$contextData
			);

			if ($success) {
				return new WP_REST_Response([
					'success' => true,
					'message' => __('Event logged successfully', 'smashballoon-wpchat-livechat-customer-support'),
					'event_type' => $eventType,
				]);
			} else {
				return new WP_Error(
					'logging_failed',
					__('Failed to log event', 'smashballoon-wpchat-livechat-customer-support'),
					['status' => 500]
				);
			}
		} catch (\Exception $e) {
			return new WP_Error(
				'logging_error',
				$e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Log multiple events in a single batch request.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function logBatchEvents(WP_REST_Request $request)
	{
		try {
			$events = $request->get_param('events') ?? [];
			$contextData = $request->get_param('context') ?? [];

			if (empty($events) || !is_array($events)) {
				return new WP_Error(
					'invalid_batch',
					__('Events array is required and must not be empty', 'smashballoon-wpchat-livechat-customer-support'),
					['status' => 400]
				);
			}

			// Sanitize context data
			if (is_array($contextData)) {
				$contextData = array_map(function($value) {
					return is_string($value) ? sanitize_text_field($value) : $value;
				}, $contextData);
			}

			$successCount = 0;
			$errors = [];

			foreach ($events as $index => $event) {
				if (!isset($event['event_type']) || !isset($event['event_data'])) {
					// translators: %s is the event index number
					$errors[] = sprintf(__('Event {%s}: Missing event_type or event_data', 'smashballoon-wpchat-livechat-customer-support'), $index);
					continue;
				}

				// Sanitize event data before processing
				$eventType = sanitize_text_field($event['event_type']);
				$eventData = is_array($event['event_data']) ? array_map(function($value) {
					if (is_string($value)) {
						return sanitize_text_field($value);
					} elseif (is_int($value) || is_bool($value)) {
						return $value;
					} elseif (is_numeric($value)) {
						return (int)$value;
					}
					return '';
				}, $event['event_data']) : [];

				$eventContext = isset($event['context']) && is_array($event['context']) ? 
					array_map('sanitize_text_field', $event['context']) : [];

				$success = $this->analyticsService->logEvent(
					$eventType,
					$eventData,
					array_merge($contextData, $eventContext)
				);

				if ($success) {
					$successCount++;
				} else {
					// translators: %1$s is the event index number, %2$s is the event type
					$errors[] = sprintf(__('Event {%1$s}: Failed to log {%2$s}', 'smashballoon-wpchat-livechat-customer-support'), $index, $eventType);
				}
			}

			return new WP_REST_Response([
				'success' => true,
				// translators: %s is the number of successfully logged events
				'message' => sprintf(__('Batch processed: {%s} events logged successfully', 'smashballoon-wpchat-livechat-customer-support'), $successCount),
				'processed' => $successCount,
				'total' => count($events),
				'errors' => $errors,
			]);
		} catch (\Exception $e) {
			// Log error for monitoring but don't expose details
			if (defined('WP_DEBUG') && WP_DEBUG) {
				Logger::error('Analytics batch error: ' . $e->getMessage());
			}
			
			return new WP_Error(
				'batch_logging_error',
				__('An error occurred processing the batch', 'smashballoon-wpchat-livechat-customer-support'),
				['status' => 500]
			);
		}
	}

	/**
	 * Get overview statistics for the selected time range.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getOverview(WP_REST_Request $request)
	{
		try {
			$timeRange = $request->get_param('time_range') ?? 'this_month';
			$dates = $this->getSimpleDateRange($timeRange);

			$data = $this->analyticsService->getDashboardOverview(
				$this->getCurrentSiteId(),
				$dates['start_date'],
				$dates['end_date']
			);

			return new WP_REST_Response([
				'success' => true,
				'data' => $data,
				'time_range' => $timeRange,
			]);
		} catch (\Exception $e) {
			return new WP_Error(
				'query_error',
				$e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Get busy times analytics.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getBusyTimes(WP_REST_Request $request)
	{
		try {
			$timeRange = $request->get_param('time_range') ?? 'this_month';
			$dates = $this->getSimpleDateRange($timeRange);

			$data = $this->analyticsService->getBusyTimes(
				$this->getCurrentSiteId(),
				$dates['start_date'],
				$dates['end_date']
			);

			return new WP_REST_Response([
				'success' => true,
				'data' => $data,
				'time_range' => $timeRange,
			]);
		} catch (\Exception $e) {
			return new WP_Error(
				'query_error',
				$e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Get FAQ analytics.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getFaqAnalytics(WP_REST_Request $request)
	{
		try {
			$timeRange = $request->get_param('time_range') ?? 'this_month';
			$dates = $this->getSimpleDateRange($timeRange);

			$data = $this->analyticsService->getFaqAnalytics(
				$this->getCurrentSiteId(),
				$dates['start_date'],
				$dates['end_date']
			);

			return new WP_REST_Response([
				'success' => true,
				'data' => $data,
				'time_range' => $timeRange,
			]);
		} catch (\Exception $e) {
			return new WP_Error(
				'query_error',
				$e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Get agent performance metrics.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getAgentPerformance(WP_REST_Request $request)
	{
		try {
			$timeRange = $request->get_param('time_range') ?? 'this_month';
			$dates = $this->getSimpleDateRange($timeRange);

			$data = $this->analyticsService->getAgentPerformance(
				$this->getCurrentSiteId(),
				$dates['start_date'],
				$dates['end_date']
			);

			return new WP_REST_Response([
				'success' => true,
				'data' => $data,
				'time_range' => $timeRange,
			]);
		} catch (\Exception $e) {
			return new WP_Error(
				'query_error',
				$e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Get simple date range for time range parameter.
	 *
	 * @param string $timeRange Time range parameter.
	 * @return array Date range with start and end dates.
	 */
	private function getSimpleDateRange(string $timeRange): array
	{
		$boundaries = $this->analyticsService->getTimeRangeBoundaries($timeRange);

		return [
			'start_date' => $boundaries['start'],
			'end_date' => $boundaries['end'],
		];
	}

	/**
	 * Get current site ID.
	 *
	 * @return int Site ID.
	 */
	private function getCurrentSiteId(): int
	{
		return is_multisite() ? get_current_blog_id() : 1;
	}

	/**
	 * Get arguments for log event endpoint.
	 *
	 * @return array Argument configuration.
	 */
	private function getLogEventArgs(): array
	{
		return [
			'event_type' => [
				'required' => true,
				'type' => 'string',
				'description' => 'Type of event to log',
				'enum' => array_keys(EventLogger::EVENT_TYPES),
			],
			'event_data' => [
				'required' => false,
				'type' => 'object',
				'description' => 'Event data payload',
				'default' => [],
			],
			'context' => [
				'required' => false,
				'type' => 'object',
				'description' => 'Context data for event',
				'default' => [],
			],
		];
	}

	/**
	 * Get arguments for batch event endpoint.
	 *
	 * @return array Argument configuration.
	 */
	private function getBatchEventArgs(): array
	{
		return [
			'events' => [
				'required' => true,
				'type' => 'array',
				'description' => 'Array of events to log',
				'items' => [
					'type' => 'object',
					'properties' => [
						'event_type' => [
							'type' => 'string',
							'enum' => array_keys(EventLogger::EVENT_TYPES),
						],
						'event_data' => [
							'type' => 'object',
						],
						'context' => [
							'type' => 'object',
						],
					],
				],
			],
			'context' => [
				'required' => false,
				'type' => 'object',
				'description' => 'Global context data for all events',
				'default' => [],
			],
		];
	}

	/**
	 * Get basic time range arguments.
	 *
	 * @return array Argument configuration.
	 */
	private function getBasicTimeArgs(): array
	{
		return [
			'time_range' => [
				'required' => false,
				'type' => 'string',
				'description' => 'Time range for analytics',
				'enum' => ['today', 'this_week', 'this_month', 'last_month'],
				'default' => 'this_month',
			],
		];
	}

	/**
	 * Get funnel analytics data.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getFunnelAnalytics(WP_REST_Request $request)
	{
		try {
			$timeRange = $request->get_param('time_range') ?? 'this_month';
			$dates = $this->getSimpleDateRange($timeRange);

			$data = $this->analyticsService->getFunnelAnalytics(
				$this->getCurrentSiteId(),
				$dates['start_date'],
				$dates['end_date']
			);

			return new WP_REST_Response([
				'success' => true,
				'data' => $data,
				'time_range' => $timeRange,
			], 200);

		} catch (\Exception $e) {
			return new WP_Error(
				'funnel_analytics_error',
				'Failed to retrieve funnel analytics: ' . $e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Get detailed step analysis for a specific funnel.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function getFunnelStepAnalysis(WP_REST_Request $request)
	{
		try {
			$funnelId = $request->get_param('funnel_id');
			$timeRange = $request->get_param('time_range') ?? 'this_month';
			$dates = $this->getSimpleDateRange($timeRange);

			if (empty($funnelId)) {
				return new WP_Error(
					'missing_funnel_id',
					'Funnel ID is required',
					['status' => 400]
				);
			}

			$data = $this->analyticsService->getFunnelStepAnalysis(
				$this->getCurrentSiteId(),
				$funnelId,
				$dates['start_date'],
				$dates['end_date']
			);

			return new WP_REST_Response([
				'success' => true,
				'data' => $data,
				'time_range' => $timeRange,
			], 200);

		} catch (\Exception $e) {
			return new WP_Error(
				'funnel_step_analysis_error',
				'Failed to retrieve funnel step analysis: ' . $e->getMessage(),
				['status' => 500]
			);
		}
	}

	/**
	 * Check permission for analytics batch endpoint using session validation.
	 * This provides security without requiring nonce in the request headers.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool|WP_Error Returns true if allowed, otherwise returns a WP_Error.
	 */
	public function checkAnalyticsBatchPermission(WP_REST_Request $request)
	{
		// First try standard nonce verification for normal requests
		$nonce = $request->get_header('X-WP-Nonce') ?? $request->get_param('nonce');
		if ($nonce) {
			if (wp_verify_nonce($nonce, 'wp_rest') || wp_verify_nonce($nonce, 'wpchat_frontend')) {
				return true;
			}
		}
		
		// For sendBeacon requests, validate using session/cookie
		$sessionId = isset($_COOKIE['wpchat_session_id']) ? sanitize_text_field(wp_unslash($_COOKIE['wpchat_session_id'])) : null;
		$guestId = isset($_COOKIE['wpchat_guest_id']) ? sanitize_text_field(wp_unslash($_COOKIE['wpchat_guest_id'])) : null;
		
		if (!$sessionId && !$guestId) {
			return new WP_Error(
				'no_session',
				'No valid session found',
				['status' => 403]
			);
		}
		
		// Validate session exists and apply rate limiting
		if ($sessionId) {
			$sessionKey = 'wpchat_session_' . substr(md5($sessionId), 0, 16);
			$sessionData = get_transient($sessionKey);
			
			if (!$sessionData) {
				// Create new session entry for valid session IDs
				set_transient($sessionKey, [
					'created' => time(),
					'ip' => $this->getClientIp(),
					'requests' => 1
				], DAY_IN_SECONDS);
			} else {
				// Check if session is from same IP (with some flexibility for mobile networks)
				$currentIp = $this->getClientIp();
				if ($sessionData['ip'] !== $currentIp) {
					// Allow if IPs are in same /24 subnet (for mobile networks)
					$sessionIpParts = explode('.', $sessionData['ip']);
					$currentIpParts = explode('.', $currentIp);
					
					if (count($sessionIpParts) === 4 && count($currentIpParts) === 4) {
						// Check if first 3 octets match (same /24 subnet)
						if ($sessionIpParts[0] !== $currentIpParts[0] ||
							$sessionIpParts[1] !== $currentIpParts[1] ||
							$sessionIpParts[2] !== $currentIpParts[2]) {
							return new WP_Error(
								'session_mismatch',
								'Session IP mismatch',
								['status' => 403]
							);
						}
					}
				}
				
				// Rate limiting per session (100 requests per day)
				if (($sessionData['requests'] ?? 0) > 100) {
					return new WP_Error(
						'session_rate_limit',
						'Session rate limit exceeded',
						['status' => 429]
					);
				}
				
				// Update request count
				$sessionData['requests'] = ($sessionData['requests'] ?? 0) + 1;
				set_transient($sessionKey, $sessionData, DAY_IN_SECONDS);
			}
		}
		
		// Additional validations for the events
		$events = $request->get_param('events');
		
		// Validate events structure and limit
		if (!is_array($events)) {
			return new WP_Error(
				'invalid_events',
				'Events must be an array',
				['status' => 400]
			);
		}
		
		if (count($events) > 25) { // Allow up to 25 events in batch
			return new WP_Error(
				'too_many_events',
				'Too many events in batch (max 25)',
				['status' => 400]
			);
		}
		
		// Validate each event has required structure
		foreach ($events as $event) {
			if (!isset($event['event_type']) || !isset($event['event_data'])) {
				return new WP_Error(
					'malformed_event',
					'Event missing required fields',
					['status' => 400]
				);
			}
			
			// Validate event_type is a string and not too long
			if (!is_string($event['event_type']) || strlen($event['event_type']) > 50) {
				return new WP_Error(
					'invalid_event_type',
					'Invalid event type format',
					['status' => 400]
				);
			}
			
			// Ensure event_data is an array and not too large
			if (!is_array($event['event_data']) || count($event['event_data']) > 30) {
				return new WP_Error(
					'invalid_event_data',
					'Invalid event data',
					['status' => 400]
				);
			}
		}
		
		return true;
	}

	/**
	 * Get client IP address, considering proxies.
	 *
	 * @return string The client IP address.
	 */
	private function getClientIp(): string
	{
		// Check for Cloudflare
		if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
			$ip = sanitize_text_field(wp_unslash($_SERVER['HTTP_CF_CONNECTING_IP']));
		}
		// Check for other proxies
		elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
			$ips = explode(',', sanitize_text_field(wp_unslash($_SERVER['HTTP_X_FORWARDED_FOR'])));
			$ip = trim($ips[0]);
		}
		elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
			$ip = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_REAL_IP']));
		}
		else {
			$ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '0.0.0.0';
		}
		
		// Validate IP
		if (filter_var($ip, FILTER_VALIDATE_IP)) {
			return $ip;
		}
		
		return '0.0.0.0';
	}

}
