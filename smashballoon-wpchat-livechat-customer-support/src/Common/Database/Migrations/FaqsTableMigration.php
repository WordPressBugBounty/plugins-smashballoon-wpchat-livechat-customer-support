<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use wpdb;

/**
 * Class FaqsTableMigration
 *
 * @package SmashBalloon\WPChat\Common\Database\Migrations
 */
class FaqsTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_faqs';

		// Check if ngram parser is available.
		$checkNgram = $this->db->get_row("SHOW VARIABLES LIKE 'ngram_token_size'");
		$useNgram = $checkNgram !== null;
		$parserClause = $useNgram ? 'WITH PARSER ngram' : '';

		$sql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`question` TEXT NOT NULL,
				`answer` TEXT NOT NULL,
				`priority` int(11) NOT NULL DEFAULT 0,
				`click_count` bigint(20) NOT NULL DEFAULT 0,
				`helpful_count` int(11) unsigned NOT NULL DEFAULT 0 COMMENT 'Number of helpful ratings',
				`not_helpful_count` int(11) unsigned NOT NULL DEFAULT 0 COMMENT 'Number of not helpful ratings',
				`page_rules` TEXT DEFAULT NULL,
				`image` varchar(255) DEFAULT NULL,
				`created_at` datetime NOT NULL,
				`updated_at` datetime NOT NULL,
				PRIMARY KEY (`id`),
				INDEX `idx_helpful_count` (`helpful_count`),
				INDEX `idx_not_helpful_count` (`not_helpful_count`),
				FULLTEXT INDEX `question_answer_idx` (`question`, `answer`) {$parserClause}
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta($sql);
	}

	/**
	 * Reverse the migration.
	 */
	public function down(): void
	{
		$tableName = $this->db->prefix . 'wpchat_faqs';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
