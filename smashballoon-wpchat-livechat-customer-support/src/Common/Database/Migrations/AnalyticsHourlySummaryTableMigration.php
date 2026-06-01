<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use SmashBalloon\WPChat\Common\Database\Migrations\MigrationInterface;
use wpdb;

/**
 * Migration for creating the hourly site summary aggregate table.
 * Used for the "Most Busy Times" chart, showing hourly interactions and redirects.
 */
class AnalyticsHourlySummaryTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_hourly_site_summary';

		$sql = <<<SQL
			CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`site_id` bigint(20) unsigned NOT NULL,
				`summary_date` date NOT NULL,
				`summary_hour` tinyint(2) unsigned NOT NULL COMMENT 'Hour of the day (0-23)',
				`total_user_interactions` int(11) unsigned DEFAULT 0 COMMENT 'User interaction events only',
				`total_redirects` int(11) unsigned DEFAULT 0,
				`total_bot_opens` int(11) unsigned DEFAULT 0,
				`total_faq_clicks` int(11) unsigned DEFAULT 0,
				`total_agent_assignments` int(11) unsigned DEFAULT 0,
				`unique_users` int(11) unsigned DEFAULT 0,
				`unique_sessions` int(11) unsigned DEFAULT 0,
				`timezone` varchar(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone used for aggregation',
				`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
				`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				PRIMARY KEY (`site_id`, `summary_date`, `summary_hour`),
				INDEX `idx_summary_date` (`summary_date`),
				INDEX `idx_date_hour` (`summary_date`, `summary_hour`),
				INDEX `idx_hour_performance` (`summary_hour`, `total_user_interactions`),
				INDEX `idx_summary_hour` (`summary_hour`),
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
		$tableName = $this->db->prefix . 'wpchat_hourly_site_summary';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
