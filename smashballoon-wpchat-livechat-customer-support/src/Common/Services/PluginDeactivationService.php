<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\SettingsService;

/**
 * PluginDeactivationService
 *
 * This class is used to define and register the plugin deactivation hook.
 */
class PluginDeactivationService implements ServiceProviderInterface
{
	/**
	 * The settings service instance.
	 *
	 * @var SettingsService $settingsService The settings service instance.
	 */
	private $settingsService;

	/**
	 * Constructor.
	 *
	 * @param SettingsService $settingsService The settings service.
	 */
	public function __construct(SettingsService $settingsService)
	{
		$this->settingsService = $settingsService;
	}

	/**
	 * Register the plugin deactivation hook.
	 *
	 * @inheritDoc
	 */
	public function register(): void
	{
		register_deactivation_hook(WPCHAT_PLUGIN_FILE, [$this, 'deactivate']);
	}

	/**
	 * This method is called when the plugin is deactivated.
	 *
	 * @return void
	 */
	public function deactivate(): void
	{
		// Trigger plugin deactivation hook for other services.
		do_action('wpchat_plugin_deactivated');
	}
}
