<?php

namespace SmashBalloon\WPChat\Common\Services\Analytics;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use DateInterval;
use DateTime;
use Exception;
use SmashBalloon\WPChat\Common\Helpers\AnalyticsTimezoneHelper;
use SmashBalloon\WPChat\Common\Contracts\AnalyticsAggregationServiceInterface;
use SmashBalloon\WPChat\Common\Repositories\AgentAnalyticsRepository;
use SmashBalloon\WPChat\Common\Repositories\DailyAnalyticsRepository;
use SmashBalloon\WPChat\Common\Repositories\FaqAnalyticsRepository;
use SmashBalloon\WPChat\Common\Repositories\HourlyAnalyticsRepository;
use wpdb;

/**
 * Service for processing raw analytics events into aggregate tables.
 * Handles ETL (Extract, Transform, Load) processing of analytics data.
 */
class AnalyticsAggregationService implements AnalyticsAggregationServiceInterface
{
	/**
	 * Option key for storing last processed timestamps.
	 *
	 * @var string
	 */
	private const LAST_PROCESSED_OPTION = 'wpchat_analytics_last_processed';
	/**
	 * Events that count as user interactions for analytics aggregation.
	 * These events represent direct user actions and engagement.
	 */
	private const USER_INTERACTION_EVENTS = [
		'bot_open',
		'bot_close',
		'message_send',
		'navigation',
		'faq_click',
		'faq_search',
		'faq_helpful',
		'faq_not_helpful',
		'funnel_step',
	];
	/**
	 * Events that count as conversions for analytics aggregation.
	 * These events represent successful outcomes and goal completions.
	 */
	private const CONVERSION_EVENTS = [
		'redirect_to_platform',
		'funnel_complete',
	];
	/**
	 * Events that count as agent-related activities.
	 * These events are used for agent performance analytics.
	 */
	private const AGENT_EVENTS = [
		'agent_assignment',
	];
	/**
	 * Events that count as FAQ-related activities.
	 * These events are used for FAQ performance analytics.
	 */
	private const FAQ_EVENTS = [
		'faq_click',
		'faq_search',
		'faq_search_appearance',
		'faq_helpful',
		'faq_not_helpful',
	];
	/**
	 * Events that count as funnel-related activities.
	 * These events are used for funnel performance analytics.
	 */
	private const FUNNEL_EVENTS = [
		'funnel_step',
		'funnel_complete',
		'funnel_abandon',
	];
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	protected wpdb $wpdb;
	/**
	 * Analytics table name.
	 *
	 * @var string
	 */
	protected string $analyticsTableName;
	/**
	 * Daily analytics repository.
	 *
	 * @var DailyAnalyticsRepository
	 */
	private DailyAnalyticsRepository $dailyRepository;
	/**
	 * Hourly analytics repository.
	 *
	 * @var HourlyAnalyticsRepository
	 */
	private HourlyAnalyticsRepository $hourlyRepository;
	/**
	 * FAQ analytics repository.
	 *
	 * @var FaqAnalyticsRepository
	 */
	private FaqAnalyticsRepository $faqRepository;
	/**
	 * Agent analytics repository.
	 *
	 * @var AgentAnalyticsRepository
	 */
	private AgentAnalyticsRepository $agentRepository;


	/**
	 * Constructor.
	 *
	 * @param wpdb $wpdb WordPress database instance.
	 */
	public function __construct(wpdb $wpdb)
	{
		$this->wpdb = $wpdb;
		$this->analyticsTableName = $wpdb->prefix . 'wpchat_analytics';
		$this->dailyRepository = new DailyAnalyticsRepository($wpdb);
		$this->hourlyRepository = new HourlyAnalyticsRepository($wpdb);
		$this->faqRepository = new FaqAnalyticsRepository($wpdb);
		$this->agentRepository = new AgentAnalyticsRepository($wpdb);
	}

	/**
	 * Get UTC datetime range for a given date.
	 *
	 * @param string $date Date in WordPress timezone (Y-m-d format).
	 * @return array Array with 'start' and 'end' UTC datetime strings.
	 */
	protected function getUtcDateTimeRange(string $date): array
	{
		return AnalyticsTimezoneHelper::convertDateRangeToUtcDateTime($date, $date);
	}

