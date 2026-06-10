<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\AnalyticsRepositoryInterface;
use wpdb;

/**
 * Repository for agent analytics aggregates.
 * Interacts with the wpchat_agent_daily_summary table.
 */
class AgentAnalyticsRepository implements AnalyticsRepositoryInterface
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	private wpdb $wpdb;

	/**
	 * Table name for agent daily summaries.
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
		$this->tableName = $wpdb->prefix . 'wpchat_agent_daily_summary';
	}

	/**
	 * {@inheritdoc}
	 */
	public function getSummaryData(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					site_id,
					summary_date,
					agent_id,
					agent_name,
					agent_avatar,
					total_assignments,
					created_at,
					updated_at
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				ORDER BY summary_date ASC, total_assignments DESC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return $results ?: [];
	}

	/**
	 * {@inheritdoc}
	 */
	public function getSinglePeriodSummary(int $site_id, string $date, $period_unit = null): array
	{
		// For agent data, period_unit could be a specific agent ID
		if (!is_null($period_unit) && is_numeric($period_unit)) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
			$result = $this->wpdb->get_row(
				$this->wpdb->prepare(
					"SELECT
						site_id,
						summary_date,
						agent_id,
						agent_name,
						agent_avatar,
						total_assignments,
						created_at,
						updated_at
					FROM {$this->tableName}
					WHERE site_id = %d
					AND summary_date = %s
					AND agent_id = %d",
					$site_id,
					$date,
					$period_unit
				),
				ARRAY_A
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

			return $result ?: [];
		}

		// Return all agent data for the given date
		return $this->getSummaryData($site_id, $date, $date);
	}

	/**
	 * {@inheritdoc}
	 */
	public function getUniqueUsersCount(int $site_id, string $start_date, string $end_date): int
	{
		// Agent repository doesn't track unique users directly, return 0
		return 0;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getUniqueSessionsCount(int $site_id, string $start_date, string $end_date): int
	{
		// Agent repository doesn't track sessions directly, return 0
		return 0;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getAggregatedTotals(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$result = $this->wpdb->get_row(
			$this->wpdb->prepare(
				"SELECT
					SUM(total_assignments) as total_assignments,
					COUNT(DISTINCT agent_id) as unique_agents,
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
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		if (!$result) {
			return [
				'total_assignments' => 0,
				'unique_agents' => 0,
				'active_days' => 0,
			];
		}

		// Convert string values to integers
		return [
			'total_assignments' => (int) $result['total_assignments'],
			'unique_agents' => (int) $result['unique_agents'],
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
	 * Insert or update an agent daily summary record.
	 *
	 * @param int    $site_id      The site ID.
	 * @param string $summary_date The summary date.
	 * @param int    $agent_id     The agent ID.
	 * @param string $agent_name   The agent name.
	 * @param array  $data         The summary data.
	 * @return bool Whether the operation was successful.
	 */
	public function upsertAgentDailySummary(int $site_id, string $summary_date, int $agent_id, string $agent_name, array $data): bool
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$sql = $this->wpdb->prepare(
			"INSERT INTO {$this->tableName} (
				site_id,
				summary_date,
				agent_id,
				agent_name,
				agent_avatar,
				total_assignments,
				timezone,
				created_at,
				updated_at
			) VALUES (
				%d, %s, %d, %s, %s, %d, %s, NOW(), NOW()
			) ON DUPLICATE KEY UPDATE
				agent_name = VALUES(agent_name),
				agent_avatar = VALUES(agent_avatar),
				total_assignments = VALUES(total_assignments),
				timezone = VALUES(timezone),
				updated_at = NOW()",
			$site_id,
			$summary_date,
			$agent_id,
			$agent_name,
			$data['agent_avatar'] ?? null,
			$data['total_assignments'] ?? 0,
			$data['timezone'] ?? 'UTC'
		);

		return $this->wpdb->query($sql) !== false;
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
	}

	/**
	 * Delete agent daily summary records for a specific date range.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return int Number of deleted records.
	 */
	public function deleteAgentDailySummaries(int $site_id, string $start_date, string $end_date): int
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
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
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return (int) $affected_rows;
	}

	/**
	 * Get agent performance statistics with calculated metrics.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of agent performance data.
	 */
	public function getAgentPerformanceStats(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					agent_id,
					agent_name,
					MAX(agent_avatar) as agent_avatar,
					SUM(total_assignments) as total_assignments_period,
					COUNT(DISTINCT summary_date) as active_days,
					AVG(total_assignments) as avg_daily_assignments
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY agent_id, agent_name
				ORDER BY total_assignments_period DESC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		// Process results to calculate meaningful metrics
		$processedResults = [];
		foreach ($results as $result) {
			$totalAssignments = (int) $result['total_assignments_period'];
			$activeDays = (int) $result['active_days'];
			$avgDailyAssignments = round((float) $result['avg_daily_assignments'], 2);

			$processedResults[] = [
				'agent_id' => (int) $result['agent_id'],
				'agent_name' => $result['agent_name'],
				'agent_avatar' => $result['agent_avatar'],
				'total_assignments' => $totalAssignments,
				'active_days' => $activeDays,
				'avg_daily_assignments' => $avgDailyAssignments,
			];
		}

		return $processedResults;
	}

	/**
	 * Get agent statistics filtered by agent name.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $agent_name  The agent name.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of agent statistics.
	 */
	public function getAgentStatsByName(int $site_id, string $agent_name, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					agent_id,
					agent_name,
					MAX(agent_avatar) as agent_avatar,
					SUM(total_assignments) as total_assignments_period,
					COUNT(DISTINCT summary_date) as active_days,
					AVG(total_assignments) as avg_daily_assignments
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				AND agent_name = %s
				GROUP BY agent_id, agent_name",
				$site_id,
				$start_date,
				$end_date,
				$agent_name
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return $results ?: [];
	}

	/**
	 * Get agent workload distribution.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of agent workload data.
	 */
	public function getAgentWorkloadDistribution(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					agent_id,
					agent_name,
					MAX(agent_avatar) as agent_avatar,
					SUM(total_assignments) as total_assignments,
					COUNT(DISTINCT summary_date) as active_days,
					AVG(total_assignments) as avg_daily_assignments,
					MAX(total_assignments) as peak_daily_assignments
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY agent_id, agent_name
				ORDER BY total_assignments DESC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		// Calculate workload percentages
		$totalAssignments = array_sum(array_column($results, 'total_assignments'));
		$processedResults = [];

		foreach ($results as $result) {
			$agentAssignments = (int) $result['total_assignments'];
			$workloadPercentage = $totalAssignments > 0 ? round(($agentAssignments / $totalAssignments) * 100, 2) : 0;

			$processedResults[] = [
				'agent_id' => (int) $result['agent_id'],
				'agent_name' => $result['agent_name'],
				'agent_avatar' => $result['agent_avatar'],
				'total_assignments' => $agentAssignments,
				'active_days' => (int) $result['active_days'],
				'avg_daily_assignments' => round((float) $result['avg_daily_assignments'], 2),
				'peak_daily_assignments' => (int) $result['peak_daily_assignments'],
				'workload_percentage' => $workloadPercentage,
			];
		}

		return $processedResults;
	}

	/**
	 * Get agent trend analysis comparing two periods.
	 *
	 * @param int    $site_id           The site ID.
	 * @param string $current_start     Current period start date.
	 * @param string $current_end       Current period end date.
	 * @param string $previous_start    Previous period start date.
	 * @param string $previous_end      Previous period end date.
	 * @return array Array of agent trend data.
	 */
	public function getAgentTrendAnalysis(int $site_id, string $current_start, string $current_end, string $previous_start, string $previous_end): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$sql = $this->wpdb->prepare(
			"SELECT
				agent_id,
				agent_name,
				MAX(agent_avatar) as agent_avatar,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN total_assignments ELSE 0 END) as current_assignments,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN total_assignments ELSE 0 END) as previous_assignments,
				COUNT(DISTINCT CASE WHEN summary_date BETWEEN %s AND %s THEN summary_date END) as current_active_days,
				COUNT(DISTINCT CASE WHEN summary_date BETWEEN %s AND %s THEN summary_date END) as previous_active_days
			FROM {$this->tableName}
			WHERE site_id = %d
			AND (summary_date BETWEEN %s AND %s OR summary_date BETWEEN %s AND %s)
			GROUP BY agent_id, agent_name
			HAVING current_assignments > 0 OR previous_assignments > 0
			ORDER BY current_assignments DESC",
			$current_start,
			$current_end,
			$previous_start,
			$previous_end,
			$current_start,
			$current_end,
			$previous_start,
			$previous_end,
			$site_id,
			$current_start,
			$current_end,
			$previous_start,
			$previous_end
		);

		$results = $this->wpdb->get_results($sql, ARRAY_A);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		// Process results to calculate trend metrics
		$processedResults = [];
		foreach ($results as $result) {
			$currentAssignments = (int) $result['current_assignments'];
			$previousAssignments = (int) $result['previous_assignments'];
			$currentActiveDays = (int) $result['current_active_days'];
			$previousActiveDays = (int) $result['previous_active_days'];

			// Calculate growth rate
			$assignmentsGrowth = $previousAssignments > 0 ? (($currentAssignments - $previousAssignments) / $previousAssignments) * 100 : 0;

			// Calculate average daily assignments for each period
			$currentAvgDaily = $currentActiveDays > 0 ? round($currentAssignments / $currentActiveDays, 2) : 0;
			$previousAvgDaily = $previousActiveDays > 0 ? round($previousAssignments / $previousActiveDays, 2) : 0;

			$processedResults[] = [
				'agent_id' => (int) $result['agent_id'],
				'agent_name' => $result['agent_name'],
				'agent_avatar' => $result['agent_avatar'],
				'current_assignments' => $currentAssignments,
				'previous_assignments' => $previousAssignments,
				'current_active_days' => $currentActiveDays,
				'previous_active_days' => $previousActiveDays,
				'current_avg_daily_assignments' => $currentAvgDaily,
				'previous_avg_daily_assignments' => $previousAvgDaily,
				'assignments_growth_rate' => round($assignmentsGrowth, 2),
				'trend_direction' => $assignmentsGrowth > 0 ? 'up' : ($assignmentsGrowth < 0 ? 'down' : 'stable'),
			];
		}

		return $processedResults;
	}
}
