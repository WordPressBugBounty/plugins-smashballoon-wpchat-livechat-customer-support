<?php

namespace SmashBalloon\WPChat\Common\Helpers;

/**
 * Generic Utility class for utility methods.
 *
 * This class can include methods for time-related operations and other generic utilities.
 *
 * @since 1.0.0
 */
class Utility
{
	/**
	 * Get formatted site timezone string for display.
	 *
	 * @param string|null $timezoneString The timezone string (optional, defaults to WordPress timezone).
	 * @param float|null  $gmtOffset The GMT offset (optional, defaults to WordPress offset).
	 * @return string Formatted timezone string.
	 */
	public function getFormattedTimezone(?string $timezoneString = null, ?float $gmtOffset = null)
	{
		// Use provided values or get from WordPress settings.
		$timezoneString = $timezoneString ?? get_option('timezone_string');
		$gmtOffset = $gmtOffset ?? get_option('gmt_offset');

		if (!empty($timezoneString)) {
			$timezoneObj = new \DateTimeZone($timezoneString);
			$datetimeObj = new \DateTime('now', $timezoneObj);
			$offsetInSeconds = $timezoneObj->getOffset($datetimeObj);
			$offsetHours = floor(abs($offsetInSeconds) / 3600);
			$offsetMinutes = floor((abs($offsetInSeconds) - $offsetHours * 3600) / 60);
			$offsetString = sprintf(
				"%s%02d:%02d",
				($offsetInSeconds >= 0) ? '+' : '-',
				$offsetHours,
				$offsetMinutes
			);

			return sprintf(
				/* translators: 1: Timezone name, 2: UTC offset */
				__('%1$s (UTC%2$s)', 'smashballoon-wpchat-livechat-customer-support'),
				self::getTimezoneName($timezoneString),
				$offsetString
			);
		} elseif ($gmtOffset !== false) {
			// If no timezone string but we have GMT offset.
			$offsetHours = floor(abs($gmtOffset));
			$offsetMinutes = (abs($gmtOffset) - $offsetHours) * 60;
			$offsetString = sprintf(
				"%s%d:%02d",
				($gmtOffset >= 0) ? '+' : '-',
				$offsetHours,
				$offsetMinutes
			);

			/* translators: %s: UTC offset */
			return sprintf(__('UTC%s', 'smashballoon-wpchat-livechat-customer-support'), $offsetString);
		}

		// Default if no timezone info is available.
		return __('UTC+0:00', 'smashballoon-wpchat-livechat-customer-support');
	}

	/**
	 * Get a readable timezone name.
	 *
	 * @param string $timezoneString The PHP timezone string.
	 * @return string Human-readable timezone name.
	 */
	private function getTimezoneName($timezoneString)
	{
		// Convert timezone strings like "America/New_York" to more readable "Eastern Time".
		$timezoneIdentifiers = \DateTimeZone::listIdentifiers();
		if (in_array($timezoneString, $timezoneIdentifiers)) {
			$time = new \DateTime('now', new \DateTimeZone($timezoneString));
			$timezoneName = $time->format('T');

			// If the abbreviation looks technical (like "+01"), use the full timezone name.
			if (preg_match('/[+-]\d{2}/', $timezoneName)) {
				$timezoneParts = explode('/', $timezoneString);
				return str_replace('_', ' ', end($timezoneParts));
			}

			return $timezoneName;
		}

		return $timezoneString;
	}
}
