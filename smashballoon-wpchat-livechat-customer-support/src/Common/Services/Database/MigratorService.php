<?php

namespace SmashBalloon\WPChat\Common\Services\Database;

use SmashBalloon\WPChat\Common\Database\Migrations\AgentsTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\FaqsTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\MigrationsTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\AnalyticsTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\AnalyticsDailySummaryTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\AnalyticsHourlySummaryTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\AnalyticsFaqDailySummaryTableMigration;
use SmashBalloon\WPChat\Common\Database\Migrations\AnalyticsAgentDailySummaryTableMigration;
use wpdb;

/**
 * Class MigratorService
 *
 * @package SmashBalloon\WPChat\Common\Services\Database
 */
class MigratorService
{
	/**
	 * The migrations to run.
	 *
	 * @var array
	 */
	protected array $migrations = [
		MigrationsTableMigration::class,
		AgentsTableMigration::class,
		FaqsTableMigration::class,
		AnalyticsTableMigration::class,
		AnalyticsDailySummaryTableMigration::class,
		AnalyticsHourlySummaryTableMigration::class,
		AnalyticsFaqDailySummaryTableMigration::class,
		AnalyticsAgentDailySummaryTableMigration::class,
	];

	/**
	 * The WordPress database instance.
	 *
	 * @var wpdb WordPress database instance.
	 */
	protected wpdb $db;

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
	 * Rolls back a specific migration.
	 *
	 * This method reverses the changes made by a specific migration.
	 *
	 * @param string $migrationName The name of the migration to roll back.
	 * @return void
	 */
	public function rollback(string $migrationName): void
	{
		$tableName = $this->db->prefix . 'wpchat_migrations';
		if (in_array($migrationName, $this->getExecutedMigrations(), true)) {
			$this->db->delete(
				"{$tableName}",
				['migration_name' => $migrationName]
			);

			$migration = new $migrationName($this->db);
			if (method_exists($migration, 'down')) {
				$migration->down();
			}
		}
	}

	/**
	 * Removes all plugin tables during plugin uninstall.
	 *
	 * This method completely removes all plugin tables when the plugin is uninstalled.
	 *
	 * @return void
	 */
	public function uninstall(): void
	{
		$executedMigrations = $this->getExecutedMigrations();

		// Remove tables in reverse order to handle foreign key constraints
		$reversedMigrations = array_reverse($this->migrations);

		foreach ($reversedMigrations as $migration) {
			if (in_array($migration, $executedMigrations, true)) {
				$migrationInstance = new $migration($this->db);

				if (method_exists($migrationInstance, 'down')) {
					$migrationInstance->down();
				}
			}
		}

		// Finally, drop the migrations table itself
		$tableName = $this->db->prefix . 'wpchat_migrations';
		$this->db->query("DROP TABLE IF EXISTS `{$tableName}`;");
	}

	/**
	 * Retrieves a list of executed migrations.
	 *
	 * This method returns an array of migration names that have already been executed.
	 *
	 * @return array An array of executed migration names.
	 */
	public function getExecutedMigrations(): array
	{
		$tableName = $this->db->prefix . 'wpchat_migrations';
		if ($this->db->get_var("SHOW TABLES LIKE '$tableName'") !== $tableName) {
			return [];
		}

		$results = $this->db->get_col("SELECT migration_name FROM `{$tableName}`");
		return $results ?: [];
	}

	/**
	 * Executes all pending migrations.
	 *
	 * This method iterates through the list of migrations and executes their `up` methods.
	 *
	 * @return void
	 */
	public function migrate(): void
	{
		$executedMigrations = $this->getExecutedMigrations();

		foreach ($this->migrations as $migration) {
			if (!in_array($migration, $executedMigrations, true)) {
				$migrationInstance = new $migration($this->db);

				if (method_exists($migrationInstance, 'up')) {
					$migrationInstance->up();
					$this->recordMigration($migration);
				}
			}
		}
	}

	/**
	 * Records a migration as executed.
	 *
	 * This method logs the execution of a migration by its name.
	 *
	 * @param string $migrationName The name of the migration to record.
	 * @return void
	 */
	public function recordMigration(string $migrationName): void
	{
		$tableName = $this->db->prefix . 'wpchat_migrations';
		if (!in_array($migrationName, $this->getExecutedMigrations(), true)) {
			$this->db->insert(
				"{$tableName}",
				['migration_name' => $migrationName, 'executed_at' => current_time('mysql')]
			);
		}
	}
}
