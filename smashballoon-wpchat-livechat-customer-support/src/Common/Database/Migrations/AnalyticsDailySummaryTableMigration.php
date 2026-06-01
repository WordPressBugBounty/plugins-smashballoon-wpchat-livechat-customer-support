<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use SmashBalloon\WPChat\Common\Database\Migrations\MigrationInterface;
use wpdb;

/**
 * Migration for creating the daily site summary aggregate table.
 * Provides daily overview statistics for each site.
 */
class AnalyticsDailySummaryTableMigration implements MigrationInterface
{
	/**
	 * WordPress database instance.
	 *
	 * @var wpdb WordPress database instance.
	 */
	private wpdb $db;

	/**
	 * Constructor to initialize the database instance.
	 *
	 * @param wpdb $db WordPress database instance.
	 */
	public function __construct(wpdb $db)
	{
		$this->db = $db;
	}

	/**
	 * Run the migration.
	 */
	public function up(): void
	{
		$tableName = $this->db->prefix . 'wpchat_daily_site_summary';

		$sql = <<<SQL
			CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`site_id` bigint(20) unsigned NOT NULL,
				`summary_date` date NOT NULL,
				`total_user_interactions` int(11) unsigned DEFAULT 0 COMMENT 'User interaction events only',
				`total_redirects` int(11) unsigned DEFAULT 0,
				`total_bot_opens` int(11) unsigned DEFAULT 0,
				`total_faq_clicks` int(11) unsigned DEFAULT 0,
				`total_funnel_completions` int(11) unsigned DEFAULT 0,
				`total_agent_assignments` int(11) unsigned DEFAULT 0,
				`total_successful_assignments` int(11) unsigned DEFAULT 0,
				`total_failed_assignments` int(11) unsigned DEFAULT 0,
				`unique_users` int(11) unsigned DEFAULT 0,
				`unique_sessions` int(11) unsigned DEFAULT 0,
				`conversion_rate` decimal(5,2) unsigned DEFAULT 0 COMMENT 'Percentage of bot opens that lead to redirects',
				`timezone` varchar(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone used for aggregation',
				`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
				`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				PRIMARY KEY (`site_id`, `summary_date`),
				INDEX `idx_summary_date` (`summary_date`),
				INDEX `idx_conversion_rate` (`conversion_rate`),
				INDEX `idx_created_at` (`created_at`),
				INDEX `idx_updated_at` (`updated_at`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		SQL;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta($sql);
	}

	/**
	 * Reverse the migration.
	 */
	public function down(): void
	{
		$tableName = $this->db->prefix . 'wpchat_daily_site_summary';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