	/**
	 * Create IN clause for event types.
	 *
	 * @param array $eventTypes Array of event types.
	 * @return string SQL IN clause string.
	 */
	private function createEventInClause(array $eventTypes): string
	{
		return "'" . implode("','", $eventTypes) . "'";
	}

	/**
	 * Get current site ID.
	 *
	 * @return int Site ID.
	 */
	protected function getCurrentSiteId(): int
	{
		return is_multisite() ? get_current_blog_id() : 1;
	}

	/**
	 * Update last processed timestamp for an aggregate type.
	 *
	 * @param string $aggregate_type Aggregate type.
	 * @param string $date Date in WordPress timezone.
	 * @return bool Whether update was successful.
	 */
	private function updateLastProcessedForDate(string $aggregate_type, string $date): bool
	{
		$wpTimezone = AnalyticsTimezoneHelper::getWordPressTimezoneObject();
		$now = new DateTime('now', $wpTimezone);
		$dateObj = new DateTime($date, $wpTimezone);

		// If processing current day, save current time, otherwise save end of day
		if ($dateObj->format('Y-m-d') === $now->format('Y-m-d')) {
			$timestamp = $now->format('Y-m-d H:i:s');
		} else {
			$endOfDay = new DateTime($date . ' 23:59:59', $wpTimezone);
			$timestamp = $endOfDay->format('Y-m-d H:i:s');
		}

		return $this->updateLastProcessedTimestamp($aggregate_type, $timestamp);
	}

	/**
	 * {@inheritdoc}
	 */
	public function processAllAggregates(?string $start_date = null, ?string $end_date = null): array
	{
		$results = [
			'success' => false,
			'daily_results' => [],
			'hourly_results' => [],
			'faq_results' => [],
			'agent_results' => [],
			'errors' => [],
			'processing_time' => 0,
		];

		$startTime = microtime(true);

		try {
			// Validate date range
			if (!$this->validateDateRange($start_date, $end_date)) {
				$results['errors'][] = 'Invalid date range provided';
				return $results;
			}

			// Process each aggregate type
			$results['daily_results'] = $this->processDailySummaries($start_date, $end_date);
			$results['hourly_results'] = $this->processHourlySummaries($start_date, $end_date);
			$results['faq_results'] = $this->processFaqDailySummaries($start_date, $end_date);
			$results['agent_results'] = $this->processAgentDailySummaries($start_date, $end_date);
			$results['funnel_results'] = $this->processFunnelDailySummaries($start_date, $end_date);
			$results['funnel_block_results'] = $this->processFunnelBlockDailySummaries($start_date, $end_date);

			// Check if all processes were successful
			$allSuccessful = $results['daily_results']['success'] &&
				$results['hourly_results']['success'] &&
				$results['faq_results']['success'] &&
				$results['agent_results']['success'] &&
				$results['funnel_results']['success'] &&
				$results['funnel_block_results']['success'];

			$results['success'] = $allSuccessful;

			// Collect all errors
			$results['errors'] = array_merge(
				$results['daily_results']['errors'],
				$results['hourly_results']['errors'],
				$results['faq_results']['errors'],
				$results['agent_results']['errors'],
				$results['funnel_results']['errors'],
				$results['funnel_block_results']['errors']
			);

			// Calculate processing time
			$results['processing_time'] = round((microtime(true) - $startTime) * 1000, 2); // in milliseconds
		} catch (Exception $e) {
			$results['errors'][] = $e->getMessage();
			$results['processing_time'] = round((microtime(true) - $startTime) * 1000, 2);
			Logger::error('WPChat Analytics Aggregation: Process all aggregates error - ' . $e->getMessage());
		}

		return $results;
	}

	/**
	 * {@inheritdoc}
	 */
	public function processDailySummaries(?string $start_date = null, ?string $end_date = null): array
	{
		// Get date range
		$dateRange = $this->getProcessingDateRange($start_date, $end_date, 'daily');

		// Process dates in batch
		$results = $this->processBatchDates($dateRange, 'daily');

		// Update last processed timestamp
		if (!empty($dateRange)) {
			$lastDate = max($dateRange);
			$this->updateLastProcessedForDate('daily', $lastDate);
		}

		return $results;
	}

