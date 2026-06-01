<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\SettingsRepositoryInterface;

/**
 * Class PrivateSettingsService
 *
 * Service for managing private settings that should not be exposed to the frontend.
 * This includes sensitive data like API tokens and keys.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class PrivateSettingsService implements ServiceProviderInterface
{
	/**
	 * The repository instance used for managing private settings data.
	 *
	 * @var SettingsRepositoryInterface
	 */
	private SettingsRepositoryInterface $repository;

	/**
	 * Constructor for the PrivateSettingsService class.
	 *
	 * @param SettingsRepositoryInterface $repository The repository instance used to manage private options.
	 */
	public function __construct(SettingsRepositoryInterface $repository)
	{
		$this->repository = $repository;
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void
	{
		// No initialization needed for now
	}

	/**
	 * Retrieves all private settings, merging stored values with defaults.
	 *
	 * @return array Associative array of private settings.
	 */
	public function getAllSettings(): array
	{
		$defaults = [
			'api_token' => '',
			'newsletter_subscribed' => false,
			'newsletter_email' => '',
			'newsletter_subscription_date' => '',
			'token_limit' => 0,
			'used_tokens' => 0,
		];

		$stored_settings = $this->repository->getSettings();
		return wp_parse_args($stored_settings, $defaults);
	}

	/**
	 * Updates a specific private setting with the given key and value.
	 *
	 * @param string $key The key of the setting to update.
	 * @param mixed  $value The new value to assign to the setting.
	 * @return bool Returns true if the settings were successfully updated, false otherwise.
	 */
	public function updateSetting(string $key, $value): bool
	{
		$settings = $this->repository->getSettings();
		$settings[$key] = $value;
		return $this->repository->updateSettings($settings);
	}

	/**
	 * Gets a specific private setting value.
	 *
	 * @param string $key The key of the setting to retrieve.
	 * @param mixed  $default The default value to return if the key doesn't exist.
	 * @return mixed The setting value or default.
	 */
	public function getSetting(string $key, $default = null)
	{
		$settings = $this->getAllSettings();
		return $settings[$key] ?? $default;
	}

	/**
	 * Updates the private settings with the provided array of settings.
	 *
	 * @param array $settings An associative array of settings to be updated.
	 * @return bool Returns true if the settings were successfully updated, false otherwise.
	 */
	public function updateSettings(array $settings): bool
	{
		$currentSettings = $this->repository->getSettings();
		$mergedSettings = array_merge($currentSettings, $settings);
		return $this->repository->updateSettings($mergedSettings);
	}

	/**
	 * Deletes a specific private setting.
	 *
	 * @param string $key The key of the setting to delete.
	 * @return bool Returns true if the setting was successfully deleted, false otherwise.
	 */
	public function deleteSetting(string $key): bool
	{
		$settings = $this->repository->getSettings();
		if (isset($settings[$key])) {
			unset($settings[$key]);
			return $this->repository->updateSettings($settings);
		}
		return true;
	}
}