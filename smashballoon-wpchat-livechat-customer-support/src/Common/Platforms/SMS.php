<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;
use SmashBalloon\WPChat\Common\Platforms\Traits\SanitizesPhoneNumber;
use SmashBalloon\WPChat\Common\Services\SettingsService;

class SMS implements ChatPlatformInterface
{
	use SanitizesPhoneNumber;

	/**
	 * Service for retrieving settings.
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * SMS constructor.
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
		return 'SMS';
	}

	/**
	 * Get the URL for redirection to the platform.
	 * Generates an sms: URI for the sanitized phone number.
	 *
	 * @param string|null $customText The custom text to include in the message.
	 * @param string|null $pdfFile The URL of the PDF file to include in the message.
	 * @param string      $phoneNumber The agent's phone number to use for redirection (required).
	 * @return string The SMS URI, or empty string if phone number is invalid.
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null, string $phoneNumber = ''): string
	{
		$phoneNumber = $this->sanitizePhoneNumber($phoneNumber);

		if (empty($phoneNumber) || $this->getPhoneNumberDigitCount($phoneNumber) < 10) {
			return '';
		}

		$url = 'sms:' . $phoneNumber;

		// Build body text from custom text and/or PDF file.
		$bodyParts = [];

		if (!empty($customText)) {
			$bodyParts[] = $customText;
		}

		if (!empty($pdfFile)) {
			/* translators: %s: PDF file URL */
			$bodyParts[] = sprintf(__('Reference document: %s', 'smashballoon-wpchat-livechat-customer-support'), $pdfFile);
		}

		if (!empty($bodyParts)) {
			$body = rawurlencode(implode("\n", $bodyParts));
			$url .= '?body=' . $body;
		}

		return $url;
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

		$phoneNumber = $settings['agentSettings']['platforms']['sms']['value'] ?? '';

		if (empty($phoneNumber)) {
			return false;
		}

		$sanitizedNumber = $this->sanitizePhoneNumber($phoneNumber);

		return $this->getPhoneNumberDigitCount($sanitizedNumber) >= 10;
	}
}