	/**
	 * Process multiple dates in batch for better performance.
	 *
	 * @param array  $dates Array of dates to process.
	 * @param string $type Aggregate type.
	 * @return array Processing results.
	 */
	private function processBatchDates(array $dates, string $type): array
	{
		$results = [
			'success' => false,
			'processed_records' => 0,
			'processed_dates' => [],
			'errors' => [],
		];

		try {
			foreach ($dates as $date) {
				switch ($type) {
					case 'daily':
						$this->processDailySummaryForDate($date);
						break;
					case 'hourly':
						$this->processHourlySummaryForDate($date);
						break;
					case 'faq_daily':
						$this->processFaqDailySummaryForDate($date);
						break;
					case 'agent_daily':
						$this->processAgentDailySummaryForDate($date);
						break;
					case 'funnel_daily':
						$this->processFunnelDailySummaryForDate($date);
						break;
					case 'funnel_block_daily':
						$this->processFunnelBlockDailySummaryForDate($date);
						break;
				}
				$results['processed_dates'][] = $date;
				$results['processed_records']++;
			}

			$results['success'] = true;
		} catch (Exception $e) {
			$results['errors'][] = $e->getMessage();
			Logger::error("WPChat Analytics Aggregation: Batch processing error for {$type} - " . $e->getMessage());
		}

		return $results;
	}

