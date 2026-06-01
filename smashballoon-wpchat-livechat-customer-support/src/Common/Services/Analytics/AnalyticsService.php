<?php

namespace SmashBalloon\WPChat\Common\Services\Analytics;

use DateTime;
use SmashBalloon\WPChat\Common\Helpers\AnalyticsTimezoneHelper;
use SmashBalloon\WPChat\Common\Contracts\AnalyticsAggregationServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\AnalyticsServiceInterface;
use SmashBalloon\WPChat\Common\Repositories\AgentAnalyticsRepository;
use SmashBalloon\WPChat\Common\Repositories\DailyAnalyticsRepository;
use SmashBalloon\WPChat\Common\Repositories\FaqAnalyticsRepository;
use SmashBalloon\WPChat\Common\Repositories\HourlyAnalyticsRepository;

/**
 * High-level analytics service that orchestrates event logging, data aggregation, and reporting.
 * Serves as the main entry point for all analytics operations.
 */
class AnalyticsService implements AnalyticsServiceInterface
{
	/**
	 * Event logger instance.
	 *
	 * @var EventLogger
	 */
	private EventLogger $eventLogger;

	/**
	 * Analytics aggregation service.
	 *
	 * @var AnalyticsAggregationServiceInterface
	 */
	private AnalyticsAggregationServiceInterface $aggregationService;

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
	 * @param EventLogger                          $eventLogger Event logger instance.
	 * @param AnalyticsAggregationServiceInterface $aggregationService Aggregation service instance.
	 * @param DailyAnalyticsRepository             $dailyRepository Daily analytics repository.
	 * @param HourlyAnalyticsRepository            $hourlyRepository Hourly analytics repository.
	 * @param FaqAnalyticsRepository               $faqRepository FAQ analytics repository.
	 * @param AgentAnalyticsRepository             $agentRepository Agent analytics repository.
	 */
	public function __construct(
		EventLogger $eventLogger,
		AnalyticsAggregationServiceInterface $aggregationService,
		DailyAnalyticsRepository $dailyRepository,
		HourlyAnalyticsRepository $hourlyRepository,
		FaqAnalyticsRepository $faqRepository,
		AgentAnalyticsRepository $agentRepository
	) {
		$this->eventLogger = $eventLogger;
		$this->aggregationService = $aggregationService;
		$this->dailyRepository = $dailyRepository;
		$this->hourlyRepository = $hourlyRepository;
		$this->faqRepository = $faqRepository;
		$this->agentRepository = $agentRepository;
	}

	/**
	 * {@inheritdoc}
	 */
	public function logEvent(string $event_type, array $data = [], array $contextData = []): bool
	{
		switch ($event_type) {
			case 'BOT_OPEN':
				return $this->eventLogger->logBotOpen($data, $contextData);

			case 'BOT_CLOSE':
				return $this->eventLogger->logBotClose($data, $contextData);

			case 'MESSAGE_SEND':
				return $this->eventLogger->logMessageSend(
					$data['message'] ?? '',
					$data,
					$contextData
				);

			case 'NAVIGATION':
				return $this->eventLogger->logNavigation(
					$data['from_section'] ?? 'unknown',
					$data['to_section'] ?? 'unknown',
					$data,
					$contextData
				);

			case 'FAQ_CLICK':
				return $this->eventLogger->logFaqClick(
					(int)($data['faq_id'] ?? 0),
					$data['faq_question'] ?? '',
					$data,
					$contextData
				);

			case 'FAQ_SEARCH':
				return $this->eventLogger->logFaqSearch(
					$data['search_term'] ?? '',
					(int)($data['results_count'] ?? 0),
					$data,
					$contextData
				);

			case 'FAQ_HELPFUL':
				return $this->eventLogger->logFaqHelpful(
					(int)($data['faq_id'] ?? 0),
					$data['faq_question'] ?? '',
					$data,
					$contextData
				);

			case 'FAQ_NOT_HELPFUL':
				return $this->eventLogger->logFaqNotHelpful(
					(int)($data['faq_id'] ?? 0),
					$data['faq_question'] ?? '',
					$data,
					$contextData
				);

			case 'REDIRECT_TO_PLATFORM':
				return $this->eventLogger->logRedirectToPlatform(
					$data['platform'] ?? 'unknown',
					$data,
					$contextData
				);

			case 'AGENT_ASSIGNMENT':
				return $this->eventLogger->logAgentAssignment(
					(int)($data['agent_id'] ?? 0),
					$data['agent_name'] ?? '',
					$data['platform'] ?? 'unknown',
					$data['status'] ?? 'success',
					$data,
					$contextData
				);

			case 'FUNNEL_STEP':
				return $this->eventLogger->logFunnelStep(
					$data['funnel_id'] ?? 'default',
					$data['step_name'] ?? 'unknown',
					$data,
					$contextData
				);

			case 'FUNNEL_COMPLETE':
				return $this->eventLogger->logFunnelComplete(
					$data['funnel_id'] ?? 'default',
					$data,
					$contextData
				);

			case 'FUNNEL_ABANDON':
				return $this->eventLogger->logFunnelAbandon(
					$data['funnel_id'] ?? 'default',
					(int)($data['last_block_order'] ?? 1),
					$data,
					$contextData
				);

			// For events without specific convenience methods, use the generic logEvent
			default:
				return $this->eventLogger->logEvent($event_type, $data, $contextData);
		}
	}

