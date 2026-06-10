<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;
use SmashBalloon\WPChat\Common\Platforms\Traits\SanitizesPhoneNumber;
use SmashBalloon\WPChat\Common\Services\SettingsService;

class Phone implements ChatPlatformInterface
{
	use SanitizesPhoneNumber;

	/**
	 * Service for retrieving settings.
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * Phone constructor.
	 *
	 * @param SettingsService $settingsService The service for retrieving settings.
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
		return 'Phone';
	}

	/**
	 * Get the URL for redirection to the platform.
	 * Generates a tel: URI for the sanitized phone number.
	 *
	 * @param string|null $customText Not used for phone calls.
	 * @param string|null $pdfFile Not used for phone calls.
	 * @param string      $phoneNumber The agent's phone number to use for redirection (required).
	 * @return string The tel: URI, or empty string if phone number is invalid.
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null, string $phoneNumber = ''): string
	{
		$phoneNumber = $this->sanitizePhoneNumber($phoneNumber);

		if (empty($phoneNumber) || $this->getPhoneNumberDigitCount($phoneNumber) < 10) {
			return '';
		}

		return 'tel:' . $phoneNumber;
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
		$settings = $this->settingsService->getAllSettings();

		$phoneNumber = $settings['agentSettings']['platforms']['phone']['value'] ?? '';

		if (empty($phoneNumber)) {
			return false;
		}

		$sanitizedNumber = $this->sanitizePhoneNumber($phoneNumber);

		return $this->getPhoneNumberDigitCount($sanitizedNumber) >= 10;
	}
}
