<?php

namespace SmashBalloon\WPChat\Common\Contracts;

interface ChatPlatformInterface
{
	/**
	 * Returns the human-readable name of the platform.
	 * E.g., "WhatsApp", "Telegram".
	 */
	public function getName(): string;

	/**
	 * Generates the final redirection link for the user to start chatting.
	 *
	 * @param string|null $customText Optional text that should be pre-filled in the chat,
	 * e.g., "Hello, I'd like to know more about your product".
	 * @param string|null $pdfFile Optional file path/URL to a PDF with the user's previous interaction context,
	 * so the agent can view funnel or FAQ steps.
	 * @return string The URL the front-end can redirect the user to.
	 */
	public function getRedirectionLink(?string $customText = null, ?string $pdfFile = null): string;

	/**
	 * Indicates whether this platform needs additional credentials (e.g., bot token).
	 * If yes, returns an array of credential fields. If no, returns an empty array.
	 *
	 * @return array
	 */
	public function getCredentialFields(): array;

	/**
	 * Validates the credentials set in plugin settings for this platform.
	 *
	 * @return bool
	 */
	public function validateCredentials(): bool;
}
