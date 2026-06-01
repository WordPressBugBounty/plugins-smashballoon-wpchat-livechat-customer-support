<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use wpdb;

/**
 * Class AgentsTableMigration
 *
 * @package SmashBalloon\WPChat\Common\Database\Migrations
 */
class AgentsTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_agents';

		$sql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`name` varchar(100) NOT NULL,
				`platforms` TEXT DEFAULT NULL,
				`status` tinyint(1) NOT NULL DEFAULT 1,
				`avatar` varchar(200) DEFAULT NULL,
				`created_at` datetime NOT NULL,
				`updated_at` datetime NOT NULL,
				PRIMARY KEY (`id`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta($sql);
	}

	/**
	 * Reverse the migration.
	 */
	public function down(): void
	{
		$tableName = $this->db->prefix . 'wpchat_agents';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
