<?php

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Template Name: Admin UI
 *
 * @package WPChat
 */

?>
<div id="wp-chat-admin" class="wp-chat-admin wpchat:antialiased" aria-busy="true">
    <div class="wp-chat-loader wp-chat-loader-reset" role="status">
        <span class="screen-reader-text"><?php esc_html_e('Loading WPChat…', 'smashballoon-wpchat-livechat-customer-support'); ?></span>
        <div class="wp-chat-loader-header">
            <div class="wp-chat-loader-icon"></div>
            <div class="wp-chat-loader-bar"></div>
        </div>
        <div class="wp-chat-spinner-wrapper">
            <span class="spinner is-active"></span>
        </div>
    </div>
</div>
