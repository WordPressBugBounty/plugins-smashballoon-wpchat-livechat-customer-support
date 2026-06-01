<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

use wpdb;

/**
 * Class MigrationsTableMigration
 *
 * @package SmashBalloon\WPChat\Common\Database
 */
class MigrationsTableMigration implements MigrationInterface
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
		$tableName = $this->db->prefix . 'wpchat_migrations';

		$sql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
				`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				`migration_name` varchar(255) NOT NULL,
				`executed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
		$tableName = $this->db->prefix . 'wpchat_migrations';

		$sql = "DROP TABLE IF EXISTS `{$tableName}`;";
		$this->db->query($sql);
	}
}
