<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;
use SmashBalloon\WPChat\Common\Services\SettingsService;

class Telegram implements ChatPlatformInterface
{
	/**
	 * Telegram base URL constant
	 */
	private const BASE_URL = 'https://t.me/';

	/**
	 * Username length constraints
	 */
	private const MIN_USERNAME_LENGTH = 5;
	private const MAX_USERNAME_LENGTH = 32;

	/**
	 * Phone number length constraints
	 */
	private const MIN_PHONE_LENGTH = 10;
	private const MAX_PHONE_LENGTH = 15;

	/**
	 * Settings service
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * Telegram constructor.
	 *
	 * @param SettingsService $settingsService
	 */
	public function __construct(SettingsService $settingsService)
	{
		$this->settingsService = $settingsService;
	}

	/**
	 * Get the name of the platform.
	 *
	 * @inheritDoc
	 */
	public function getName(): string
	{
		return 'Telegram';
	}

	/**
	 * Get the URL for redirection to the platform.
	 * Telegram supports both usernames and phone numbers.
	 *
	 * @param string|null $customText Not supported
	 * @param string|null $pdfFile Not supported
	 * @param string $identifier Telegram username or phone number
	 * @return string
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null, string $identifier = ''): string
	{
		if (empty($identifier)) {
			return '';
		}

		$identifier = trim($identifier);

		// Check if identifier is a valid phone number
		if ($this->isValidPhoneNumber($identifier)) {
			return self::BASE_URL . $identifier;
		}

		// Check if identifier is a valid username
		if ($this->isValidUsername($identifier)) {
			// Remove @ if provided
			$cleaned = ltrim($identifier, '@');
			return self::BASE_URL . $cleaned;
		}

		// Invalid identifier
		return '';
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
		return true;
	}

	/**
	 * Validates a Telegram username
	 *
	 * @param string $username
	 * @return bool
	 */
	private function isValidUsername(string $username): bool
	{
		$username = ltrim(trim($username), '@');
		$length = strlen($username);

		if ($length < self::MIN_USERNAME_LENGTH || $length > self::MAX_USERNAME_LENGTH) {
			return false;
		}

		// Only letters, numbers, and underscores allowed
		return preg_match('/^[a-zA-Z0-9_]+$/', $username) === 1;
	}

	/**
	 * Validates a Telegram phone number (must be in +1234567890 format)
	 *
	 * @param string $phone
	 * @return bool
	 */
	private function isValidPhoneNumber(string $phone): bool
	{
		// Allow optional leading +, must have MIN_PHONE_LENGTH–MAX_PHONE_LENGTH digits
		$min = self::MIN_PHONE_LENGTH;
		$max = self::MAX_PHONE_LENGTH;
		$pattern = '/^\+?[0-9]{' . $min . ',' . $max . '}$/';
		if (!preg_match($pattern, $phone)) {
			return false;
		}

		return true;
	}
}