	/**
	 * {@inheritdoc}
	 */
	public function getDashboardOverview(int $site_id, string $start_date, string $end_date): array
	{
		// Query aggregated tables directly with user timezone dates (no UTC conversion needed)
		$totals = $this->dailyRepository->getAggregatedTotals($site_id, $start_date, $end_date);

		// Get comparison data (previous period)
		$timeRange = $this->getTimeRangeBoundaries('previous_period', $start_date, $end_date);
		$previousTotals = $this->dailyRepository->getAggregatedTotals(
			$site_id,
			$timeRange['start'],
			$timeRange['end']
		);

		// Calculate growth rates
		$overview = $this->calculateGrowthRates($totals, $previousTotals);

		// Add time range info in WordPress timezone
		$overview['current_period'] = ['start' => $start_date, 'end' => $end_date];
		$overview['previous_period'] = $timeRange;
		$overview['timezone_info'] = AnalyticsTimezoneHelper::getTimezoneInfo();

		return $overview;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getTimeRangeBoundaries(string $time_range, ?string $current_start = null, ?string $current_end = null): array
	{
		$wpTimezone = AnalyticsTimezoneHelper::getWordPressTimezoneObject();
		$now = new DateTime('now', $wpTimezone);

		switch ($time_range) {
			case 'today':
				return [
					'start' => $now->format('Y-m-d'),
					'end' => $now->format('Y-m-d'),
				];

			case 'this_week':
				$startOfWeek = clone $now;
				$startOfWeek->modify('monday this week');
				return [
					'start' => $startOfWeek->format('Y-m-d'),
					'end' => $now->format('Y-m-d'),
				];

			case 'last_month':
				$lastMonth = clone $now;
				$lastMonth->modify('-1 month');
				return [
					'start' => $lastMonth->format('Y-m-01'),
					'end' => $lastMonth->format('Y-m-t'),
				];

			case 'previous_period':
				if ($current_start && $current_end) {
					// Calculate the duration of current period
					$currentStartDate = new DateTime($current_start, $wpTimezone);
					$currentEndDate = new DateTime($current_end, $wpTimezone);
					$duration = $currentStartDate->diff($currentEndDate)->days;

					// Calculate previous period with same duration
					$previousEnd = clone $currentStartDate;
					$previousEnd->modify('-1 day');
					$previousStart = clone $previousEnd;
					$previousStart->modify("-{$duration} days");

					return [
						'start' => $previousStart->format('Y-m-d'),
						'end' => $previousEnd->format('Y-m-d'),
					];
				}
				// Fallback to last 30 days
				return [
					'start' => $now->modify('-30 days')->format('Y-m-d'),
					'end' => $now->format('Y-m-d'),
				];

			case 'this_month':
			default:
				return [
					'start' => $now->format('Y-m-01'),
					'end' => $now->format('Y-m-d'),
				];
		}
	}

	/**
	 * Calculate growth rates between current and previous period data.
	 *
	 * @param array $current Current period data.
	 * @param array $previous Previous period data.
	 * @return array Data with growth rates included.
	 */
	private function calculateGrowthRates(array $current, array $previous): array
	{
		$result = $current;

		// Metrics to calculate growth for
		$growthMetrics = [
			'total_user_interactions',
			'total_redirects',
			'total_bot_opens',
			'total_faq_clicks',
			'total_agent_assignments',
			'unique_users',
			'unique_sessions',
		];

		foreach ($growthMetrics as $metric) {
			$currentValue = (int)($current[$metric] ?? 0);
			$previousValue = (int)($previous[$metric] ?? 0);

			$growthRate = 0;
			if ($previousValue > 0) {
				$growthRate = (($currentValue - $previousValue) / $previousValue) * 100;
			}

			$result[$metric . '_growth'] = round($growthRate, 2);
			$result[$metric . '_previous'] = $previousValue;
		}

		return $result;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getBusyTimes(int $site_id, string $start_date, string $end_date): array
	{
		// Get hourly data
		$hourlyData = $this->hourlyRepository->getBusyTimesData($site_id, $start_date, $end_date);

		// Calculate peak analysis from the busy times
		$peakAnalysis = $this->hourlyRepository->calculatePeakAnalysisFromData($hourlyData);

		$result = [
			'hourly_breakdown' => $hourlyData,
			'peak_analysis' => $peakAnalysis,
			'period' => ['start' => $start_date, 'end' => $end_date],
			'timezone_info' => AnalyticsTimezoneHelper::getTimezoneInfo(),
		];

		return $result;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getFaqAnalytics(int $site_id, string $start_date, string $end_date): array
	{
		// Query aggregated tables directly with user timezone dates (no UTC conversion needed)
		$faqPerformance = $this->faqRepository->getFaqPerformanceAnalytics($site_id, $start_date, $end_date);

		// Get top FAQs by clicks using user timezone dates
		$topFaqs = $this->faqRepository->getTopFaqsByClicks($site_id, $start_date, $end_date, 10);

		// Get aggregated FAQ totals using user timezone dates
		$totals = $this->faqRepository->getAggregatedTotals($site_id, $start_date, $end_date);

		// Get trend analysis (current vs previous period)
		$timeRange = $this->getTimeRangeBoundaries('previous_period', $start_date, $end_date);
		$trendAnalysis = $this->faqRepository->getFaqTrendAnalysis(
			$site_id,
			$start_date,
			$end_date,
			$timeRange['start'],
			$timeRange['end']
		);

		$result = [
			'performance_analytics' => $faqPerformance,
			'top_faqs' => $topFaqs,
			'totals' => $totals,
			'trend_analysis' => $trendAnalysis,
			'period' => ['start' => $start_date, 'end' => $end_date],
			'timezone_info' => AnalyticsTimezoneHelper::getTimezoneInfo(),
		];

		return $result;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getAgentPerformance(int $site_id, string $start_date, string $end_date): array
	{
		// Query aggregated tables directly with user timezone dates (no UTC conversion needed)
		$agentStats = $this->agentRepository->getAgentPerformanceStats($site_id, $start_date, $end_date);

		// Get workload distribution using user timezone dates
		$workloadDistribution = $this->agentRepository->getAgentWorkloadDistribution($site_id, $start_date, $end_date);

		// Get aggregated agent totals using user timezone dates
		$totals = $this->agentRepository->getAggregatedTotals($site_id, $start_date, $end_date);

		// Get trend analysis (current vs previous period)
		$timeRange = $this->getTimeRangeBoundaries('previous_period', $start_date, $end_date);
		$trendAnalysis = $this->agentRepository->getAgentTrendAnalysis(
			$site_id,
			$start_date,
			$end_date,
			$timeRange['start'],
			$timeRange['end']
		);

		$result = [
			'agent_statistics' => $agentStats,
			'workload_distribution' => $workloadDistribution,
			'totals' => $totals,
			'trend_analysis' => $trendAnalysis,
			'period' => ['start' => $start_date, 'end' => $end_date],
			'timezone_info' => AnalyticsTimezoneHelper::getTimezoneInfo(),
		];

		return $result;
	}

	/**
	 * Get funnel analytics data for a date range.
	 *
	 * @param int    $site_id    Site ID.
	 * @param string $start_date Start date (Y-m-d).
	 * @param string $end_date   End date (Y-m-d).
	 * @return array Funnel analytics data.
	 */
	public function getFunnelAnalytics(int $site_id, string $start_date, string $end_date): array
	{
		// Stub method - Pro version overrides this to provide funnel analytics
		return ['overview' => [], 'funnel_performance' => []];
	}

	/**
	 * Get detailed funnel step analysis for a specific funnel.
	 *
	 * @param int    $site_id    Site ID.
	 * @param string $funnel_id  Funnel ID.
	 * @param string $start_date Start date (Y-m-d).
	 * @param string $end_date   End date (Y-m-d).
	 * @return array Funnel step analysis data.
	 */
	public function getFunnelStepAnalysis(int $site_id, string $funnel_id, string $start_date, string $end_date): array
	{
		// Stub method - Pro version overrides this to provide funnel step analysis
		return ['funnel_summary' => [], 'block_analysis' => []];
	}

	/**
	 * {@inheritdoc}
	 */
	public function processAnalyticsData(?int $limit_hours = null): array
	{
		// Use timezone-aware date calculations
		$wpTimezone = AnalyticsTimezoneHelper::getWordPressTimezoneObject();
		$now = new DateTime('now', $wpTimezone);

		if ($limit_hours !== null) {
			// Calculate timezone-aware date range
			$endDate = $now->format('Y-m-d');
			$startDateTime = clone $now;
			$startDateTime->modify("-{$limit_hours} hours");
			$startDate = $startDateTime->format('Y-m-d');
		} else {
			$startDate = null;
			$endDate = null;
		}

		// Process all aggregate types
		return $this->aggregationService->processAllAggregates($startDate, $endDate);
	}
}
