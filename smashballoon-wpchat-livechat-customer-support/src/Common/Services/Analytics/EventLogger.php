<?php

namespace SmashBalloon\WPChat\Common\Services\Analytics;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use wpdb;

/**
 * Low-level service for logging events directly to the granular analytics table.
 * This service logs events immediately to the wpchat_analytics table and handles
 * session/user management, data filtering, and basic data sanitization.
 */
class EventLogger
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	private wpdb $wpdb;

	/**
	 * Analytics table name.
	 *
	 * @var string
	 */
	private string $tableName;

	/**
	 * Cookie name for guest ID.
	 *
	 * @var string
	 */
	private const GUEST_ID_COOKIE = 'wpchat_guest_id';

	/**
	 * Cookie name for session ID.
	 *
	 * @var string
	 */
	private const SESSION_ID_COOKIE = 'wpchat_session_id';

	/**
	 * Cookie expiration time (30 days).
	 *
	 * @var int
	 */
	private const COOKIE_EXPIRY = 2592000;

	/**
	 * Session cookie expiration time (24 hours).
	 *
	 * @var int
	 */
	private const SESSION_COOKIE_EXPIRY = 86400;

	/**
	 * Event types for the analytics system.
	 * Focused on trackable user interactions before redirect to external platforms.
	 */
	public const EVENT_TYPES = [
		// User interaction events
		'BOT_OPEN' => 'bot_open',
		'BOT_CLOSE' => 'bot_close',
		'MESSAGE_SEND' => 'message_send',
		'NAVIGATION' => 'navigation',

		// FAQ interaction events
		'FAQ_CLICK' => 'faq_click',
		'FAQ_SEARCH' => 'faq_search',
		'FAQ_SEARCH_APPEARANCE' => 'faq_search_appearance',
		'FAQ_HELPFUL' => 'faq_helpful',
		'FAQ_NOT_HELPFUL' => 'faq_not_helpful',

		// Conversion events
		'REDIRECT_TO_PLATFORM' => 'redirect_to_platform',

		// Agent assignment events
		'AGENT_ASSIGNMENT' => 'agent_assignment',

		// Funnel events
		'FUNNEL_STEP' => 'funnel_step',
		'FUNNEL_COMPLETE' => 'funnel_complete',
		'FUNNEL_ABANDON' => 'funnel_abandon',
	];

	/**
	 * Current session ID.
	 *
	 * @var string|null
	 */
	private ?string $sessionId = null;

	/**
	 * Cached sequence number for navigation events.
	 *
	 * @var int
	 */
	private int $navigationSequenceNumber = 0;

	/**
	 * Constructor.
	 *
	 * @param wpdb $wpdb WordPress database instance.
	 */
	public function __construct(wpdb $wpdb)
	{
		$this->wpdb = $wpdb;
		$this->tableName = $wpdb->prefix . 'wpchat_analytics';
		$this->initializeSession();
	}

	/**
	 * Initialize session ID for the current user session.
	 */
	private function initializeSession(): void
	{
		// Get existing session ID or create new one
		$existingSessionId = isset($_COOKIE[self::SESSION_ID_COOKIE]) ? sanitize_text_field($_COOKIE[self::SESSION_ID_COOKIE]) : null;

		if (!$existingSessionId) {
			$this->sessionId = wp_generate_uuid4();
			$this->setSessionCookie($this->sessionId);
			$this->resetNavigationSequenceCache();
		} else {
			$this->sessionId = $existingSessionId;
		}
	}

	/**
	 * Set session cookie.
	 *
	 * @param string $sessionId The session ID.
	 */
	private function setSessionCookie(string $sessionId): void
	{
		if (!headers_sent()) {
			setcookie(
				self::SESSION_ID_COOKIE,
				$sessionId,
				[
					'expires' => time() + self::SESSION_COOKIE_EXPIRY,
					'path' => COOKIEPATH,
					'domain' => COOKIE_DOMAIN,
					'secure' => is_ssl(),
					'httponly' => true,
					'samesite' => 'Strict'
				]
			);
		}
	}

	/**
	 * Get user ID (guest ID or WordPress user ID).
	 *
	 * @return string User ID.
	 */
	private function getUserId(): string
	{
		// Check if user is logged in
		if (is_user_logged_in()) {
			return 'user_' . get_current_user_id();
		}

		// Get or create guest ID
		$guestId = isset($_COOKIE[self::GUEST_ID_COOKIE]) ? sanitize_text_field($_COOKIE[self::GUEST_ID_COOKIE]) : null;
		if (!$guestId) {
			$guestId = 'guest_' . wp_generate_uuid4();
			if (!headers_sent()) {
				setcookie(
					self::GUEST_ID_COOKIE,
					$guestId,
					[
						'expires' => time() + self::COOKIE_EXPIRY,
						'path' => COOKIEPATH,
						'domain' => COOKIE_DOMAIN,
						'secure' => is_ssl(),
						'httponly' => true,
						'samesite' => 'Strict'
					]
				);
			}
		}

		return $guestId;
	}

	/**
	 * Get current site ID.
	 *
	 * @return int Site ID.
	 */
	private function getSiteId(): int
	{
		return is_multisite() ? get_current_blog_id() : 1;
	}

	/**
	 * Log an event to the analytics system.
	 *
	 * This is the core method for logging events. It handles:
	 * - Event type validation
	 * - Data filtering and sanitization
	 * - User/session ID management
	 * - Direct database insertion
	 *
	 * @param string $eventType   The type of event (must be a key in EVENT_TYPES).
	 * @param array  $data        The event data (will be filtered based on event type).
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logEvent(string $eventType, array $data = [], array $contextData = []): bool
	{
		// Only allow valid event types to prevent system events from polluting analytics
		if (!isset(self::EVENT_TYPES[$eventType])) {
			Logger::error("WPChat Analytics: Invalid event type '{$eventType}' - only user-facing events are allowed");
			return false;
		}

		$eventTypeValue = self::EVENT_TYPES[$eventType];

		// Use provided context data or fall back to automatic assignment
		$siteId = $contextData['site_id'] ?? $this->getSiteId();
		$userId = $contextData['user_id'] ?? $this->getUserId();
		$sessionId = $contextData['session_id'] ?? $this->sessionId;
		
		// Use event_data timestamp if available (for batched events), otherwise current time
		$timestamp = $this->getEventTimestamp($data);

		// Validate required fields
		if (!$eventTypeValue || !$sessionId) {
			return false;
		}

		// Basic sanitization for security and remove timestamp from data field
		$sanitizedData = $this->sanitizeEventData($data);
		// Remove timestamp from sanitized data as it's now stored in the dedicated timestamp column
		unset($sanitizedData['timestamp']);

		// Prepare event data
		$eventData = [
			'site_id' => (int) $siteId,
			'timestamp' => sanitize_text_field($timestamp),
			'event_type' => sanitize_text_field($eventTypeValue),
			'user_id' => sanitize_text_field($userId),
			'session_id' => sanitize_text_field($sessionId),
			'data' => !empty($sanitizedData) ? wp_json_encode($sanitizedData) : null,
		];

		// Insert into analytics table
		$result = $this->wpdb->insert(
			$this->tableName,
			$eventData,
			['%d', '%s', '%s', '%s', '%s', '%s']
		);

		// Log any database errors
		if ($result === false) {
			Logger::error('WPChat Analytics: Failed to log event - ' . $this->wpdb->last_error);
			return false;
		}

		return true;
	}

	/**
	 * Basic sanitization of event data for secure storage.
	 *
	 * @param array $data The event data to sanitize.
	 * @return array Sanitized event data.
	 */
	private function sanitizeEventData(array $data): array
	{
		$sanitized = [];

		foreach ($data as $key => $value) {
			// Sanitize key - only allow safe characters
			$cleanKey = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $key);
			$cleanKey = substr($cleanKey, 0, 64); // Limit key length

			if (empty($cleanKey)) {
				continue; // Skip invalid keys
			}

			// Sanitize value based on type
			$sanitized[$cleanKey] = $this->sanitizeValue($value);
		}

		return $sanitized;
	}

	/**
	 * Sanitize a single value.
	 *
	 * @param mixed $value The value to sanitize.
	 * @return mixed Sanitized value.
	 */
	private function sanitizeValue($value)
	{
		if (is_null($value)) {
			return null;
		}

		if (is_bool($value)) {
			return (bool) $value;
		}

		if (is_int($value)) {
			return (int) $value;
		}

		if (is_float($value)) {
			return is_finite($value) ? $value : 0.0;
		}

		if (is_array($value)) {
			return $this->sanitizeEventData($value);
		}

		if (is_string($value)) {
			return sanitize_text_field($value);
		}

		return null;
	}

	/**
	 * Log a bot open event.
	 * Automatically includes common browser/request metadata.
	 *
	 * @param array $metadata     Additional metadata.
	 * @param array $contextData  Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logBotOpen(array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'source' => $_SERVER['REQUEST_URI'] ?? '',
			'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
			'referrer' => $_SERVER['HTTP_REFERER'] ?? '',
		], $metadata);

		return $this->logEvent('BOT_OPEN', $data, $contextData);
	}

	/**
	 * Log a bot close event.
	 * Automatically calculates session duration if start time is available.
	 *
	 * @param array $metadata     Additional metadata.
	 * @param array $contextData  Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logBotClose(array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'reason' => $metadata['reason'] ?? 'user_action',
		], $metadata);

		return $this->logEvent('BOT_CLOSE', $data, $contextData);
	}

	/**
	 * Log a message send event.
	 * Automatically categorizes message type and calculates length.
	 *
	 * @param string $message      The message content.
	 * @param array  $metadata     Additional metadata.
	 * @param array  $contextData  Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logMessageSend(string $message, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'message_length' => strlen($message),
			'message_type' => $this->inferMessageType($message),
		], $metadata);

		return $this->logEvent('MESSAGE_SEND', $data, $contextData);
	}

	/**
	 * Log a FAQ search event.
	 * Automatically includes search context and timing.
	 *
	 * @param string $searchTerm   The search term used.
	 * @param int    $resultsCount Number of results returned.
	 * @param array  $metadata     Additional metadata.
	 * @param array  $contextData  Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFaqSearch(string $searchTerm, int $resultsCount, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'search_term' => $searchTerm,
			'results_count' => $resultsCount,
			'search_length' => strlen($searchTerm),
		], $metadata);

		return $this->logEvent('FAQ_SEARCH', $data, $contextData);
	}

	/**
	 * Log a navigation event with enhanced context and intelligence.
	 *
	 * @param string $fromSection The section navigated from.
	 * @param string $toSection   The section navigated to.
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logNavigation(string $fromSection, string $toSection, array $metadata = [], array $contextData = []): bool
	{
		$navigationContext = $this->getNavigationContext($fromSection, $toSection, $metadata);

		$data = array_merge([
			'from_section' => $fromSection,
			'to_section' => $toSection,
		], $navigationContext, $metadata);

		return $this->logEvent('NAVIGATION', $data, $contextData);
	}

	/**
	 * Log a FAQ click event.
	 *
	 * @param int    $faqId       The FAQ ID.
	 * @param string $question    The FAQ question.
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFaqClick(int $faqId, string $question, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'faq_id' => $faqId,
			'faq_question' => $question,
		], $metadata);

		return $this->logEvent('FAQ_CLICK', $data, $contextData);
	}

	/**
	 * Log a FAQ helpful event.
	 *
	 * @param int    $faqId       The FAQ ID.
	 * @param string $question    The FAQ question.
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFaqHelpful(int $faqId, string $question, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'faq_id' => $faqId,
			'faq_question' => $question,
			'rating' => 'helpful',
		], $metadata);

		return $this->logEvent('FAQ_HELPFUL', $data, $contextData);
	}

	/**
	 * Log a FAQ not helpful event.
	 *
	 * @param int    $faqId       The FAQ ID.
	 * @param string $question    The FAQ question.
	 * @param array  $metadata    Additional metadata (can include feedback).
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFaqNotHelpful(int $faqId, string $question, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'faq_id' => $faqId,
			'faq_question' => $question,
			'rating' => 'not_helpful',
		], $metadata);

		return $this->logEvent('FAQ_NOT_HELPFUL', $data, $contextData);
	}

	/**
	 * Log a redirect to platform event.
	 *
	 * @param string $platform    The platform (whatsapp, telegram, messenger, etc.).
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logRedirectToPlatform(string $platform, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'platform' => $platform,
		], $metadata);

		return $this->logEvent('REDIRECT_TO_PLATFORM', $data, $contextData);
	}



	/**
	 * Log a funnel step event.
	 *
	 * @param string $funnelId    The funnel ID.
	 * @param string $stepName    The step name (view, option_click, etc).
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFunnelStep(string $funnelId, string $stepName, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'funnel_id' => $funnelId,
			'step_name' => $stepName,
		], $metadata);

		return $this->logEvent('FUNNEL_STEP', $data, $contextData);
	}

	/**
	 * Log a funnel complete event.
	 * Automatically calculates completion time and step count.
	 *
	 * @param string $funnelId    The funnel ID.
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFunnelComplete(string $funnelId, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'funnel_id' => $funnelId,
			'completion_time' => $this->getCurrentTimestamp(),
		], $metadata);

		return $this->logEvent('FUNNEL_COMPLETE', $data, $contextData);
	}

	/**
	 * Log a funnel abandon event.
	 * Tracks abandonment context with last block order.
	 *
	 * @param string $funnelId    The funnel ID.
	 * @param int    $lastBlockOrder The last block order before abandonment.
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logFunnelAbandon(string $funnelId, int $lastBlockOrder, array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'funnel_id' => $funnelId,
			'last_block_order' => $lastBlockOrder,
			'abandon_reason' => $metadata['abandon_reason'] ?? 'unknown',
		], $metadata);

		return $this->logEvent('FUNNEL_ABANDON', $data, $contextData);
	}

	/**
	 * Log an agent assignment event.
	 *
	 * @param int    $agentId     The agent ID.
	 * @param string $agentName   The agent name.
	 * @param string $platform    The platform.
	 * @param string $status      The assignment status (success/failure).
	 * @param array  $metadata    Additional metadata.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logAgentAssignment(int $agentId, string $agentName, string $platform, string $status = 'success', array $metadata = [], array $contextData = []): bool
	{
		$data = array_merge([
			'agent_id' => $agentId,
			'agent_name' => $agentName,
			'platform' => $platform,
			'status' => $status,
		], $metadata);

		return $this->logEvent('AGENT_ASSIGNMENT', $data, $contextData);
	}

	/**
	 * Batch log multiple events.
	 *
	 * @param array $events       Array of events to log.
	 * @param array $contextData  Optional context data with site_id, user_id, session_id.
	 * @return array Results with success counts and errors.
	 */
	public function logBatchEvents(array $events, array $contextData = []): array
	{
		$results = [
			'success' => 0,
			'errors' => 0,
			'details' => [],
		];

		// Basic batch size limit
		if (count($events) > 50) {
			$results['errors']++;
			$results['details'][] = 'Batch size too large (max 50 events)';
			return $results;
		}

		foreach ($events as $event) {
			if (!isset($event['event_type'])) {
				$results['errors']++;
				$results['details'][] = 'Missing event_type for event';
				continue;
			}

			// Use event-specific context data if provided, otherwise use batch context data
			$eventContextData = $event['context_data'] ?? $contextData;
			$success = $this->logEvent($event['event_type'], $event['data'] ?? [], $eventContextData);
			if ($success) {
				$results['success']++;
			} else {
				$results['errors']++;
				$results['details'][] = "Failed to log event: {$event['event_type']}";
			}
		}

		return $results;
	}

	/**
	 * Get current timestamp in MySQL format.
	 *
	 * @return string Current timestamp.
	 */
	private function getCurrentTimestamp(): string
	{
		return current_time('mysql', true); // UTC time
	}

	/**
	 * Get event timestamp from event data if available, otherwise use current time.
	 * This handles batched events that include their original timestamp.
	 *
	 * @param array $eventData The event data that might contain a timestamp.
	 * @return string Timestamp in MySQL format (UTC).
	 */
	private function getEventTimestamp(array $eventData): string
	{
		// Check if event data contains a timestamp (from batched events)
		if (isset($eventData['timestamp']) && !empty($eventData['timestamp'])) {
			// Validate and convert ISO timestamp to MySQL format
			$timestamp = $eventData['timestamp'];
			
			// Try to parse the timestamp (should be ISO 8601 format from JavaScript)
			$dateTime = \DateTime::createFromFormat('Y-m-d\TH:i:s.u\Z', $timestamp);
			if ($dateTime === false) {
				// Try without microseconds
				$dateTime = \DateTime::createFromFormat('Y-m-d\TH:i:s\Z', $timestamp);
			}
			
			if ($dateTime !== false) {
				// Set UTC timezone and return in MySQL format
				$dateTime->setTimezone(new \DateTimeZone('UTC'));
				return $dateTime->format('Y-m-d H:i:s');
			}
		}

		// Fallback to current time if no valid timestamp in event data
		return $this->getCurrentTimestamp();
	}

	/**
	 * Get enhanced navigation context with intelligence.
	 *
	 * @param string $fromSection The section navigated from.
	 * @param string $toSection   The section navigated to.
	 * @param array  $metadata    Additional metadata.
	 * @return array Enhanced navigation context.
	 */
	private function getNavigationContext(string $fromSection, string $toSection, array $metadata): array
	{
		$context = [
			'navigation_type' => $metadata['navigation_type'] ?? 'direct_navigation',
			'user_intent' => $this->inferUserIntent($fromSection, $toSection),
			'progression_direction' => $this->getProgressionDirection($fromSection, $toSection),
			'section_depth' => $this->getSectionDepth($toSection),
			'sequence_number' => $this->getNavigationSequenceNumber(),
		];

		// Add navigation trigger if available
		if (isset($metadata['navigation_trigger'])) {
			$context['navigation_trigger'] = $metadata['navigation_trigger'];
		}

		return $context;
	}

	/**
	 * Infer user intent from navigation pattern.
	 *
	 * @param string $fromSection The section navigated from.
	 * @param string $toSection   The section navigated to.
	 * @return string User intent.
	 */
	private function inferUserIntent(string $fromSection, string $toSection): string
	{
		$intentMap = [
			'home→faq' => 'help_seeking',
			'home→agents' => 'direct_contact',
			'faq→agents' => 'escalation',
			'agents→faq' => 'self_service_attempt',
			'faq→faq' => 'information_gathering',
			'faq→home' => 'exploration',
			'agents→home' => 'comparison_shopping',
			'*→search' => 'problem_solving',
			'*→contact' => 'conversion_intent',
		];

		$pattern = "{$fromSection}→{$toSection}";
		$wildcardPattern = "*→{$toSection}";

		return $intentMap[$pattern] ?? $intentMap[$wildcardPattern] ?? 'general_navigation';
	}

	/**
	 * Determine progression direction of navigation.
	 *
	 * @param string $fromSection The section navigated from.
	 * @param string $toSection   The section navigated to.
	 * @return string Progression direction.
	 */
	private function getProgressionDirection(string $fromSection, string $toSection): string
	{
		// Define section hierarchy (deeper = higher number)
		$sectionHierarchy = [
			'home' => 0,
			'faq' => 1,
			'faq_search' => 2,
			'faq_detail' => 3,
			'agents' => 1,
			'agent_detail' => 2,
			'contact' => 2,
			'settings' => 1,
		];

		$fromDepth = $sectionHierarchy[$fromSection] ?? 1;
		$toDepth = $sectionHierarchy[$toSection] ?? 1;

		if ($toDepth > $fromDepth) {
			return 'forward';
		} elseif ($toDepth < $fromDepth) {
			return 'backward';
		} else {
			return 'lateral';
		}
	}

	/**
	 * Get the depth level of a section in the UI hierarchy.
	 *
	 * @param string $section The section name.
	 * @return int Section depth.
	 */
	private function getSectionDepth(string $section): int
	{
		$depthMap = [
			'home' => 0,
			'faq' => 1,
			'faq_search' => 2,
			'faq_detail' => 3,
			'agents' => 1,
			'agent_detail' => 2,
			'contact' => 2,
			'settings' => 1,
			'support' => 1,
		];

		return $depthMap[$section] ?? 1;
	}

	/**
	 * Get the next navigation sequence number for the current session.
	 *
	 * This method uses in-memory caching to avoid database queries for each
	 * navigation event. The sequence number is initialized once per session
	 * and then incremented in memory for subsequent navigation events.
	 *
	 * @return int The next sequence number for navigation events.
	 */
	private function getNavigationSequenceNumber(): int
	{
		if (!$this->sessionId) {
			return 1;
		}

		// Use cached sequence number if available
		if ($this->navigationSequenceNumber > 0) {
			$this->navigationSequenceNumber++;
			return $this->navigationSequenceNumber;
		}

		// Initialize sequence number from database only once per session
		$count = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT COUNT(*) FROM {$this->tableName} 
				WHERE session_id = %s 
				AND event_type = 'navigation'",
				$this->sessionId
			)
		);

		$this->navigationSequenceNumber = ((int) $count) + 1;
		return $this->navigationSequenceNumber;
	}

	/**
	 * Reset the navigation sequence cache.
	 * Called when a new session starts.
	 */
	private function resetNavigationSequenceCache(): void
	{
		$this->navigationSequenceNumber = 0;
	}

	/**
	 * Manually reset the navigation sequence cache.
	 * Useful for testing or when session state needs to be refreshed.
	 */
	public function resetNavigationCache(): void
	{
		$this->resetNavigationSequenceCache();
	}

	/**
	 * Infer message type based on message content.
	 *
	 * @param string $message The message content.
	 * @return string Message type classification.
	 */
	private function inferMessageType(string $message): string
	{
		$message = trim(strtolower($message));

		// Question patterns
		if (
			preg_match('/^(what|how|where|when|why|which|who|can|could|would|should|is|are|do|does|did)\b/i', $message) ||
			str_contains($message, '?')
		) {
			return 'question';
		}

		// Greeting patterns
		if (preg_match('/^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings)\b/i', $message)) {
			return 'greeting';
		}

		// Support request patterns
		if (preg_match('/\b(help|support|issue|problem|error|bug|not\s+working|broken)\b/i', $message)) {
			return 'support_request';
		}

		// Information request patterns
		if (preg_match('/\b(tell\s+me|show\s+me|explain|describe|information|details|about)\b/i', $message)) {
			return 'information_request';
		}

		// Feedback patterns
		if (preg_match('/\b(thanks|thank\s+you|good|great|bad|terrible|love|hate|feedback)\b/i', $message)) {
			return 'feedback';
		}

		// Short messages (likely quick responses)
		if (strlen($message) < 10) {
			return 'short_response';
		}

		// Default
		return 'general';
	}

	/**
	 * Get the current session ID.
	 *
	 * @return string|null Session ID.
	 */
	public function getSessionId(): ?string
	{
		return $this->sessionId;
	}

	/**
	 * Get the current user ID.
	 *
	 * @return string User ID.
	 */
	public function getCurrentUserId(): string
	{
		return $this->getUserId();
	}

	/**
	 * Clean up old analytics data.
	 *
	 * @param int $days Number of days to retain.
	 * @return int Number of deleted records.
	 */
	public function cleanupOldData(int $days = 365, int $batchSize = 1000): int
	{
		$cutoffDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));
		$siteId = $this->getSiteId();
		$totalDeleted = 0;

		do {
			$deletedRows = $this->wpdb->query(
				$this->wpdb->prepare(
					"DELETE FROM {$this->tableName}
					WHERE site_id = %d
					AND timestamp < %s
					LIMIT %d",
					$siteId,
					$cutoffDate,
					$batchSize
				)
			);
			$totalDeleted += (int) $deletedRows;
		} while ($deletedRows === $batchSize);

		return $totalDeleted;
	}
}
