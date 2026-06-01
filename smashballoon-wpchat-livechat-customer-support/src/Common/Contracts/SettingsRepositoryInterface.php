<?php

namespace SmashBalloon\WPChat\Common\Contracts;

interface SettingsRepositoryInterface
{
	/**
	 * Retrieve all settings.
	 *
	 * @return array An associative array of settings.
	 */
	public function getSettings(): array;

	/**
	 * Update the settings with the provided data.
	 *
	 * @param array $settings An associative array of settings to update.
	 * @return bool True on success, false on failure.
	 */
	public function updateSettings(array $settings): bool;

	/**
	 * Delete all settings.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function deleteSettings(): bool;
}
