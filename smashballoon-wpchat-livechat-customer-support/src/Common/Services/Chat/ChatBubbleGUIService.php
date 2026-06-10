<?php

namespace SmashBalloon\WPChat\Common\Services\Chat;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;

/**
 * Class ChatBubbleGUIService
 *
 * @package SmashBalloon\WPChat\Common\Services\Chat
 */
class ChatBubbleGUIService implements ServiceProviderInterface
{
	/**
	 * Counter for unique shortcode instance IDs.
	 *
	 * @var int
	 */
	private static $shortcode_counter = 0;

	/**
	 * Register service hooks and filters.
	 *
	 * @return void
	 */
	public function register(): void
	{
		add_action('wp_footer', [$this, 'injectChatBubbleTemplate']);
		add_action('init', [$this, 'chatBubbleShortCode']);
	}


	/**
	 * Register the [wpchat] shortcode.
	 *
	 * Allows users to manually place the chat bubble widget in specific
	 * locations using the [wpchat] shortcode with optional attributes.
	 *
	 * @return void
	 */
	public function chatBubbleShortCode()
	{
		add_shortcode('wpchat', [$this, 'renderChatBubbleShortCode']);
	}

	/**
	 * Inject chat bubble template automatically.
	 * Now renders alongside shortcodes with independent state.
	 *
	 * @return void
	 */
	public function injectChatBubbleTemplate(): void
	{
		echo wp_kses_post('<div id="wp-chat-floating" class="wp-chat-frontend" data-instance-type="floating"></div>');
	}


	/**
	 * Render chat bubble for shortcode.
	 *
	 * Default: [wpchat] renders inline, visible, without toggle button.
	 * Each shortcode instance gets a unique ID for independent state.
	 *
	 * @param array $atts Shortcode attributes from WordPress
	 * @return string The HTML content for the shortcode (sanitized)
	 */
	public function renderChatBubbleShortCode($atts = []): string
	{
		// Increment counter for unique instance ID
		self::$shortcode_counter++;
		$instance_id = self::$shortcode_counter;

		// Parse shortcode attributes with smart defaults (inline, visible, no toggle)
		$attributes = shortcode_atts([
			'disablefixed' => 'true',       // Default to inline positioning
			'showchat' => 'true',           // Default to visible/open
			'disablechattoggle' => 'false',  // Default to have toggle button
		], $atts);

		// Build data attributes array with proper boolean conversion
		$data_attrs_array = [];
		$data_attrs_array[] = 'data-instance-type="shortcode"';

		// Convert to boolean using filter_var for flexible input handling
		if (filter_var($attributes['disablefixed'], FILTER_VALIDATE_BOOLEAN)) {
			$data_attrs_array[] = 'data-disable-fixed="true"';
		}
		if (filter_var($attributes['showchat'], FILTER_VALIDATE_BOOLEAN)) {
			$data_attrs_array[] = 'data-show-chat="true"';
		}
		if (filter_var($attributes['disablechattoggle'], FILTER_VALIDATE_BOOLEAN)) {
			$data_attrs_array[] = 'data-disable-chat-toggle="true"';
		}

		// Define allowed HTML for wp_kses with specific attributes
		$allowed_html = array(
			'div' => array(
				'id' => array(),
				'class' => array(),
				'data-instance-type' => array(),
				'data-disable-fixed' => array(),
				'data-show-chat' => array(),
				'data-disable-chat-toggle' => array(),
			),
		);

		// Build complete HTML string with unique ID, then sanitize with explicit allowed tags
		$html = sprintf(
			'<div id="wp-chat-shortcode-%d" class="wp-chat-frontend" %s></div>',
			$instance_id,
			implode(' ', $data_attrs_array)
		);

		return wp_kses($html, $allowed_html);
	}
}
