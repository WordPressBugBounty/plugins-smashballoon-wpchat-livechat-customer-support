<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;
use SmashBalloon\WPChat\Common\Services\SettingsService;

class WhatsApp implements ChatPlatformInterface
{
	/**
	 * Service for retrieving settings.
	 *
	 * @var SettingsService
	 */
	private $settingsService;

	/**
	 * WhatsApp constructor.
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
		return 'WhatsApp';
	}

	/**
	 * Get the URL for redirection to the platform.
	 * Validates and sanitizes the phone number before generating the redirection link.
	 *
	 * @param string|null $customText The custom text to include in the message.
	 * @param string|null $pdfFile The URL of the PDF file to include in the message.
	 * @param string      $phoneNumber The agent's phone number to use for redirection (required).
	 * @return string The WhatsApp redirection URL, or empty string if phone number is invalid.
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null, string $phoneNumber = ''): string
	{
		$phoneNumber = $this->sanitizePhoneNumber($phoneNumber);

		if (empty($phoneNumber) || strlen($phoneNumber) < 10) {
			return '';
		}

		// Base WhatsApp API URL.
		$baseUrl = 'https://wa.me/';

		// Build the URL.
		$url = $baseUrl . $phoneNumber;

		// Prepare query parameters.
		$queryParams = [];

		// Add custom text if provided.
		if (!empty($customText)) {
			$queryParams['text'] = $customText;
		}

		// If there's a PDF file, append its URL to the message.
		if (!empty($pdfFile)) {
			/* translators: %s: PDF file URL */
			$pdfMessage = sprintf(__('Reference document: %s', 'smashballoon-wpchat-livechat-customer-support'), $pdfFile);
			$queryParams['text'] = !empty($customText)
				? $queryParams['text'] . "\n" . $pdfMessage
				: $pdfMessage;
		}

		// Append query parameters if any exist.
		if (!empty($queryParams)) {
			$url .= '?' . http_build_query($queryParams);
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

		$phoneNumber = $settings['agentSettings']['platforms']['whatsapp']['value'] ?? '';

		// Basic validation: Check if phone number exists and matches pattern.
		if (empty($phoneNumber)) {
			return false;
		}

		$sanitizedNumber = $this->sanitizePhoneNumber($phoneNumber);

		// Check if the number is at least 10 digits long after sanitization.
		return strlen($sanitizedNumber) >= 10;
	}

	/**
	 * Sanitizes and formats the phone number for WhatsApp API
	 *
	 * @param string $phoneNumber The phone number to sanitize.
	 * @return string
	 */
	private function sanitizePhoneNumber(string $phoneNumber): string
	{
		// Remove any non-numeric characters.
		$cleaned = preg_replace('/[^0-9]/', '', $phoneNumber);

		// Remove leading zeros.
		$cleaned = ltrim($cleaned, '0');

		// If number starts with '+', ensure it's removed.
		if (str_starts_with($phoneNumber, '+')) {
			$cleaned = preg_replace('/^\+/', '', $cleaned);
		}

		return $cleaned;
	}
}