	/**
	 * Validate date range parameters.
	 *
	 * @param string|null $start_date Start date.
	 * @param string|null $end_date End date.
	 * @return bool Whether the date range is valid.
	 */
	private function validateDateRange(?string $start_date, ?string $end_date): bool
	{
		if ($start_date && $end_date) {
			// Check if dates are in correct format
			if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
				return false;
			}

			// Check if start date is before or equal to end date
			if (strtotime($start_date) > strtotime($end_date)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get processing date range.
	 * Uses precise datetime boundaries to ensure accurate data capture.
	 *
	 * @param string|null $start_date Start date.
	 * @param string|null $end_date End date.
	 * @param string      $type Aggregate type.
	 * @return array Array of dates to process.
	 */
	private function getProcessingDateRange(?string $start_date, ?string $end_date, string $type): array
	{
		// Validate date range
		if (!$this->validateDateRange($start_date, $end_date)) {
			throw new Exception('Invalid date range provided');
		}

		$wpTimezone = AnalyticsTimezoneHelper::getWordPressTimezoneObject();

		// Case 1: Explicit date range provided
		if ($start_date && $end_date) {
			$start = new DateTime($start_date, $wpTimezone);
			$end = new DateTime($end_date, $wpTimezone);
		}
		// Case 2: Use last processed timestamp
		else {
			$lastProcessed = $this->getLastProcessedTimestamp($type);
			$now = new DateTime('now', $wpTimezone);

			if (!$lastProcessed) {
				// No last processed - use last 7 days
				$start = clone $now;
				$start->modify('-7 days')->setTime(0, 0, 0);
				$end = clone $now;
			} else {
				// Use last processed timestamp
				$lastProcessedDate = new DateTime($lastProcessed, $wpTimezone);

				// Same day processing
				if ($lastProcessedDate->format('Y-m-d') === $now->format('Y-m-d')) {
					$start = clone $lastProcessedDate;
					$end = clone $now;
				}
				// Next day processing
				else {
					$start = clone $lastProcessedDate;
					$start->modify('+1 day')->setTime(0, 0, 0);

					$end = clone $start;
					$end->modify('+1 day')->setTime(23, 59, 59);

					// Cap at current time if in future
					if ($end > $now) {
						$end = clone $now;
					}
				}
			}
		}

		// Generate date array
		$dates = [];
		$current = clone $start;

		while ($current <= $end) {
			$dates[] = $current->format('Y-m-d');
			$current->add(new DateInterval('P1D'));
		}

		return $dates;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getLastProcessedTimestamp(string $aggregate_type): ?string
	{
		$lastProcessed = get_option(self::LAST_PROCESSED_OPTION, []);
		return $lastProcessed[$aggregate_type] ?? null;
	}

	/**
	 * Process daily summary for a specific date.
	 * Uses timezone-aware datetime range for precise daily aggregation.
	 *
	 * @param string $date The date to process (YYYY-MM-DD format in WordPress timezone).
	 */
	private function processDailySummaryForDate(string $date): void
	{
		$siteId = $this->getCurrentSiteId();
		$utcDateTimeRange = $this->getUtcDateTimeRange($date);

		// Create IN clauses for events
		$userInteractionEvents = $this->createEventInClause(self::USER_INTERACTION_EVENTS);
		$conversionEvents = $this->createEventInClause(self::CONVERSION_EVENTS);

		// Get raw data for the date using precise datetime range
		$dailyData = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT
					site_id,
					%s as summary_date,
					COUNT(CASE WHEN event_type IN ({$userInteractionEvents}) THEN 1 END) as total_user_interactions,
					COUNT(CASE WHEN event_type IN ({$conversionEvents}) THEN 1 END) as total_redirects,
					SUM(CASE WHEN event_type = 'bot_open' THEN 1 ELSE 0 END) as total_bot_opens,
					SUM(CASE WHEN event_type = 'faq_click' THEN 1 ELSE 0 END) as total_faq_clicks,
					SUM(CASE WHEN event_type = 'funnel_complete' THEN 1 ELSE 0 END) as total_funnel_completions,
					SUM(CASE WHEN event_type = 'agent_assignment' THEN 1 ELSE 0 END) as total_agent_assignments,
					SUM(CASE WHEN event_type = 'agent_assignment' AND agent_id IS NOT NULL AND status IN ('success', 'assigned') THEN 1 ELSE 0 END) as total_successful_assignments,
					SUM(CASE WHEN event_type = 'agent_assignment' AND (agent_id IS NULL OR status NOT IN ('success', 'assigned')) THEN 1 ELSE 0 END) as total_failed_assignments,
					COUNT(DISTINCT user_id) as unique_users,
					COUNT(DISTINCT session_id) as unique_sessions
				FROM {$this->analyticsTableName}
				WHERE site_id = %d
				AND timestamp BETWEEN %s AND %s
				GROUP BY site_id",
				$date, // Use WordPress timezone date instead of DATE(timestamp)
				$siteId,
				$utcDateTimeRange['start'],
				$utcDateTimeRange['end']
			),
			ARRAY_A
		);

		if ($dailyData) {
			// Calculate conversion rate
			$botOpens = (int)($dailyData['total_bot_opens'] ?? 0);
			$redirects = (int)($dailyData['total_redirects'] ?? 0);
			$dailyData['conversion_rate'] = $botOpens > 0 ? round(($redirects / $botOpens) * 100, 2) : 0;

			// Add timezone information
			$dailyData['timezone'] = AnalyticsTimezoneHelper::getWordPressTimezone();

			$this->dailyRepository->upsertDailySummary(
				$siteId,
				$date, // Store with WordPress timezone date
				$dailyData
			);
		}
	}

	/**
	 * {@inheritdoc}
	 */
	public function updateLastProcessedTimestamp(string $aggregate_type, string $timestamp): bool
	{
		$lastProcessed = get_option(self::LAST_PROCESSED_OPTION, []);
		$lastProcessed[$aggregate_type] = $timestamp;
		return update_option(self::LAST_PROCESSED_OPTION, $lastProcessed);
	}

	/**
	 * {@inheritdoc}
	 */
	public function processHourlySummaries(?string $start_date = null, ?string $end_date = null): array
	{
		// Get date range
		$dateRange = $this->getProcessingDateRange($start_date, $end_date, 'hourly');

		// Process dates in batch
		$results = $this->processBatchDates($dateRange, 'hourly');

		// Update last processed timestamp
		if (!empty($dateRange)) {
			$lastDate = max($dateRange);
			$this->updateLastProcessedForDate('hourly', $lastDate);
		}

		return $results;
	}

	/**
	 * Process hourly summary for a specific date.
	 * Uses SQL EXTRACT with timezone offset in seconds for precise database aggregation.
	 *
	 * @param string $date The date to process (YYYY-MM-DD format in WordPress timezone).
	 */
	private function processHourlySummaryForDate(string $date): void
	{
		$siteId = $this->getCurrentSiteId();
		$utcDateTimeRange = $this->getUtcDateTimeRange($date);

		$wpTimezone = AnalyticsTimezoneHelper::getWordPressTimezone();
		$offsetSeconds = AnalyticsTimezoneHelper::getWordPressTimezoneOffset();

		$offsetSign = $offsetSeconds >= 0 ? '+' : '-';

		// Create IN clauses for events
		$userInteractionEvents = $this->createEventInClause(self::USER_INTERACTION_EVENTS);
		$conversionEvents = $this->createEventInClause(self::CONVERSION_EVENTS);

		$hourlyData = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					site_id,
					%s as summary_date,
					EXTRACT(HOUR FROM (timestamp {$offsetSign} INTERVAL %d SECOND)) as summary_hour,
					COUNT(CASE WHEN event_type IN ({$userInteractionEvents}) THEN 1 END) as total_user_interactions,
					COUNT(CASE WHEN event_type IN ({$conversionEvents}) THEN 1 END) as total_redirects,
					SUM(CASE WHEN event_type = 'bot_open' THEN 1 ELSE 0 END) as total_bot_opens,
					SUM(CASE WHEN event_type = 'faq_click' THEN 1 ELSE 0 END) as total_faq_clicks,
					SUM(CASE WHEN event_type = 'agent_assignment' THEN 1 ELSE 0 END) as total_agent_assignments,
					COUNT(DISTINCT user_id) as unique_users,
					COUNT(DISTINCT session_id) as unique_sessions
				FROM {$this->analyticsTableName}
				WHERE site_id = %d
				AND timestamp BETWEEN %s AND %s
				GROUP BY site_id, summary_hour
				ORDER BY summary_hour",
				$date, // Use WordPress timezone date instead of DATE(timestamp)
				$offsetSeconds,
				$siteId,
				$utcDateTimeRange['start'],
				$utcDateTimeRange['end']
			),
			ARRAY_A
		);

