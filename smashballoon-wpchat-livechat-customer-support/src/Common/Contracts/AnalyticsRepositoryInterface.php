<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface for analytics repository implementations.
 * Provides a common interface for retrieving analytics data across different time periods.
 */
interface AnalyticsRepositoryInterface
{
	/**
	 * Retrieves summary data for a given site within a date range.
	 * The structure of the returned data will depend on the implementation (daily, hourly, etc.).
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return array An array of data rows, or an empty array.
	 */
	public function getSummaryData(int $site_id, string $start_date, string $end_date): array;

	/**
	 * Retrieves specific metrics for a single period (e.g., a single day or hour).
	 *
	 * @param int    $site_id The WordPress site ID.
	 * @param string $date    Date in 'YYYY-MM-DD' format.
	 * @param mixed  $period_unit Optional, e.g., hour for hourly data.
	 * @return array A single data row, or an empty array.
	 */
	public function getSinglePeriodSummary(int $site_id, string $date, $period_unit = null): array;

	/**
	 * Get the total count of unique users for a given site within a date range.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return int The total unique user count.
	 */
	public function getUniqueUsersCount(int $site_id, string $start_date, string $end_date): int;

	/**
	 * Get the total count of unique sessions for a given site within a date range.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return int The total unique session count.
	 */
	public function getUniqueSessionsCount(int $site_id, string $start_date, string $end_date): int;

	/**
	 * Get aggregated totals for a given site within a date range.
	 *
	 * @param int    $site_id    The WordPress site ID.
	 * @param string $start_date Start date in 'YYYY-MM-DD' format.
	 * @param string $end_date   End date in 'YYYY-MM-DD' format.
	 * @return array Array containing aggregated totals.
	 */
	public function getAggregatedTotals(int $site_id, string $start_date, string $end_date): array;

	/**
	 * Get the table name used by this repository.
	 *
	 * @return string The table name.
	 */
	public function getTableName(): string;
}
