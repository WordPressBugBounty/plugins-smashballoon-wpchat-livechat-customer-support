<?php

namespace SmashBalloon\WPChat\Common\Platforms;

use SmashBalloon\WPChat\Common\Contracts\ChatPlatformInterface;
use SmashBalloon\WPChat\Common\Services\SingletonContainer;

class PlatformFactory
{
	/**
	 * Creates an instance of a platform class based on the platform name.
	 *
	 * @param string $platformName The name of the platform.
	 * @return ChatPlatformInterface|null
	 */
	public function create(string $platformName): ?ChatPlatformInterface
	{
		$platformClass = $this->getPlatformClass($platformName);

		if ($platformClass) {
			return SingletonContainer::getInstance()->get($platformClass);
		}

		return null;
	}

	/**
	 * Returns the class name for the specified platform.
	 *
	 * @param string $platformName The name of the platform.
	 * @return string|null
	 */
	private function getPlatformClass(string $platformName): ?string
	{
		$platformMap = [
			'whatsapp' => WhatsApp::class,
			'telegram' => Telegram::class,
			'messenger' => Messenger::class,
			'instagram' => Instagram::class,
			'sms' => SMS::class,
			'phone' => Phone::class,
		];

		return $platformMap[$platformName] ?? null;
	}
}
