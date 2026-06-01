<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface for analytics service implementations.
 * Provides a high-level interface for analytics operations.
 */
interface AnalyticsServiceInterface
{
	/**
	 * Log an event to the analytics system.
	 *
	 * The EventLogger will automatically assign site_id, user_id, and session_id
	 * when not provided, using current WordPress context and session management.
	 *
	 * @param string $event_type  The type of event.
	 * @param array  $data        Event-specific data.
	 * @param array  $contextData Optional context data with site_id, user_id, session_id overrides.
	 * @return bool Whether the event was logged successfully.
	 */
	public function logEvent(string $event_type, array $data = [], array $contextData = []): bool;

	/**
	 * Get dashboard overview data for a given site.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return array Dashboard overview data.
	 */
	public function getDashboardOverview(int $site_id, string $start_date, string $end_date): array;

	/**
	 * Get busy times data for a given site.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return array Busy times data.
	 */
	public function getBusyTimes(int $site_id, string $start_date, string $end_date): array;

	/**
	 * Get FAQ analytics data for a given site.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return array FAQ analytics data.
	 */
	public function getFaqAnalytics(int $site_id, string $start_date, string $end_date): array;

	/**
	 * Get agent performance data for a given site.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return array Agent performance data.
	 */
	public function getAgentPerformance(int $site_id, string $start_date, string $end_date): array;

	/**
	 * Process raw analytics data into aggregated summaries.
	 *
	 * @param int|null $limit_hours Process only events from the last N hours (null for all).
	 * @return array Processing results.
	 */
	public function processAnalyticsData(?int $limit_hours = null): array;

	/**
	 * Get time range boundaries for common time periods.
	 *
	 * @param string $time_range The time range identifier (e.g., 'today', 'this_week', 'this_month').
	 * @return array Array with 'start' and 'end' date strings.
	 */
	public function getTimeRangeBoundaries(string $time_range): array;
}
