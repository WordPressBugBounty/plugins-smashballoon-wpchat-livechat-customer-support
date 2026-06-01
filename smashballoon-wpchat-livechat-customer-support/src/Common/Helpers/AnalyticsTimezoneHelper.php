<?php

namespace SmashBalloon\WPChat\Common\Helpers;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use DateTime;
use DateTimeZone;
use Exception;

/**
 * Helper class for timezone-aware analytics data retrieval.
 * Converts UTC dates to WordPress timezone during queries.
 */
class AnalyticsTimezoneHelper
{
	/**
	 * WordPress timezone string.
	 *
	 * @var string|null
	 */
	private static ?string $wpTimezone = null;

	/**
	 * WordPress timezone object.
	 *
	 * @var DateTimeZone|null
	 */
	private static ?DateTimeZone $wpTimezoneObj = null;

	/**
	 * Get WordPress timezone string.
	 *
	 * @return string WordPress timezone string.
	 */
	public static function getWordPressTimezone(): string
	{
		if (self::$wpTimezone === null) {
			$timezoneString = get_option('timezone_string');
			$gmtOffset = get_option('gmt_offset');

			if (!empty($timezoneString)) {
				self::$wpTimezone = $timezoneString;
			} elseif ($gmtOffset !== false) {
				// Convert GMT offset to timezone string (WordPress native approach)
				$offset = (float) $gmtOffset;
				$hours = (int) $offset;
				$minutes = ($offset - $hours);

				$sign = ($offset < 0) ? '-' : '+';
				$absHour = abs($hours);
				$absMins = abs($minutes * 60);
				self::$wpTimezone = sprintf('UTC%s%02d:%02d', $sign, $absHour, $absMins);
			} else {
				self::$wpTimezone = 'UTC';
			}
		}

		return self::$wpTimezone;
	}

	/**
	 * Get WordPress timezone object.
	 *
	 * @return DateTimeZone WordPress timezone object.
	 */
	public static function getWordPressTimezoneObject(): DateTimeZone
	{
		if (self::$wpTimezoneObj === null) {
			$timezoneString = self::getWordPressTimezone();

			try {
				self::$wpTimezoneObj = new DateTimeZone($timezoneString);
			} catch (Exception $e) {
				// Fallback to UTC if the timezone string is invalid
				Logger::error('WPChat Analytics: Invalid timezone string "' . $timezoneString . '", falling back to UTC');
				self::$wpTimezoneObj = new DateTimeZone('UTC');
			}
		}

		return self::$wpTimezoneObj;
	}

	/**
	 * Convert date range from WordPress timezone to UTC datetime range for precise database queries.
	 * Handles midnight boundaries and DST transitions properly.
	 * Returns full datetime strings for precise time-based queries.
	 *
	 * @param string $startDate Start date in WordPress timezone (Y-m-d format).
	 * @param string $endDate End date in WordPress timezone (Y-m-d format).
	 * @return array Array with 'start' and 'end' datetime strings in UTC.
	 */
	public static function convertDateRangeToUtcDateTime(string $startDate, string $endDate): array
	{
		try {
			$wpTimezone = self::getWordPressTimezoneObject();

			// Create start datetime at 00:00:00 in WordPress timezone
			$wpStartDateTime = new DateTime($startDate . ' 00:00:00', $wpTimezone);
			$utcStartDateTime = clone $wpStartDateTime;
			$utcStartDateTime->setTimezone(new DateTimeZone('UTC'));

			// Create end datetime at 23:59:59 in WordPress timezone
			$wpEndDateTime = new DateTime($endDate . ' 23:59:59', $wpTimezone);
			$utcEndDateTime = clone $wpEndDateTime;
			$utcEndDateTime->setTimezone(new DateTimeZone('UTC'));

			return [
				'start' => $utcStartDateTime->format('Y-m-d H:i:s'),
				'end' => $utcEndDateTime->format('Y-m-d H:i:s'),
			];
		} catch (Exception $e) {
			// Fallback to simple date conversion if timezone conversion fails
			Logger::error('WPChat Analytics: Timezone datetime range conversion error - ' . $e->getMessage());
			return [
				'start' => $startDate . ' 00:00:00',
				'end' => $endDate . ' 23:59:59',
			];
		}
	}

	/**
	 * Get timezone information for display purposes.
	 *
	 * @return array Array with timezone information.
	 */
	public static function getTimezoneInfo(): array
	{
		$wpTimezone = self::getWordPressTimezoneObject();
		$now = new DateTime('now', $wpTimezone);

		return [
			'timezone_string' => self::getWordPressTimezone(),
			'timezone_abbr' => $now->format('T'),
			'current_offset' => $now->format('P'),
			'is_dst' => $now->format('I') === '1',
		];
	}

	/**
	 * Get WordPress timezone offset in seconds.
	 * This is more efficient than full timezone conversion for simple offset calculations.
	 *
	 * @return int Timezone offset in seconds (positive for ahead of UTC, negative for behind).
	 */
	public static function getWordPressTimezoneOffset(): int
	{
		try {
			$wpTimezone = self::getWordPressTimezoneObject();
			$now = new DateTime('now', $wpTimezone);
			$utcNow = new DateTime('now', new DateTimeZone('UTC'));
			
			// Calculate offset in seconds
			$offset = $wpTimezone->getOffset($utcNow);
			return $offset;
		} catch (Exception $e) {
			// Fallback to WordPress GMT offset
			$gmtOffset = get_option('gmt_offset', 0);
			return (int) ($gmtOffset * 3600); // Convert hours to seconds
		}
	}

	/**
	 * Reset cached timezone objects (useful for testing).
	 */
	public static function resetCache(): void
	{
		self::$wpTimezone = null;
		self::$wpTimezoneObj = null;
	}
}
