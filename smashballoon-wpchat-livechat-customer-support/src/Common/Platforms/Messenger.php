<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;

class Messenger implements ChatPlatformInterface
{
	/**
	 * Messenger base URL constant
	 */
	private const BASE_URL = 'https://m.me/';

	/**
	 * Minimum identifier length
	 */
	private const MIN_IDENTIFIER_LENGTH = 5;

	/**
	 * Maximum identifier length
	 */
	private const MAX_IDENTIFIER_LENGTH = 50;

	/**
	 * Get the name of the platform.
	 *
	 * @inheritDoc
	 */
	public function getName(): string
	{
		return 'Messenger';
	}

	/**
	 * Get the URL for redirection to the platform.
	 * Messenger supports usernames and numeric user IDs.
	 *
	 * @param string|null $customText Not supported by Messenger, ignored.
	 * @param string|null $pdfFile Not supported by Messenger, ignored.
	 * @param string      $identifier The agent's Messenger username or numeric user ID (required).
	 * @return string The Messenger redirection URL, or empty string if identifier is invalid.
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null, string $identifier = ''): string
	{
		if (empty($identifier)) {
			return '';
		}

		$identifier = trim($identifier);

		// Validate and sanitize
		$valid = $this->validateIdentifier($identifier);

		if (!$valid) {
			return '';
		}

		return self::BASE_URL . $identifier;
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
		// Messenger doesn't require global credentials, only agent-specific identifiers
		return true;
	}

	/**
	 * Validates the Messenger identifier (username or numeric user ID)
	 *
	 * @param string $identifier The username or user ID to validate.
	 * @return bool True if valid, false otherwise.
	 */
	private function validateIdentifier(string $identifier): bool
	{
		$length = strlen($identifier);

		if ($length < self::MIN_IDENTIFIER_LENGTH || $length > self::MAX_IDENTIFIER_LENGTH) {
			return false;
		}

		// Numeric ID: 10–20 digits
		if (preg_match('/^[0-9]{10,20}$/', $identifier)) {
			return true;
		}

		// Username: alphanumeric + dots and underscores
		// - No consecutive dots
		// - Cannot start or end with a dot
		if (!preg_match('/^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{5,50}$/', $identifier)) {
			return false;
		}

		return true;
	}
}
