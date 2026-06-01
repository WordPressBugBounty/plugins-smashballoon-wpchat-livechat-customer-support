<?php
/**
 * Logger Class
 *
 * @package SmashBalloon\WPChat\Common\Helpers
 */

namespace SmashBalloon\WPChat\Common\Helpers;

/**
 * Class Logger
 *
 * Conditional logging utility that only logs when WP_DEBUG and WP_DEBUG_LOG are enabled.
 */
class Logger {
	/**
	 * Log a message if debugging is enabled
	 *
	 * @param string $message The message to log
	 * @param mixed  $context Optional context data to include
	 * @return void
	 */
	public static function log( $message, $context = null ) {
		if ( ! self::is_logging_enabled() ) {
			return;
		}

		$log_message = self::format_message( $message, $context );
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- This is a logging helper class, error_log is intentional
		error_log( $log_message );
	}

	/**
	 * Log an error message
	 *
	 * @param string $message The error message
	 * @param mixed  $context Optional context data
	 * @return void
	 */
	public static function error( $message, $context = null ) {
		self::log( '[ERROR] ' . $message, $context );
	}

	/**
	 * Log a warning message
	 *
	 * @param string $message The warning message
	 * @param mixed  $context Optional context data
	 * @return void
	 */
	public static function warning( $message, $context = null ) {
		self::log( '[WARNING] ' . $message, $context );
	}

	/**
	 * Log an info message
	 *
	 * @param string $message The info message
	 * @param mixed  $context Optional context data
	 * @return void
	 */
	public static function info( $message, $context = null ) {
		self::log( '[INFO] ' . $message, $context );
	}

	/**
	 * Log a debug message
	 *
	 * @param string $message The debug message
	 * @param mixed  $context Optional context data
	 * @return void
	 */
	public static function debug( $message, $context = null ) {
		self::log( '[DEBUG] ' . $message, $context );
	}

	/**
	 * Check if logging is enabled
	 *
	 * @return bool
	 */
	private static function is_logging_enabled() {
		return defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG;
	}

	/**
	 * Format the log message with context
	 *
	 * @param string $message The message to format
	 * @param mixed  $context Optional context data
	 * @return string
	 */
	private static function format_message( $message, $context = null ) {
		$formatted = '[WPChat] ' . $message;

		if ( $context !== null ) {
			if ( is_array( $context ) || is_object( $context ) ) {
				$formatted .= ' | Context: ' . wp_json_encode( $context );
			} else {
				$formatted .= ' | Context: ' . $context;
			}
		}

		return $formatted;
	}
}
