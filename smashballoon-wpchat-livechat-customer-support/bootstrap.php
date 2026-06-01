<?php

if (!defined("ABSPATH")) {
    exit(); // Exit if accessed directly.
}

// Check if our classes are already loaded (happens during upgrade when both plugins are active)
if (!class_exists("SmashBalloon\WPChat\Common\Services\ServiceContainer")) {
    // autoloader.
    require_once "vendor/autoload.php";
}

// define constants - check if not already defined to avoid conflicts during upgrade
if (!defined("WPCHAT_PLUGIN_DIR")) {
    define("WPCHAT_PLUGIN_DIR", plugin_dir_path(__FILE__));
}
if (!defined("WPCHAT_PLUGIN_URL")) {
    define("WPCHAT_PLUGIN_URL", plugin_dir_url(__FILE__));
}
if (!defined("WPCHAT_API_URL")) {
    define("WPCHAT_API_URL", "https://api.wpchat.com/api/v1");
}
if (!defined("WPCHAT_STORE_URL")) {
    define("WPCHAT_STORE_URL", "https://wpchat.com");
}

// Initialize the deactivation feedback survey.
if (class_exists('SmashBalloon\WPChat\Vendor\Smashballoon\Framework\Packages\Feedback\FeedbackManager')) {
    SmashBalloon\WPChat\Vendor\Smashballoon\Framework\Packages\Feedback\FeedbackManager::init([
        'plugin_slug'    => 'wpchat',
        'plugin_name'    => defined('WPCHAT_PLUGIN_NAME') ? WPCHAT_PLUGIN_NAME : 'WPChat',
        'plugin_version' => defined('WPCHAT_VERSION') ? WPCHAT_VERSION : '',
        'plugin_file'    => defined('WPCHAT_PLUGIN_FILE') ? WPCHAT_PLUGIN_FILE : dirname(__FILE__) . '/wp-chat.php',
        'support_url'    => 'https://wpchat.com/support/',
    ]);
}
