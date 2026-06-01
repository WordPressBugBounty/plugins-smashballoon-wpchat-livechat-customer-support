<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\AnalyticsRepositoryInterface;
use wpdb;

/**
 * Repository for daily analytics aggregates.
 * Interacts with the wpchat_daily_site_summary table.
 */
class DailyAnalyticsRepository implements AnalyticsRepositoryInterface
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	private wpdb $wpdb;

	/**
	 * Table name for daily summaries.
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
		$this->tableName = $wpdb->prefix . 'wpchat_daily_site_summary';
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
					total_user_interactions,
					total_redirects,
					total_bot_opens,
					total_faq_clicks,
					total_funnel_completions,
					total_agent_assignments,
					total_successful_assignments,
					total_failed_assignments,
					unique_users,
					unique_sessions,
					conversion_rate,
					created_at,
					updated_at
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s 
				ORDER BY summary_date ASC",
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
		$result = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT 
					site_id,
					summary_date,
					total_user_interactions,
					total_redirects,
					total_bot_opens,
					total_faq_clicks,
					total_funnel_completions,
					total_agent_assignments,
					total_successful_assignments,
					total_failed_assignments,
					unique_users,
					unique_sessions,
					conversion_rate,
					created_at,
					updated_at
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date = %s",
				$site_id,
				$date
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
					SUM(total_funnel_completions) as total_funnel_completions,
					SUM(total_agent_assignments) as total_agent_assignments,
					SUM(total_successful_assignments) as total_successful_assignments,
					SUM(total_failed_assignments) as total_failed_assignments,
					SUM(unique_users) as unique_users,
					SUM(unique_sessions) as unique_sessions,
					AVG(conversion_rate) as avg_conversion_rate,
					COUNT(DISTINCT summary_date) as active_days
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
				'total_funnel_completions' => 0,
				'total_agent_assignments' => 0,
				'total_successful_assignments' => 0,
				'total_failed_assignments' => 0,
				'unique_users' => 0,
				'unique_sessions' => 0,
				'avg_conversion_rate' => 0,
				'active_days' => 0,
			];
		}

		// Convert string values to integers
		return [
			'total_user_interactions' => (int) $result['total_user_interactions'],
			'total_redirects' => (int) $result['total_redirects'],
			'total_bot_opens' => (int) $result['total_bot_opens'],
			'total_faq_clicks' => (int) $result['total_faq_clicks'],
			'total_funnel_completions' => (int) $result['total_funnel_completions'],
			'total_agent_assignments' => (int) $result['total_agent_assignments'],
			'total_successful_assignments' => (int) $result['total_successful_assignments'],
			'total_failed_assignments' => (int) $result['total_failed_assignments'],
			'unique_users' => (int) $result['unique_users'],
			'unique_sessions' => (int) $result['unique_sessions'],
			'avg_conversion_rate' => round((float) $result['avg_conversion_rate'], 2),
			'active_days' => (int) $result['active_days'],
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
	 * Insert or update a daily summary record.
	 *
	 * @param int    $site_id      The site ID.
	 * @param string $summary_date The summary date.
	 * @param array  $data         The summary data.
	 * @return bool Whether the operation was successful.
	 */
	public function upsertDailySummary(int $site_id, string $summary_date, array $data): bool
	{
		$sql = $this->wpdb->prepare(
			"INSERT INTO {$this->tableName} (
				site_id,
				summary_date,
				total_user_interactions,
				total_redirects,
				total_bot_opens,
				total_faq_clicks,
				total_funnel_completions,
				total_agent_assignments,
				total_successful_assignments,
				total_failed_assignments,
				unique_users,
				unique_sessions,
				conversion_rate,
				timezone,
				created_at,
				updated_at
			) VALUES (
				%d, %s, %d, %d, %d, %d, %d, %d, %d, %d, %d, %d, %f, %s, NOW(), NOW()
			) ON DUPLICATE KEY UPDATE
				total_user_interactions = VALUES(total_user_interactions),
				total_redirects = VALUES(total_redirects),
				total_bot_opens = VALUES(total_bot_opens),
				total_faq_clicks = VALUES(total_faq_clicks),
				total_funnel_completions = VALUES(total_funnel_completions),
				total_agent_assignments = VALUES(total_agent_assignments),
				total_successful_assignments = VALUES(total_successful_assignments),
				total_failed_assignments = VALUES(total_failed_assignments),
				unique_users = VALUES(unique_users),
				unique_sessions = VALUES(unique_sessions),
				conversion_rate = VALUES(conversion_rate),
				timezone = VALUES(timezone),
				updated_at = NOW()",
			$site_id,
			$summary_date,
			$data['total_user_interactions'] ?? 0,
			$data['total_redirects'] ?? 0,
			$data['total_bot_opens'] ?? 0,
			$data['total_faq_clicks'] ?? 0,
			$data['total_funnel_completions'] ?? 0,
			$data['total_agent_assignments'] ?? 0,
			$data['total_successful_assignments'] ?? 0,
			$data['total_failed_assignments'] ?? 0,
			$data['unique_users'] ?? 0,
			$data['unique_sessions'] ?? 0,
			$data['conversion_rate'] ?? 0.0,
			$data['timezone'] ?? 'UTC'
		);

		return $this->wpdb->query($sql) !== false;
	}

	/**
	 * Delete daily summary records for a specific date range.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return int Number of deleted records.
	 */
	public function deleteDailySummaries(int $site_id, string $start_date, string $end_date): int
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
	 * Get daily summaries with trend comparison.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of daily summaries with trend indicators.
	 */
	public function getDailySummariesWithTrend(int $site_id, string $start_date, string $end_date): array
	{
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT 
					summary_date,
					total_interactions,
					total_redirects,
					total_bot_opens,
					total_faq_clicks,
					unique_users,
					unique_sessions,
					LAG(total_interactions, 1) OVER (ORDER BY summary_date) as prev_interactions,
					LAG(total_redirects, 1) OVER (ORDER BY summary_date) as prev_redirects,
					LAG(unique_users, 1) OVER (ORDER BY summary_date) as prev_unique_users
				FROM {$this->tableName}
				WHERE site_id = %d 
				AND summary_date BETWEEN %s AND %s 
				ORDER BY summary_date ASC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);

		return $results ?: [];
	}
}
