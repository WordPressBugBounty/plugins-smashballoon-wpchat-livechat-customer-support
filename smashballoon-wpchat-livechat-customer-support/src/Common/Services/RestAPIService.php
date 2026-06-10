<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\RestAPI\ChatPlatformEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\SettingsEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\AgentsEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\FaqsEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\SmartSearchEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\WPChatApiEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\LicenseEndpoint;
use SmashBalloon\WPChat\Common\RestAPI\AnalyticsEndpoint;

/**
 * Class RestAPIService
 * Service to initialize and register all REST API endpoints.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class RestAPIService implements ServiceProviderInterface
{
	/**
	 * Array to hold instances of registered endpoints.
	 *
	 * @var RestEndpoint[]
	 */
	protected $endpoints = [];

	/**
	 * Registers all REST API endpoints.
	 * This method should be called during plugin initialization (e.g., on 'rest_api_init' action).
	 */
	public function register(): void
	{
		$this->registerCoreEndpoints(); // Register core plugin endpoints.
		$this->registerAdditionalEndpoints(); // Register any additional endpoints (can be extended).

		add_action('rest_api_init', array($this, 'initEndpoints'));
	}

	/**
	 * Registers core plugin endpoints.
	 * Add instances of your main endpoint classes here.
	 */
	private function registerCoreEndpoints()
	{
		$container = SingletonContainer::getInstance();

		$endpointsClasses = [
			SettingsEndpoint::class,
			ChatPlatformEndpoint::class,
			AgentsEndpoint::class,
			FaqsEndpoint::class,
			SmartSearchEndpoint::class,
			WPChatApiEndpoint::class,
			LicenseEndpoint::class,
			AnalyticsEndpoint::class,
		];

		foreach ($endpointsClasses as $endpointClass) {
			$this->endpoints[] = $container->get($endpointClass);
		}
	}

	/**
	 * Registers additional endpoints.
	 * Child classes can extend this method to register more endpoints if needed.
	 * This is a hook for extensibility.
	 */
	protected function registerAdditionalEndpoints()
	{
		// For extensibility - plugins can hook in here to register more endpoints.
	}

	/**
	 * Initializes and registers the routes for all registered endpoints.
	 * This is hooked to the 'rest_api_init' action.
	 */
	public function initEndpoints()
	{
		foreach ($this->endpoints as $endpoint) {
			$endpoint->registerRoutes(); // Call registerRoutes() on each endpoint.
		}
	}
}
