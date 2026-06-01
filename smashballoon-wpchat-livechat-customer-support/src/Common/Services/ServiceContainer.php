<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Vendor\DI\Container;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\Chat\ChatBubbleGUIService;
use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;
use SmashBalloon\WPChat\Common\Services\Database\AgentRoutingService;
use SmashBalloon\WPChat\Common\Services\Analytics\AnalyticsCron;

/**
 * ServiceContainer
 *
 * This class is used to register all the service providers.
 */
class ServiceContainer implements ServiceProviderInterface
{
	/**
	 * PHP-DI container.
	 *
	 * @var Container
	 */
	protected Container $container;
	/**
	 * The list of service providers.
	 *
	 * @var array|string[]
	 */
	protected array $providers = [
		PluginActivationService::class,
		PluginDeactivationService::class,
		PluginUninstallService::class,
		TranslationService::class,
		AssetsManagerService::class,
		AdminPagesService::class,
		ChatBubbleGUIService::class,
		RestAPIService::class,
		ApiService::class,
		SettingsService::class,
		PrivateSettingsService::class,
		SmartSearchManagerService::class,
		VectorEmbeddingService::class,
		LicenseServiceInterface::class,
		LicenseCronService::class,
		KeyStore::class,
		EntitlementProvider::class,
		GateService::class,
		EntitlementCronService::class,
		EntitlementDataService::class,
		PluginUpgradeService::class,
		AgentRoutingService::class,
		AnalyticsCron::class,
	];

	/**
	 * ServiceContainer constructor.
	 */
	public function __construct()
	{
		$this->container = SingletonContainer::getInstance();

		// Conditionally register CLIService if it exists (excluded from production builds)
		if (class_exists('SmashBalloon\WPChat\Common\Services\CLIService')) {
			$this->providers[] = 'SmashBalloon\WPChat\Common\Services\CLIService';
		}
	}

	/**
	 * Register all service providers.
	 *
	 * @inheritDoc
	 */
	public function register(): void
	{
		foreach ($this->providers as $provider) {
			$service = $this->container->get($provider);
			$service->register();
		}
	}

	/**
	 * Get the PHP-DI Container instance.
	 *
	 * @return Container
	 */
	public function getContainer(): Container
	{
		return $this->container;
	}
}
