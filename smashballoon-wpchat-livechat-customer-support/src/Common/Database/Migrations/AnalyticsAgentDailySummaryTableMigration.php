<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use SmashBalloon\WPChat\Common\Database\Migrations\MigrationInterface;
use wpdb;

/**
 * Migration for creating the agent daily summary aggregate table.
 * Provides daily statistics for agents (e.g., chats assigned, average session duration, average replies).
 */
class AnalyticsAgentDailySummaryTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_agent_daily_summary';

		$sql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`site_id` bigint(20) unsigned NOT NULL,
				`summary_date` date NOT NULL,
				`agent_id` int(11) unsigned NOT NULL,
				`agent_name` varchar(255) NOT NULL,
				`agent_avatar` varchar(200) DEFAULT NULL COMMENT 'Agent avatar URL',
				`total_assignments` int(11) unsigned DEFAULT 0 COMMENT 'Total successful agent assignments',
				`timezone` varchar(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone used for aggregation',
				`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
				`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				PRIMARY KEY (`site_id`, `summary_date`, `agent_id`),
				INDEX `idx_summary_date` (`summary_date`),
				INDEX `idx_agent_id` (`agent_id`),
				INDEX `idx_agent_performance` (`agent_id`, `total_assignments`),
				INDEX `idx_date_agent` (`summary_date`, `agent_id`),
				INDEX `idx_total_assignments` (`total_assignments`),
				INDEX `idx_created_at` (`created_at`),
				INDEX `idx_updated_at` (`updated_at`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta($sql);
	}

	/**
	 * Reverse the migration.
	 */
	public function down(): void
	{
		$tableName = $this->db->prefix . 'wpchat_agent_daily_summary';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
