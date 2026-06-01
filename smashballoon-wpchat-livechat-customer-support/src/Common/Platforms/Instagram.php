<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;

class Instagram implements ChatPlatformInterface
{
	/**
	 * Instagram direct message base URL constant
	 */
	private const BASE_URL = 'https://ig.me/m/';

	/**
	 * Maximum username length (Instagram constraint)
	 */
	private const MAX_USERNAME_LENGTH = 30;

	/**
	 * Get the name of the platform.
	 *
	 * @inheritDoc
	 */
	public function getName(): string
	{
		return 'Instagram';
	}

	/**
	 * Get the URL for redirection to the platform.
	 * Instagram only supports username-based direct messages.
	 * Note: Instagram does not support pre-filled text or file attachments via URL.
	 *
	 * @param string|null $customText Not supported by Instagram, ignored.
	 * @param string|null $pdfFile Not supported by Instagram, ignored.
	 * @param string      $username The agent's Instagram username (required).
	 * @return string The Instagram redirection URL, or empty string if username is invalid.
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null, string $username = ''): string
	{
		if (empty($username)) {
			return '';
		}

		// Sanitize the username
		$sanitized = $this->sanitizeUsername($username);

		if (empty($sanitized) || strlen($sanitized) > self::MAX_USERNAME_LENGTH) {
			return '';
		}

		// Instagram direct message format
		return self::BASE_URL . $sanitized;
	}

	/**
	 * Get the fields required for credentials.
	 *
	 * @inheritDoc
	 */
	public function getCredentialFields(): array
	{
		return [];
	}

	/**
	 * Validate the credentials for the platform.
	 *
	 * @inheritDoc
	 */
	public function validateCredentials(): bool
	{
		// Instagram doesn't require global credentials, only agent-specific usernames
		return true;
	}

	/**
	 * Sanitizes and validates the Instagram username.
	 *
	 * @param string $username The username to sanitize and validate.
	 * @return string The sanitized username if valid, otherwise an empty string.
	 */
	private function sanitizeUsername(string $username): string
	{
		// Remove @ symbol if present and trim whitespace
		$username = ltrim(trim($username), '@');

		// Length check
		if (strlen($username) < 1 || strlen($username) > self::MAX_USERNAME_LENGTH) {
			return '';
		}

		// Regex for strict validation:
		// - Only letters, numbers, periods, underscores
		// - No consecutive periods
		// - Cannot start or end with a period
		$pattern = '/^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]+$/';

		if (!preg_match($pattern, $username)) {
			return '';
		}

		return $username;
	}
}
