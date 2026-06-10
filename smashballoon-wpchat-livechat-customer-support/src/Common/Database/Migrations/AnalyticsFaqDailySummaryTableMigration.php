<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use SmashBalloon\WPChat\Common\Database\Migrations\MigrationInterface;
use wpdb;

/**
 * Migration for creating the FAQ daily summary aggregate table.
 * Summarizes clicks on FAQs for the "Frequent Questions" table.
 */
class AnalyticsFaqDailySummaryTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_faq_daily_summary';

		$sql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`site_id` bigint(20) unsigned NOT NULL,
				`summary_date` date NOT NULL,
				`faq_id` int(11) unsigned NOT NULL,
				`faq_question_text` varchar(255) NOT NULL,
				`total_clicks` int(11) unsigned DEFAULT 0,
				`unique_users` int(11) unsigned DEFAULT 0,
				`search_appearances` int(11) unsigned DEFAULT 0 COMMENT 'How many times this FAQ appeared in search results',
				`helpful_count` int(11) unsigned DEFAULT 0 COMMENT 'Number of helpful ratings for this FAQ',
				`not_helpful_count` int(11) unsigned DEFAULT 0 COMMENT 'Number of not helpful ratings for this FAQ',
				`timezone` varchar(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone used for aggregation',
				`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
				`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				PRIMARY KEY (`site_id`, `summary_date`, `faq_id`),
				INDEX `idx_summary_date` (`summary_date`),
				INDEX `idx_faq_id` (`faq_id`),
				INDEX `idx_faq_performance` (`faq_id`, `total_clicks`),
				INDEX `idx_date_faq` (`summary_date`, `faq_id`),
				INDEX `idx_total_clicks` (`total_clicks`),
				INDEX `idx_helpful_count` (`helpful_count`),
				INDEX `idx_not_helpful_count` (`not_helpful_count`),
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
		$tableName = $this->db->prefix . 'wpchat_faq_daily_summary';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
