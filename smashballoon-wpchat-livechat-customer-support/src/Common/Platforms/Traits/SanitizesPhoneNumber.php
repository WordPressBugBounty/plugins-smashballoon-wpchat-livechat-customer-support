<?php

namespace SmashBalloon\WPChat\Common\Platforms\Traits;

trait SanitizesPhoneNumber
{
	/**
	 * Sanitizes and formats the phone number.
	 *
	 * @param string $phoneNumber The phone number to sanitize.
	 * @return string
	 */
	private function sanitizePhoneNumber(string $phoneNumber): string
	{
		$hasPlus = str_starts_with($phoneNumber, '+');

		// Remove anything that's not a digit.
		$cleaned = preg_replace('/[^0-9]/', '', $phoneNumber);

		// Remove leading zeros.
		$cleaned = ltrim($cleaned, '0');

		// Preserve the + prefix for E.164 format.
		return $hasPlus ? '+' . $cleaned : $cleaned;
	}

	/**
	 * Get the digit count of a phone number, excluding the + prefix.
	 *
	 * @param string $phoneNumber The sanitized phone number.
	 * @return int
	 */
	private function getPhoneNumberDigitCount(string $phoneNumber): int
	{
		return strlen(ltrim($phoneNumber, '+'));
	}
}
