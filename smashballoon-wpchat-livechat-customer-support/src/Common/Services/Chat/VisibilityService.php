<?php

namespace SmashBalloon\WPChat\Common\Services\Chat;

use SmashBalloon\WPChat\Common\Contracts\VisibilityServiceInterface;
use SmashBalloon\WPChat\Common\Services\SettingsService;

/**
 * Class VisibilityService
 *
 * @package SmashBalloon\WPChat\Common\Services\Chat
 */
class VisibilityService implements VisibilityServiceInterface
{
	/**
	 * The settings service instance.
	 *
	 * @var SettingsService $settingsService The settings service instance.
	 */
	private $settingsService;

	/**
	 * Constructor for the VisibilityService class.
	 *
	 * @param SettingsService $settingsService The settings service instance.
	 */
	public function __construct(SettingsService $settingsService)
	{
		$this->settingsService = $settingsService;
	}

	/**
	 * Determines whether the chatbot should be included.
	 *
	 * This method evaluates the visibility settings to decide if the chatbot
	 * should be displayed on the current page, category, or tag based on the active mode.
	 *
	 * @return array ['should_include' => bool, 'funnel_id' => int|null]
	 */
	public function shouldIncludeChatbot(): array
	{
		$visibilitySettings = $this->getVisibilitySettings();
		$mode = $visibilitySettings['mode'] ?? 'include';

		// Free version: simple mode-based check, no funnel support
		return ['should_include' => $mode === 'include', 'funnel_id' => null];
	}

	/**
	 * Get visibility settings with defaults.
	 *
	 * @return array Visibility settings with default structure
	 */
	public function getVisibilitySettings(): array
	{
		$allSettings = $this->settingsService->getAllSettings();
		return $allSettings['visibilitySettings'] ?? [
			'mode' => 'include',
			'include' => [
				'pages' => [],
				'categories' => [],
				'tags' => [],
				'postTypes' => []
			],
			'exclude' => [
				'pages' => [],
				'categories' => [],
				'tags' => [],
				'postTypes' => []
			]
		];
	}
}
