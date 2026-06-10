<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\AnalyticsRepositoryInterface;
use wpdb;

/**
 * Repository for FAQ analytics aggregates.
 * Interacts with the wpchat_faq_daily_summary table.
 */
class FaqAnalyticsRepository implements AnalyticsRepositoryInterface
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb
	 */
	private wpdb $wpdb;

	/**
	 * Table name for FAQ daily summaries.
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
		$this->tableName = $wpdb->prefix . 'wpchat_faq_daily_summary';
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
					faq_id,
					faq_question_text,
					total_clicks,
					unique_users,
					search_appearances,
					helpful_count,
					not_helpful_count,
					created_at,
					updated_at
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				ORDER BY summary_date ASC, total_clicks DESC",
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
		// For FAQ data, period_unit could be a specific FAQ ID
		if (!is_null($period_unit) && is_numeric($period_unit)) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
			$result = $this->wpdb->get_row(
				$this->wpdb->prepare(
					"SELECT
						site_id,
						summary_date,
						faq_id,
						faq_question_text,
						total_clicks,
						unique_users,
						search_appearances,
						helpful_count,
						not_helpful_count,
						created_at,
						updated_at
					FROM {$this->tableName}
					WHERE site_id = %d
					AND summary_date = %s
					AND faq_id = %d",
					$site_id,
					$date,
					$period_unit
				),
				ARRAY_A
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

			return $result ?: [];
		}

		// Return all FAQ data for the given date
		return $this->getSummaryData($site_id, $date, $date);
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
				FROM {$this->tableName}
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
		// FAQ repository doesn't track sessions directly, return 0
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
					SUM(total_clicks) as total_clicks,
					SUM(unique_users) as unique_users,
					SUM(search_appearances) as search_appearances,
					SUM(helpful_count) as total_helpful,
					SUM(not_helpful_count) as total_not_helpful,
					COUNT(DISTINCT faq_id) as unique_faqs,
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
				'total_clicks' => 0,
				'unique_users' => 0,
				'search_appearances' => 0,
				'total_helpful' => 0,
				'total_not_helpful' => 0,
				'unique_faqs' => 0,
				'active_days' => 0,
			];
		}

		// Convert string values to integers
		return [
			'total_clicks' => (int) $result['total_clicks'],
			'unique_users' => (int) $result['unique_users'],
			'search_appearances' => (int) $result['search_appearances'],
			'total_helpful' => (int) $result['total_helpful'],
			'total_not_helpful' => (int) $result['total_not_helpful'],
			'unique_faqs' => (int) $result['unique_faqs'],
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
	 * Insert or update an FAQ daily summary record.
	 *
	 * @param int    $site_id      The site ID.
	 * @param string $summary_date The summary date.
	 * @param int    $faq_id       The FAQ ID.
	 * @param string $faq_question_text The FAQ question text.
	 * @param array  $data         The summary data.
	 * @return bool Whether the operation was successful.
	 */
	public function upsertFaqDailySummary(int $site_id, string $summary_date, int $faq_id, string $faq_question_text, array $data): bool
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$sql = $this->wpdb->prepare(
			"INSERT INTO {$this->tableName} (
				site_id,
				summary_date,
				faq_id,
				faq_question_text,
				total_clicks,
				unique_users,
				search_appearances,
				helpful_count,
				not_helpful_count,
				timezone,
				created_at,
				updated_at
			) VALUES (
				%d, %s, %d, %s, %d, %d, %d, %d, %d, %s, NOW(), NOW()
			) ON DUPLICATE KEY UPDATE
				faq_question_text = VALUES(faq_question_text),
				total_clicks = VALUES(total_clicks),
				unique_users = VALUES(unique_users),
				search_appearances = VALUES(search_appearances),
				helpful_count = VALUES(helpful_count),
				not_helpful_count = VALUES(not_helpful_count),
				timezone = VALUES(timezone),
				updated_at = NOW()",
			$site_id,
			$summary_date,
			$faq_id,
			$faq_question_text,
			$data['total_clicks'] ?? 0,
			$data['unique_users'] ?? 0,
			$data['search_appearances'] ?? 0,
			$data['helpful_count'] ?? 0,
			$data['not_helpful_count'] ?? 0,
			$data['timezone'] ?? 'UTC'
		);

		return $this->wpdb->query($sql) !== false;
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
	}

	/**
	 * Delete FAQ daily summary records for a specific date range.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return int Number of deleted records.
	 */
	public function deleteFaqDailySummaries(int $site_id, string $start_date, string $end_date): int
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
	 * Get top FAQs by total clicks for a given period.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @param int    $limit       The limit of results.
	 * @return array Array of top FAQs ordered by total clicks.
	 */
	public function getTopFaqsByClicks(int $site_id, string $start_date, string $end_date, int $limit = 10): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					faq_id,
					faq_question_text,
					SUM(total_clicks) as total_clicks_period,
					SUM(unique_users) as unique_users_period,
					SUM(search_appearances) as search_appearances_period,
					COUNT(DISTINCT summary_date) as active_days
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY faq_id, faq_question_text
				ORDER BY total_clicks_period DESC
				LIMIT %d",
				$site_id,
				$start_date,
				$end_date,
				$limit
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return $results ?: [];
	}

	/**
	 * Get FAQs by search term filtering.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $search_term The search term.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of FAQs matching the search term.
	 */
	public function getFaqsBySearch(int $site_id, string $search_term, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					faq_id,
					faq_question_text,
					SUM(total_clicks) as total_clicks_period,
					SUM(unique_users) as unique_users_period,
					SUM(search_appearances) as search_appearances_period
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				AND faq_question_text LIKE %s
				GROUP BY faq_id, faq_question_text
				ORDER BY total_clicks_period DESC",
				$site_id,
				$start_date,
				$end_date,
				'%' . $this->wpdb->esc_like($search_term) . '%'
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return $results ?: [];
	}

	/**
	 * Get FAQ performance analytics with trend data.
	 *
	 * @param int    $site_id     The site ID.
	 * @param string $start_date  The start date.
	 * @param string $end_date    The end date.
	 * @return array Array of FAQ performance data with trends.
	 */
	public function getFaqPerformanceAnalytics(int $site_id, string $start_date, string $end_date): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$results = $this->wpdb->get_results(
			$this->wpdb->prepare(
				"SELECT
					faq_id,
					faq_question_text,
					SUM(total_clicks) as total_clicks,
					SUM(unique_users) as unique_users,
					SUM(search_appearances) as search_appearances,
					SUM(helpful_count) as total_helpful,
					SUM(not_helpful_count) as total_not_helpful,
					AVG(total_clicks) as avg_daily_clicks,
					MAX(total_clicks) as peak_daily_clicks,
					COUNT(DISTINCT summary_date) as active_days,
					(SUM(total_clicks) / NULLIF(SUM(search_appearances), 0)) * 100 as click_through_rate,
					(SUM(helpful_count) / NULLIF(SUM(helpful_count) + SUM(not_helpful_count), 0)) * 100 as satisfaction_rate
				FROM {$this->tableName}
				WHERE site_id = %d
				AND summary_date BETWEEN %s AND %s
				GROUP BY faq_id, faq_question_text
				ORDER BY total_clicks DESC",
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
			$totalHelpful = (int) $result['total_helpful'];
			$totalNotHelpful = (int) $result['total_not_helpful'];
			$totalRatings = $totalHelpful + $totalNotHelpful;

			$processedResults[] = [
				'faq_id' => (int) $result['faq_id'],
				'faq_question_text' => $result['faq_question_text'],
				'total_clicks' => (int) $result['total_clicks'],
				'unique_users' => (int) $result['unique_users'],
				'search_appearances' => (int) $result['search_appearances'],
				'total_helpful' => $totalHelpful,
				'total_not_helpful' => $totalNotHelpful,
				'total_ratings' => $totalRatings,
				'avg_daily_clicks' => round((float) $result['avg_daily_clicks'], 2),
				'peak_daily_clicks' => (int) $result['peak_daily_clicks'],
				'active_days' => (int) $result['active_days'],
				'click_through_rate' => round((float) $result['click_through_rate'], 2),
				'satisfaction_rate' => round((float) ($result['satisfaction_rate'] ?: 0), 2),
				'engagement_score' => $this->calculateEngagementScore($result),
			];
		}

		return $processedResults;
	}

	/**
	 * Calculate an engagement score for FAQ performance.
	 *
	 * @param array $faqData FAQ performance data.
	 * @return float Engagement score (0-100).
	 */
	private function calculateEngagementScore(array $faqData): float
	{
		$clicks = (int) ($faqData['total_clicks'] ?? 0);
		$totalHelpful = (int) ($faqData['total_helpful'] ?? 0);
		$totalNotHelpful = (int) ($faqData['total_not_helpful'] ?? 0);
		$totalRatings = $totalHelpful + $totalNotHelpful;

		// Base score from clicks (weighted by activity)
		$clickScore = min($clicks * 2, 40); // Max 40 points from clicks

		// Satisfaction score (higher weight for positive ratings)
		$satisfactionScore = 0;
		if ($totalRatings > 0) {
			$satisfactionRate = ($totalHelpful / $totalRatings) * 100;
			$satisfactionScore = ($satisfactionRate / 100) * 40; // Max 40 points from satisfaction
		}

		// Activity bonus (engagement beyond just clicks)
		$activityBonus = min($totalRatings * 5, 20); // Max 20 points from rating activity

		// Calculate final score (0-100)
		$engagementScore = $clickScore + $satisfactionScore + $activityBonus;

		return round(min($engagementScore, 100), 2);
	}

	/**
	 * Get FAQ trend analysis comparing two periods.
	 *
	 * @param int    $site_id           The site ID.
	 * @param string $current_start     Current period start date.
	 * @param string $current_end       Current period end date.
	 * @param string $previous_start    Previous period start date.
	 * @param string $previous_end      Previous period end date.
	 * @return array Array of FAQ trend data.
	 */
	public function getFaqTrendAnalysis(int $site_id, string $current_start, string $current_end, string $previous_start, string $previous_end): array
	{
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
		$sql = $this->wpdb->prepare(
			"SELECT
				faq_id,
				faq_question_text,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN total_clicks ELSE 0 END) as current_clicks,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN total_clicks ELSE 0 END) as previous_clicks,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN unique_users ELSE 0 END) as current_users,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN unique_users ELSE 0 END) as previous_users,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN helpful_count ELSE 0 END) as current_helpful,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN helpful_count ELSE 0 END) as previous_helpful,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN not_helpful_count ELSE 0 END) as current_not_helpful,
				SUM(CASE WHEN summary_date BETWEEN %s AND %s THEN not_helpful_count ELSE 0 END) as previous_not_helpful
			FROM {$this->tableName}
			WHERE site_id = %d 
			AND (summary_date BETWEEN %s AND %s OR summary_date BETWEEN %s AND %s)
			GROUP BY faq_id, faq_question_text
			HAVING current_clicks > 0 OR previous_clicks > 0
			ORDER BY current_clicks DESC",
			$current_start,
			$current_end,
			$previous_start,
			$previous_end,
			$current_start,
			$current_end,
			$previous_start,
			$previous_end,
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
			$current_clicks = (int) $result['current_clicks'];
			$previous_clicks = (int) $result['previous_clicks'];
			$current_users = (int) $result['current_users'];
			$previous_users = (int) $result['previous_users'];
			$current_helpful = (int) $result['current_helpful'];
			$previous_helpful = (int) $result['previous_helpful'];
			$current_not_helpful = (int) $result['current_not_helpful'];
			$previous_not_helpful = (int) $result['previous_not_helpful'];

			// Calculate growth rates
			$clicks_growth = $previous_clicks > 0 ? (($current_clicks - $previous_clicks) / $previous_clicks) * 100 : 0;
			$users_growth = $previous_users > 0 ? (($current_users - $previous_users) / $previous_users) * 100 : 0;
			$helpful_growth = $previous_helpful > 0 ? (($current_helpful - $previous_helpful) / $previous_helpful) * 100 : 0;

			// Calculate satisfaction rates
			$current_total_ratings = $current_helpful + $current_not_helpful;
			$previous_total_ratings = $previous_helpful + $previous_not_helpful;
			$current_satisfaction = $current_total_ratings > 0 ? ($current_helpful / $current_total_ratings) * 100 : 0;
			$previous_satisfaction = $previous_total_ratings > 0 ? ($previous_helpful / $previous_total_ratings) * 100 : 0;
			$satisfaction_change = $current_satisfaction - $previous_satisfaction;

			$processedResults[] = [
				'faq_id' => (int) $result['faq_id'],
				'faq_question_text' => $result['faq_question_text'],
				'current_clicks' => $current_clicks,
				'previous_clicks' => $previous_clicks,
				'current_users' => $current_users,
				'previous_users' => $previous_users,
				'current_helpful' => $current_helpful,
				'previous_helpful' => $previous_helpful,
				'current_not_helpful' => $current_not_helpful,
				'previous_not_helpful' => $previous_not_helpful,
				'current_satisfaction_rate' => round($current_satisfaction, 2),
				'previous_satisfaction_rate' => round($previous_satisfaction, 2),
				'clicks_growth_rate' => round($clicks_growth, 2),
				'users_growth_rate' => round($users_growth, 2),
				'helpful_growth_rate' => round($helpful_growth, 2),
				'satisfaction_change' => round($satisfaction_change, 2),
				'trend_direction' => $clicks_growth > 0 ? 'up' : ($clicks_growth < 0 ? 'down' : 'stable'),
				'satisfaction_trend' => $satisfaction_change > 5 ? 'improving' : ($satisfaction_change < -5 ? 'declining' : 'stable'),
			];
		}

		return $processedResults;
	}
}
