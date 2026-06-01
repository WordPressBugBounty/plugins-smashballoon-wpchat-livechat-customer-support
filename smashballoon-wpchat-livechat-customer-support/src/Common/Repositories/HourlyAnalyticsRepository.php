<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\AnalyticsRepositoryInterface;
use wpdb;

/**
 * Repository for hourly analytics aggregates.
 * Interacts with the wpchat_hourly_site_summary table.
 */
class HourlyAnalyticsRepository implements AnalyticsRepositoryInterface
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	private wpdb $wpdb;

	/**
	 * Table name for hourly summaries.
	 *
	 * @var string
	 */
	private string $tableName;

	/**
	 * Constructor.
	 *
	 * @param wpdb $wpdb WordPress database instance.
	 */
	public function __construct(wpdb $wpdb)
	{
		$this->wpdb = $wpdb;
		$this->tableName = $wpdb->prefix . 'wpchat_hourly_site_summary';
	}

	/**
	 * {@inheritdoc}
	 */
	public function getSummaryData(int $site_id, string $start_date, string $end_date): array
	{
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT 
					site_id,
					summary_date,
					summary_hour,
					total_user_interactions,
					total_redirects,
					total_bot_opens,
					total_faq_clicks,
					total_agent_assignments,
					unique_users,
					unique_sessions,
					created_at,
					updated_at
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s 
				ORDER BY summary_date ASC, summary_hour ASC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);

		return $results ?: [];
	}

	/**
	 * {@inheritdoc}
	 */
	public function getSinglePeriodSummary(int $site_id, string $date, $period_unit = null): array
	{
		// For hourly, period_unit would be the specific hour (0-23)
		if (is_null($period_unit) || !is_numeric($period_unit) || $period_unit < 0 || $period_unit > 23) {
			// If no specific hour, return all hours for the day
			return $this->getSummaryData($site_id, $date, $date);
		}

		$result = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT 
					site_id,
					summary_date,
					summary_hour,
					total_user_interactions,
					total_redirects,
					total_bot_opens,
					total_faq_clicks,
					total_agent_assignments,
					unique_users,
					unique_sessions,
					created_at,
					updated_at
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date = %s 
				AND summary_hour = %d",
				$site_id,
				$date,
				$period_unit
			),
			ARRAY_A
		);

		return $result ?: [];
	}

	/**
	 * {@inheritdoc}
	 */
	public function getUniqueUsersCount(int $site_id, string $start_date, string $end_date): int
	{
		$result = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT SUM(unique_users) as total_unique_users
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s",
				$site_id,
				$start_date,
				$end_date
			)
		);

		return (int) ($result ?: 0);
	}

	/**
	 * {@inheritdoc}
	 */
	public function getUniqueSessionsCount(int $site_id, string $start_date, string $end_date): int
	{
		$result = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT SUM(unique_sessions) as total_unique_sessions
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s",
				$site_id,
				$start_date,
				$end_date
			)
		);

		return (int) ($result ?: 0);
	}

	/**
	 * {@inheritdoc}
	 */
	public function getAggregatedTotals(int $site_id, string $start_date, string $end_date): array
	{
		$result = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT 
					SUM(total_user_interactions) as total_user_interactions,
					SUM(total_redirects) as total_redirects,
					SUM(total_bot_opens) as total_bot_opens,
					SUM(total_faq_clicks) as total_faq_clicks,
					SUM(total_agent_assignments) as total_agent_assignments,
					SUM(unique_users) as unique_users,
					SUM(unique_sessions) as unique_sessions,
					COUNT(DISTINCT summary_date) as active_days,
					COUNT(DISTINCT CONCAT(summary_date, '-', summary_hour)) as active_hours
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);

		if (!$result) {
			return [
				'total_user_interactions' => 0,
				'total_redirects' => 0,
				'total_bot_opens' => 0,
				'total_faq_clicks' => 0,
				'total_agent_assignments' => 0,
				'unique_users' => 0,
				'unique_sessions' => 0,
				'active_days' => 0,
				'active_hours' => 0,
			];
		}

		// Convert string values to integers
		return [
			'total_user_interactions' => (int) $result['total_user_interactions'],
			'total_redirects' => (int) $result['total_redirects'],
			'total_bot_opens' => (int) $result['total_bot_opens'],
			'total_faq_clicks' => (int) $result['total_faq_clicks'],
			'total_agent_assignments' => (int) $result['total_agent_assignments'],
			'unique_users' => (int) $result['unique_users'],
			'unique_sessions' => (int) $result['unique_sessions'],
			'active_days' => (int) $result['active_days'],
			'active_hours' => (int) $result['active_hours'],
		];
	}

	/**
	 * {@inheritdoc}
	 */
	public function getTableName(): string
	{
		return $this->tableName;
	}

	/**
	 * Insert or update an hourly summary record.
	 *
	 * @param int    $site_id      The site ID.
	 * @param string $summary_date The summary date.
	 * @param int    $summary_hour The summary hour (0-23).
	 * @param array  $data         The summary data.
	 * @return bool Whether the operation was successful.
	 */
	public function upsertHourlySummary(int $site_id, string $summary_date, int $summary_hour, array $data): bool
	{
		$sql = $this->wpdb->prepare(
			"INSERT INTO {$this->tableName} (
				site_id,
				summary_date,
				summary_hour,
				total_user_interactions,
				total_redirects,
				total_bot_opens,
				total_faq_clicks,
				total_agent_assignments,
				unique_users,
				unique_sessions,
				timezone,
				created_at,
				updated_at
			) VALUES (
				%d, %s, %d, %d, %d, %d, %d, %d, %d, %d, %s, NOW(), NOW()
			) ON DUPLICATE KEY UPDATE
				total_user_interactions = VALUES(total_user_interactions),
				total_redirects = VALUES(total_redirects),
				total_bot_opens = VALUES(total_bot_opens),
				total_faq_clicks = VALUES(total_faq_clicks),
				total_agent_assignments = VALUES(total_agent_assignments),
				unique_users = VALUES(unique_users),
				unique_sessions = VALUES(unique_sessions),
				timezone = VALUES(timezone),
				updated_at = NOW()",
			$site_id,
			$summary_date,
			$summary_hour,
			$data['total_user_interactions'] ?? 0,
			$data['total_redirects'] ?? 0,
			$data['total_bot_opens'] ?? 0,
			$data['total_faq_clicks'] ?? 0,
			$data['total_agent_assignments'] ?? 0,
			$data['unique_users'] ?? 0,
			$data['unique_sessions'] ?? 0,
			$data['timezone'] ?? 'UTC'
		);

		return $this->wpdb->query($sql) !== false;
	}

	/**
	 * Delete hourly summary records for a specific date range.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return int Number of deleted records.
	 */
	public function deleteHourlySummaries(int $site_id, string $start_date, string $end_date): int
	{
		$affected_rows = $this->wpdb->query(
			$this->wpdb->prepare(
				"DELETE FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s",
				$site_id,
				$start_date,
				$end_date
			)
		);

		return (int) $affected_rows;
	}

	/**
	 * Get hourly summaries for busy times analysis.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of hourly summaries grouped by hour.
	 */
	public function getBusyTimesData(int $site_id, string $start_date, string $end_date): array
	{
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT 
					summary_hour,
					SUM(total_user_interactions) as total_user_interactions,
					SUM(total_redirects) as total_redirects,
					SUM(unique_users) as unique_users,
					COUNT(DISTINCT summary_date) as active_days,
					AVG(total_user_interactions) as avg_interactions,
					AVG(total_redirects) as avg_redirects
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s
				GROUP BY summary_hour
				ORDER BY summary_hour ASC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);

		// Process results to include calculated averages
		$processedResults = [];
		foreach ($results as $result) {
			$activeDays = max(1, (int) $result['active_days']);
			$processedResults[] = [
				'hour' => (int) $result['summary_hour'],
				'total_user_interactions' => (int) $result['total_user_interactions'],
				'total_redirects' => (int) $result['total_redirects'],
				'unique_users' => (int) $result['unique_users'],
				'active_days' => $activeDays,
				'avg_interactions' => round((float) $result['avg_interactions'], 2),
				'avg_redirects' => round((float) $result['avg_redirects'], 2),
			];
		}

		return $processedResults;
	}

	/**
	 * Get hourly summaries with peak hour identification.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array including peak hour statistics.
	 */
	public function getHourlySummariesWithPeaks(int $site_id, string $start_date, string $end_date): array
	{
		$busyTimes = $this->getBusyTimesData($site_id, $start_date, $end_date);

		return $this->calculatePeakAnalysisFromData($busyTimes);
	}

	/**
	 * Calculate peak analysis from existing hourly data.
	 *
	 * @param array $hourlyData Array of hourly data from getBusyTimesData().
	 * @return array Array including peak hour statistics.
	 */
	public function calculatePeakAnalysisFromData(array $hourlyData): array
	{
		if (empty($hourlyData)) {
			return [
				'hourly_data' => [],
				'peak_hour' => null,
				'peak_interactions' => 0,
				'quietest_hour' => null,
				'quietest_interactions' => 0,
			];
		}

		// Find peak and quietest hours
		$peakHour = null;
		$peakInteractions = 0;
		$quietestHour = null;
		$quietestInteractions = PHP_INT_MAX;

		foreach ($hourlyData as $hour) {
			if ($hour['total_user_interactions'] > $peakInteractions) {
				$peakInteractions = $hour['total_user_interactions'];
				$peakHour = $hour['hour'];
			}
			if ($hour['total_user_interactions'] < $quietestInteractions) {
				$quietestInteractions = $hour['total_user_interactions'];
				$quietestHour = $hour['hour'];
			}
		}

		return [
			'hourly_data' => $hourlyData,
			'peak_hour' => $peakHour,
			'peak_interactions' => $peakInteractions,
			'quietest_hour' => $quietestHour,
			'quietest_interactions' => $quietestInteractions,
		];
	}
}