		foreach ($hourlyData as $hour) {
			// Hour is already in user timezone, no conversion needed
			$userTimezoneHour = (int)$hour['summary_hour'];

			// Add timezone information to the data
			$hour['timezone'] = $wpTimezone;

			$this->hourlyRepository->upsertHourlySummary(
				$siteId,
				$date, // Store with WordPress timezone date
				$userTimezoneHour, // Store with user timezone hour
				$hour
			);
		}
	}

	/**
	 * {@inheritdoc}
	 */
	public function processFaqDailySummaries(?string $start_date = null, ?string $end_date = null): array
	{
		// Get date range
		$dateRange = $this->getProcessingDateRange($start_date, $end_date, 'faq_daily');

		// Process dates in batch
		$results = $this->processBatchDates($dateRange, 'faq_daily');

		// Update last processed timestamp
		if (!empty($dateRange)) {
			$lastDate = max($dateRange);
			$this->updateLastProcessedForDate('faq_daily', $lastDate);
		}

		return $results;
	}

	/**
	 * Process funnel daily summaries for a date range.
	 *
	 * @param string|null $start_date Start date (YYYY-MM-DD).
	 * @param string|null $end_date End date (YYYY-MM-DD).
	 * @return array Processing results.
	 */
	public function processFunnelDailySummaries(?string $start_date = null, ?string $end_date = null): array
	{
		// Get date range
		$dateRange = $this->getProcessingDateRange($start_date, $end_date, 'funnel_daily');

		// Process dates in batch
		$results = $this->processBatchDates($dateRange, 'funnel_daily');

		// Update last processed timestamp
		if (!empty($dateRange)) {
			$lastDate = max($dateRange);
			$this->updateLastProcessedForDate('funnel_daily', $lastDate);
		}

		return $results;
	}

	/**
	 * Process funnel block daily summaries for a date range.
	 *
	 * @param string|null $start_date Start date (YYYY-MM-DD).
	 * @param string|null $end_date End date (YYYY-MM-DD).
	 * @return array Processing results.
	 */
	public function processFunnelBlockDailySummaries(?string $start_date = null, ?string $end_date = null): array
	{
		// Get date range
		$dateRange = $this->getProcessingDateRange($start_date, $end_date, 'funnel_block_daily');

		// Process dates in batch
		$results = $this->processBatchDates($dateRange, 'funnel_block_daily');

		// Update last processed timestamp
		if (!empty($dateRange)) {
			$lastDate = max($dateRange);
			$this->updateLastProcessedForDate('funnel_block_daily', $lastDate);
		}

		return $results;
	}

	/**
	 * Get FAQ question text.
	 *
	 * @param int $faq_id FAQ ID.
	 * @return string FAQ question text.
	 */
	private function getFaqQuestionText(int $faq_id): string
	{
		$faqTableName = $this->wpdb->prefix . 'wpchat_faqs';
		$question = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT question FROM {$faqTableName} WHERE id = %d LIMIT 1",
				$faq_id
			)
		);

		return $question ?: "FAQ #{$faq_id}";
	}

	/**
	 * Process FAQ daily summary for a specific date.
	 * Uses timezone-aware datetime range for precise FAQ aggregation.
	 * Optimized to extract FAQ question in the same query to avoid N+1 problem.
	 *
	 * @param string $date The date to process (YYYY-MM-DD format in WordPress timezone).
	 */
	private function processFaqDailySummaryForDate(string $date): void
	{
		$siteId = $this->getCurrentSiteId();
		$utcDateTimeRange = $this->getUtcDateTimeRange($date);

		// Get FAQ data with question text in a single optimized query
		$faqData = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					site_id,
					%s as summary_date,
					faq_id,
					MAX(faq_question) as faq_question,
					COUNT(CASE WHEN event_type = 'faq_click' THEN 1 END) as total_clicks,
					COUNT(DISTINCT CASE WHEN event_type = 'faq_click' THEN user_id END) as unique_users,
					COUNT(CASE WHEN event_type = 'faq_search_appearance' THEN 1 END) as search_appearances,
					COUNT(CASE WHEN event_type = 'faq_helpful' THEN 1 END) as helpful_count,
					COUNT(CASE WHEN event_type = 'faq_not_helpful' THEN 1 END) as not_helpful_count
				FROM {$this->analyticsTableName}
				WHERE site_id = %d
				AND timestamp BETWEEN %s AND %s
				AND event_type IN ('faq_click', 'faq_search_appearance', 'faq_helpful', 'faq_not_helpful')
				AND faq_id IS NOT NULL
				GROUP BY site_id, faq_id",
				$date, // Use WordPress timezone date instead of DATE(timestamp)
				$siteId,
				$utcDateTimeRange['start'],
				$utcDateTimeRange['end']
			),
			ARRAY_A
		);

		foreach ($faqData as $faq) {
			$faqId = (int)$faq['faq_id'];

			// Get question from event data or fallback to FAQ table
			$faqQuestion = trim($faq['faq_question'] ?? '', '"');
			if (empty($faqQuestion)) {
				$faqQuestion = $this->getFaqQuestionText($faqId);
			}

			// Add timezone information
			$faq['timezone'] = AnalyticsTimezoneHelper::getWordPressTimezone();

			$this->faqRepository->upsertFaqDailySummary(
				$siteId,
				$date, // Store with WordPress timezone date
				$faqId,
				$faqQuestion,
				$faq
			);
		}
	}

	/**
	 * {@inheritdoc}
	 */
	public function processAgentDailySummaries(?string $start_date = null, ?string $end_date = null): array
	{
		// Get date range
		$dateRange = $this->getProcessingDateRange($start_date, $end_date, 'agent_daily');

		// Process dates in batch
		$results = $this->processBatchDates($dateRange, 'agent_daily');

		// Update last processed timestamp
		if (!empty($dateRange)) {
			$lastDate = max($dateRange);
			$this->updateLastProcessedForDate('agent_daily', $lastDate);
		}

		return $results;
	}

	/**
	 * Process agent daily summary for a specific date.
	 * Uses timezone-aware datetime range for precise agent aggregation.
	 *
	 * @param string $date The date to process (YYYY-MM-DD format in WordPress timezone).
	 */
	private function processAgentDailySummaryForDate(string $date): void
	{
		$siteId = $this->getCurrentSiteId();
		$utcDateTimeRange = $this->getUtcDateTimeRange($date);

		// Get agent data for the date using precise datetime range - only successful assignments have agent_id
		$agentData = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					site_id,
					%s as summary_date,
					agent_id,
					agent_name,
					COUNT(CASE WHEN event_type = 'agent_assignment' THEN 1 END) as total_assignments
				FROM {$this->analyticsTableName}
				WHERE site_id = %d
				AND timestamp BETWEEN %s AND %s
				AND event_type = 'agent_assignment'
				AND agent_id IS NOT NULL
				AND status IN ('success', 'assigned')
				GROUP BY site_id, agent_id, agent_name",
				$date, // Use WordPress timezone date instead of DATE(timestamp)
				$siteId,
				$utcDateTimeRange['start'],
				$utcDateTimeRange['end']
			),
			ARRAY_A
		);

		foreach ($agentData as $agent) {
			$agentId = (int)$agent['agent_id'];
			$agentInfo = $this->getAgentData($agentId);

			$eventAgentName = trim($agent['agent_name'] ?? '', '"');
			$agentName = !empty($eventAgentName) ? $eventAgentName : $agentInfo['name'];
			$agentAvatar = $agentInfo['avatar'];

			// Add timezone information and avatar
			$agent['timezone'] = AnalyticsTimezoneHelper::getWordPressTimezone();
			$agent['agent_avatar'] = $agentAvatar;

			$this->agentRepository->upsertAgentDailySummary(
				$siteId,
				$date, // Store with WordPress timezone date
				$agentId,
				$agentName,
				$agent
			);
		}
	}

	/**
	 * Get agent data (name and avatar).
	 *
	 * @param int $agent_id Agent ID.
	 * @return array Agent data with name and avatar.
	 */
	private function getAgentData(int $agent_id): array
	{
		$agentTableName = $this->wpdb->prefix . 'wpchat_agents';
		$result = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT name, avatar FROM {$agentTableName} WHERE id = %d LIMIT 1",
				$agent_id
			),
			ARRAY_A
		);


		return [
			'name' => $result['name'] ?? "Agent #{$agent_id}",
			'avatar' => $result['avatar'] ?? null
		];
	}

	/**
	 * Process funnel daily summary for a specific date.
	 * This is a stub method for Free version. Pro version overrides this.
	 *
	 * @param string $date The date to process (YYYY-MM-DD format in WordPress timezone).
	 */
	protected function processFunnelDailySummaryForDate(string $date): void
	{
		// Stub method - Pro version overrides this to provide funnel analytics
	}

	/**
	 * Process funnel block daily summary for a specific date.
	 * This is a stub method for Free version. Pro version overrides this.
	 *
	 * @param string $date Date to process (Y-m-d format).
	 */
	protected function processFunnelBlockDailySummaryForDate(string $date): void
	{
		// Stub method - Pro version overrides this to provide funnel block analytics
	}


	/**
	 * {@inheritdoc}
	 */
	public function cleanupOldAggregates(int $retention_days = 365): array
	{
		$results = [
			'success' => false,
			'deleted_records' => [
				'daily' => 0,
				'hourly' => 0,
				'faq' => 0,
				'agent' => 0,
			],
			'errors' => [],
		];

		try {
			$cutoffDate = date('Y-m-d', strtotime("-{$retention_days} days"));
			$startDate = '1970-01-01'; // Delete all data from epoch start to cutoff date

			// Clean up daily summaries
			$results['deleted_records']['daily'] = $this->dailyRepository->deleteDailySummaries(
				$this->getCurrentSiteId(),
				$startDate,
				$cutoffDate
			);

			// Clean up hourly summaries
			$results['deleted_records']['hourly'] = $this->hourlyRepository->deleteHourlySummaries(
				$this->getCurrentSiteId(),
				$startDate,
				$cutoffDate
			);

			// Clean up FAQ summaries
			$results['deleted_records']['faq'] = $this->faqRepository->deleteFaqDailySummaries(
				$this->getCurrentSiteId(),
				$startDate,
				$cutoffDate
			);

			// Clean up agent summaries
			$results['deleted_records']['agent'] = $this->agentRepository->deleteAgentDailySummaries(
				$this->getCurrentSiteId(),
				$startDate,
				$cutoffDate
			);

			$results['success'] = true;
		} catch (Exception $e) {
			$results['errors'][] = $e->getMessage();
			Logger::error('WPChat Analytics Aggregation: Cleanup error - ' . $e->getMessage());
		}

		return $results;
	}


}
