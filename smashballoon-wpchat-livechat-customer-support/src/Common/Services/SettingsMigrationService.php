<?php

namespace SmashBalloon\WPChat\Common\Services;

/**
 * Handles backward-compatible settings migrations.
 *
 * When new settings keys are introduced, this service ensures existing users
 * get sensible defaults without breaking their current experience.
 */
class SettingsMigrationService
{
	/**
	 * Apply backward-compatible defaults to settings.
	 *
	 * @param array $settings       The merged settings (defaults + stored).
	 * @param array $stored_settings The raw stored settings from DB.
	 * @return array The settings with backward-compat defaults applied.
	 */
	public function migrate(array $settings, array $stored_settings): array
	{
		$settings = $this->migrateIconType($settings, $stored_settings);

		return $settings;
	}

	/**
	 * Existing users without iconType get 'custom' (their original behavior).
	 * New installs get 'platform' from the defaults in SettingsService.
	 */
	private function migrateIconType(array $settings, array $stored_settings): array
	{
		if (
			!empty($stored_settings) &&
			isset($stored_settings['customizerSettings']) &&
			!isset($stored_settings['customizerSettings']['iconType'])
		) {
			$settings['customizerSettings']['iconType'] = 'custom';
		}

		return $settings;
	}
}
