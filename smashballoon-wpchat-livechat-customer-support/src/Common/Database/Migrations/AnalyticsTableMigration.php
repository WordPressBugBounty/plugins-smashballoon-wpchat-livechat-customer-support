<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use SmashBalloon\WPChat\Common\Database\Migrations\MigrationInterface;
use wpdb;

/**
 * Migration for creating the granular analytics events table.
 * This table serves as the single source of truth for all raw chatbot interaction events.
 */
class AnalyticsTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_analytics';

		$sql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`site_id` bigint(20) unsigned NOT NULL DEFAULT 1 COMMENT 'WordPress site ID (for multisite compatibility)',
				`timestamp` datetime NOT NULL COMMENT 'Timestamp of the event',
				`event_type` varchar(50) NOT NULL COMMENT 'Type of interaction (e.g., bot_open, faq_click, etc.)',
				`user_id` varchar(255) DEFAULT NULL COMMENT 'Unique identifier for the user/visitor (e.g., WordPress user ID or session ID)',
				`session_id` varchar(255) DEFAULT NULL COMMENT 'Unique identifier for the chat session',
				`data` json DEFAULT NULL COMMENT 'Flexible JSON field for dynamic event-specific data',
				`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (`id`),
				INDEX `idx_site_time` (`site_id`, `timestamp`),
				INDEX `idx_site_event_time` (`site_id`, `event_type`, `timestamp`),
				INDEX `idx_timestamp` (`timestamp`),
				INDEX `idx_session_id` (`session_id`),
				INDEX `idx_user_id` (`user_id`),
				INDEX `idx_event_type` (`event_type`),
				INDEX `idx_site_id` (`site_id`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta($sql);

		// Create generated columns for frequently queried JSON fields
		$this->createGeneratedColumns($tableName);
	}

	/**
	 * Create generated columns for efficient JSON querying.
	 *
	 * @param string $tableName The table name.
	 */
	private function createGeneratedColumns(string $tableName): void
	{
		// Check if generated columns already exist
		$existingColumns = $this->db->get_results(
			$this->db->prepare("SHOW COLUMNS FROM %i", $tableName),
			ARRAY_A
		);

		$columnNames = array_column($existingColumns, 'Field');

		// ============= FAQ Analytics Virtual Columns =============
		// Add FAQ ID virtual column if not exists
		if (!in_array('faq_id', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `faq_id` int AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.faq_id'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_faq_id ON %i (faq_id)", $tableName)
			);
		}

		// Add FAQ Question virtual column if not exists
		if (!in_array('faq_question', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `faq_question` text AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.faq_question'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_faq_question ON %i (faq_question(100))", $tableName)
			);
		}

		// ============= Agent Analytics Virtual Columns =============
		// Add Agent ID virtual column if not exists
		if (!in_array('agent_id', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `agent_id` int AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.agent_id'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_agent_id ON %i (agent_id)", $tableName)
			);
		}

		// Add Agent Name virtual column if not exists
		if (!in_array('agent_name', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `agent_name` varchar(255) AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.agent_name'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_agent_name ON %i (agent_name)", $tableName)
			);
		}

		// Add Platform virtual column if not exists
		if (!in_array('platform', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `platform` varchar(50) AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.platform'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_platform ON %i (platform)", $tableName)
			);
		}

		// Add Status virtual column if not exists
		if (!in_array('status', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `status` varchar(50) AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.status'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_status ON %i (status)", $tableName)
			);
		}

		// ============= Funnel Analytics Virtual Columns =============
		// Add Funnel ID virtual column - ESSENTIAL for filtering
		if (!in_array('funnel_id', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `funnel_id` int AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.funnel_id'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_funnel_id ON %i (funnel_id)", $tableName)
			);
		}

		// Add Block Order virtual column - ESSENTIAL for aggregation
		if (!in_array('block_order', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `block_order` int AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.block_order'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_block_order ON %i (block_order)", $tableName)
			);
		}

		// Add Step Name virtual column - ESSENTIAL for view vs option_click filtering
		if (!in_array('step_name', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `step_name` varchar(100) AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.step_name'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_step_name ON %i (step_name)", $tableName)
			);
		}

		// Add Option ID virtual column - ESSENTIAL for option-level analytics
		if (!in_array('option_id', $columnNames, true)) {
			$this->db->query(
				$this->db->prepare(
					"ALTER TABLE %i ADD COLUMN `option_id` varchar(255) AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.option_id'))) VIRTUAL",
					$tableName
				)
			);
			$this->db->query(
				$this->db->prepare("CREATE INDEX idx_option_id ON %i (option_id)", $tableName)
			);
		}

	}

	/**
	 * Reverse the migration.
	 */
	public function down(): void
	{
		$tableName = $this->db->prefix . 'wpchat_analytics';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
