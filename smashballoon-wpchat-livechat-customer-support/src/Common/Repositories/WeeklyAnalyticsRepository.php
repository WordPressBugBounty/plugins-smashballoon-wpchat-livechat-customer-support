<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\AnalyticsRepositoryInterface;
use DateTime;
use wpdb;

/**
 * Repository for weekly analytics aggregates.
 * Aggregates data from the daily summary table for weekly views.
 */
class WeeklyAnalyticsRepository implements AnalyticsRepositoryInterface
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	private wpdb $wpdb;

	/**
	 * Daily summary table name.
	 *
	 * @var string
	 */
	private string $dailyTableName;

	/**
	 * Constructor.
	 *
	 * @param wpdb $wpdb WordPress database instance.
	 */
	public function __construct(wpdb $wpdb)
	{
		$this->wpdb = $wpdb;
		$this->dailyTableName = $wpdb->prefix . 'wpchat_daily_site_summary';
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
					YEARWEEK(summary_date, 3) as week_id,
					MIN(summary_date) as week_start_date,
					MAX(summary_date) as week_end_date,
					SUM(total_user_interactions) as weekly_user_interactions,
					SUM(total_redirects) as weekly_redirects,
					SUM(total_bot_opens) as weekly_bot_opens,
					SUM(total_faq_clicks) as weekly_faq_clicks,
					SUM(total_funnel_completions) as weekly_funnel_completions,
					SUM(total_agent_assignments) as weekly_agent_assignments,
					SUM(unique_users) as weekly_unique_users,
					SUM(unique_sessions) as weekly_unique_sessions,
					COUNT(DISTINCT summary_date) as active_days
				FROM {$this->dailyTableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY week_id
				ORDER BY week_id ASC",
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
		// For weekly, derive week ID from date in WordPress timezone (summary_date is stored in WP timezone)
		$week_id = (new DateTime($date))->format('oW'); // YYYYWW format using ISO-8601 year+week
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					YEARWEEK(summary_date, 3) as week_id,
					MIN(summary_date) as week_start_date,
					MAX(summary_date) as week_end_date,
					SUM(total_user_interactions) as weekly_user_interactions,
					SUM(total_redirects) as weekly_redirects,
					SUM(total_bot_opens) as weekly_bot_opens,
					SUM(total_faq_clicks) as weekly_faq_clicks,
					SUM(total_funnel_completions) as weekly_funnel_completions,
					SUM(total_agent_assignments) as weekly_agent_assignments,
					SUM(unique_users) as weekly_unique_users,
					SUM(unique_sessions) as weekly_unique_sessions,
					COUNT(DISTINCT summary_date) as active_days
				FROM {$this->dailyTableName}
				WHERE site_id = %d
				AND YEARWEEK(summary_date, 3) = %s
				GROUP BY week_id",
				$site_id,
				$week_id
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return $results[0] ?? [];
	}

	/**
	 * {@inheritdoc}
	 */
	public function getUniqueUsersCount(int $site_id, string $start_date, string $end_date): int
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$result = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT SUM(unique_users) as total_unique_users
				FROM {$this->dailyTableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s",
				$site_id,
				$start_date,
				$end_date
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return (int) ($result ?: 0);
	}

	/**
	 * {@inheritdoc}
	 */
	public function getUniqueSessionsCount(int $site_id, string $start_date, string $end_date): int
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$result = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT SUM(unique_sessions) as total_unique_sessions
				FROM {$this->dailyTableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s",
				$site_id,
				$start_date,
				$end_date
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return (int) ($result ?: 0);
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
					SUM(total_user_interactions) as total_user_interactions,
					SUM(total_redirects) as total_redirects,
					SUM(total_bot_opens) as total_bot_opens,
					SUM(total_faq_clicks) as total_faq_clicks,
					SUM(total_funnel_completions) as total_funnel_completions,
					SUM(total_agent_assignments) as total_agent_assignments,
					SUM(unique_users) as unique_users,
					SUM(unique_sessions) as unique_sessions,
					COUNT(DISTINCT summary_date) as active_days,
					COUNT(DISTINCT YEARWEEK(summary_date, 3)) as active_weeks
				FROM {$this->dailyTableName}
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
				'total_user_interactions' => 0,
				'total_redirects' => 0,
				'total_bot_opens' => 0,
				'total_faq_clicks' => 0,
				'total_funnel_completions' => 0,
				'total_agent_assignments' => 0,
				'unique_users' => 0,
				'unique_sessions' => 0,
				'active_days' => 0,
				'active_weeks' => 0,
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
			'unique_users' => (int) $result['unique_users'],
			'unique_sessions' => (int) $result['unique_sessions'],
			'active_days' => (int) $result['active_days'],
			'active_weeks' => (int) $result['active_weeks'],
		];
	}

	/**
	 * {@inheritdoc}
	 */
	public function getTableName(): string
	{
		return $this->dailyTableName;
	}

	/**
	 * Get weekly trends with growth rates.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of weekly trends with growth rates.
	 */
	public function getWeeklyTrends(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					YEARWEEK(summary_date, 3) as week_id,
					MIN(summary_date) as week_start_date,
					MAX(summary_date) as week_end_date,
					SUM(total_user_interactions) as weekly_user_interactions,
					SUM(total_redirects) as weekly_redirects,
					SUM(unique_users) as weekly_unique_users,
					LAG(SUM(total_user_interactions), 1) OVER (ORDER BY YEARWEEK(summary_date, 3)) as prev_user_interactions,
					LAG(SUM(total_redirects), 1) OVER (ORDER BY YEARWEEK(summary_date, 3)) as prev_redirects,
					LAG(SUM(unique_users), 1) OVER (ORDER BY YEARWEEK(summary_date, 3)) as prev_unique_users
				FROM {$this->dailyTableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY week_id
				ORDER BY week_id ASC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		// Process results to calculate growth rates
		$processedResults = [];
		foreach ($results as $result) {
			$current_user_interactions = (int) $result['weekly_user_interactions'];
			$prev_user_interactions = (int) $result['prev_user_interactions'];
			$current_redirects = (int) $result['weekly_redirects'];
			$prev_redirects = (int) $result['prev_redirects'];
			$current_users = (int) $result['weekly_unique_users'];
			$prev_users = (int) $result['prev_unique_users'];

			// Calculate growth rates
			$user_interactions_growth = $prev_user_interactions > 0 ? (($current_user_interactions - $prev_user_interactions) / $prev_user_interactions) * 100 : 0;
			$redirects_growth = $prev_redirects > 0 ? (($current_redirects - $prev_redirects) / $prev_redirects) * 100 : 0;
			$users_growth = $prev_users > 0 ? (($current_users - $prev_users) / $prev_users) * 100 : 0;

			$processedResults[] = [
				'week_id' => $result['week_id'],
				'week_start_date' => $result['week_start_date'],
				'week_end_date' => $result['week_end_date'],
				'weekly_user_interactions' => $current_user_interactions,
				'weekly_redirects' => $current_redirects,
				'weekly_unique_users' => $current_users,
				'prev_user_interactions' => $prev_user_interactions,
				'prev_redirects' => $prev_redirects,
				'prev_unique_users' => $prev_users,
				'user_interactions_growth_rate' => round($user_interactions_growth, 2),
				'redirects_growth_rate' => round($redirects_growth, 2),
				'users_growth_rate' => round($users_growth, 2),
			];
		}

		return $processedResults;
	}

	/**
	 * Get weekly performance summary.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of weekly performance metrics.
	 */
	public function getWeeklyPerformanceSummary(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					YEARWEEK(summary_date, 3) as week_id,
					MIN(summary_date) as week_start_date,
					MAX(summary_date) as week_end_date,
					SUM(total_user_interactions) as weekly_user_interactions,
					SUM(total_redirects) as weekly_redirects,
					SUM(total_bot_opens) as weekly_bot_opens,
					SUM(unique_users) as weekly_unique_users,
					AVG(total_user_interactions) as avg_daily_user_interactions,
					MAX(total_user_interactions) as peak_daily_user_interactions,
					COUNT(DISTINCT summary_date) as active_days,
					(SUM(total_redirects) / NULLIF(SUM(total_bot_opens), 0)) * 100 as conversion_rate
				FROM {$this->dailyTableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY week_id
				ORDER BY week_id ASC",
				$site_id,
				$start_date,
				$end_date
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		// Process results to format numeric values
		$processedResults = [];
		foreach ($results as $result) {
			$processedResults[] = [
				'week_id' => $result['week_id'],
				'week_start_date' => $result['week_start_date'],
				'week_end_date' => $result['week_end_date'],
				'weekly_user_interactions' => (int) $result['weekly_user_interactions'],
				'weekly_redirects' => (int) $result['weekly_redirects'],
				'weekly_bot_opens' => (int) $result['weekly_bot_opens'],
				'weekly_unique_users' => (int) $result['weekly_unique_users'],
				'avg_daily_user_interactions' => round((float) $result['avg_daily_user_interactions'], 2),
				'peak_daily_user_interactions' => (int) $result['peak_daily_user_interactions'],
				'active_days' => (int) $result['active_days'],
				'conversion_rate' => round((float) $result['conversion_rate'], 2),
			];
		}

		return $processedResults;
	}
}
