<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;

/**
 * Class TranslationService
 *
 * Handles plugin text domain loading for both PHP and JavaScript translations.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class TranslationService implements ServiceProviderInterface
{
	/**
	 * The plugin text domain.
	 *
	 * @var string
	 */
	private const TEXT_DOMAIN = 'smashballoon-wpchat-livechat-customer-support';

	/**
	 * Registers the service provider.
	 *
	 * This method sets up hooks for loading plugin translations.
	 *
	 * @return void
	 */
	public function register(): void
	{
		add_action('init', [$this, 'loadPluginTextdomain']);
	}

	/**
	 * Load plugin text domain for PHP translations.
	 *
	 * @return void
	 */
	public function loadPluginTextdomain(): void
	{
		// phpcs:ignore PluginCheck.CodeAnalysis.DiscouragedFunctions.load_plugin_textdomainFound -- Required for loading translations from custom languages directory
		load_plugin_textdomain(
			self::TEXT_DOMAIN,
			false,
			dirname(plugin_basename(WPCHAT_PLUGIN_FILE)) . '/languages'
		);
	}
}
