<?php

namespace SmashBalloon\WPChat\Common\Database\Migrations;

/**
 * Interface MigrationInterface
 *
 * @package SmashBalloon\WPChat\Common\Database\Migrations
 */
interface MigrationInterface
{
	/**
	 * Run the migration.
	 */
	public function up(): void;

	/**
	 * Reverse the migration.
	 */
	public function down(): void;
}
