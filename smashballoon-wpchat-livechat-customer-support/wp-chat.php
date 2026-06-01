<?php

/**
 * Plugin Name: WPChat - Livechat Customer Support Suite
 * Plugin URI: https://wpchat.com
 * Description: Connect with your website visitors through simple and reliable live chat widget for WordPress.
 * Version: 1.3.1
 * Author: Smash Balloon
 * Author URI: https://smashballoon.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: smashballoon-wpchat-livechat-customer-support
 */

// Prevent direct access to the file.
if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

// Define constants - check if not already defined to avoid conflicts during upgrade
if (!defined('WPCHAT_PLUGIN_NAME')) {
	define('WPCHAT_PLUGIN_NAME', 'WPChat');
}
if (!defined('WPCHAT_VERSION')) {
	define('WPCHAT_VERSION', '1.3.1');
}
if (!defined('WPCHAT_PLUGIN_FILE')) {
	define('WPCHAT_PLUGIN_FILE', __FILE__);
}
if (!defined('WPCHAT_LITE')) {
	define('WPCHAT_LITE', true);
}

// bootstrap the plugin.
require_once 'bootstrap.php';

/**
 * Get the appropriate service container class based on the plugin type.
 *
 * @return string Fully qualified class name of the service container.
 */
if (!function_exists('getWpChatContainer')) {
	function getWpChatContainer()
	{
		return \SmashBalloon\WPChat\Common\Services\ServiceContainer::class;
	}
}

// Register the service container.
$serviceContainerClass = getWpChatContainer();
$container = new $serviceContainerClass();
$container->register();
