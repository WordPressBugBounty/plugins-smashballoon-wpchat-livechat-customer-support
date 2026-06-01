<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\SettingsRepositoryInterface;

/**
 * Class PrivateOptionsRepository
 *
 * Repository for managing private settings that should not be exposed to the frontend.
 * This is used for storing sensitive data like API tokens.
 *
 * @package SmashBalloon\WPChat\Common\Repositories
 */
class PrivateOptionsRepository implements SettingsRepositoryInterface
{
	/**
	 * The name of the option in the WordPress options table.
	 *
	 * @var string
	 */
	private string $optionName = 'wpchat_private_settings';

	/**
	 * Retrieves the private settings stored in the WordPress options table.
	 *
	 * This method fetches the settings associated with the specified option name.
	 * If the option does not exist or is not an array, it returns an empty array.
	 *
	 * @return array The settings array retrieved from the WordPress options table.
	 */
	public function getSettings(): array
	{
		$settings = get_option($this->optionName, []);
		return is_array($settings) ? $settings : [];
	}

	/**
	 * Updates the private settings stored in the WordPress options table.
	 *
	 * @param array $settings The new settings to be saved.
	 *
	 * @return bool True if the settings were updated successfully or if the
	 *              provided settings match the current settings. False otherwise.
	 */
	public function updateSettings(array $settings): bool
	{
		/**
		 * Check if current settings match provided settings.
		 * Added because `update_option` returns false if values are unchanged.
		 */
		$currentSettings = get_option($this->optionName, []);
		if ($currentSettings === $settings) {
			return true;
		}
		
		// Update the option - WordPress will handle autoload appropriately
		return update_option($this->optionName, $settings);
	}

	/**
	 * Deletes the private settings option from the WordPress database.
	 *
	 * @return bool True if the option was successfully deleted, false otherwise.
	 */
	public function deleteSettings(): bool
	{
		return delete_option($this->optionName);
	}
}