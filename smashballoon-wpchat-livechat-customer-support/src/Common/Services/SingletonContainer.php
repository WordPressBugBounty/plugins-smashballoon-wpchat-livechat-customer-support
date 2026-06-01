<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Vendor\DI\Container;

use function SmashBalloon\WPChat\Vendor\DI\autowire;

use SmashBalloon\WPChat\Common\Contracts\SettingsRepositoryInterface;
use SmashBalloon\WPChat\Common\Repositories\OptionsRepository;
use SmashBalloon\WPChat\Common\Repositories\PrivateOptionsRepository;
use SmashBalloon\WPChat\Common\Contracts\FaqsRepositoryInterface;
use SmashBalloon\WPChat\Common\Repositories\FaqsRepository;
use SmashBalloon\WPChat\Common\Contracts\FaqsServiceInterface;
use SmashBalloon\WPChat\Common\Services\Database\FaqsService;
use SmashBalloon\WPChat\Common\Contracts\SearchServiceInterface;
use SmashBalloon\WPChat\Common\Services\Database\FaqSearchService;
use SmashBalloon\WPChat\Common\Platforms\PlatformFactory;
use SmashBalloon\WPChat\Common\Services\Database\MigratorService;
use SmashBalloon\WPChat\Common\Repositories\AgentsRepository;
use SmashBalloon\WPChat\Common\Contracts\AgentsServiceInterface;
use SmashBalloon\WPChat\Common\Services\Database\AgentRoutingService;
use SmashBalloon\WPChat\Common\Services\Database\AgentsService;
use SmashBalloon\WPChat\Common\Contracts\VisibilityServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\LicenseProviderInterface;
use SmashBalloon\WPChat\Common\Services\License\WPChatProxyLicenseProvider;
use SmashBalloon\WPChat\Common\Services\LicenseService;
use SmashBalloon\WPChat\Common\Services\KeyStore;
use SmashBalloon\WPChat\Common\Services\EntitlementProvider;
use SmashBalloon\WPChat\Common\Services\JWT\JWTVerifier;
use wpdb;

/**
 * Class SingletonContainer
 *
 * Manages the dependency injection container as a singleton.
 */
class SingletonContainer
{
	/**
	 * The single instance of the container.
	 *
	 * @var Container|null
	 */
	protected static ?Container $instance = null;

	/**
	 * Private constructor to prevent direct instantiation.
	 */
	private function __construct()
	{
		global $wpdb;

		self::$instance = new Container();
		self::$instance->set(wpdb::class, $wpdb);
		self::$instance->set(SettingsRepositoryInterface::class, OptionsRepository::class);
		self::$instance->set(PlatformFactory::class, autowire(PlatformFactory::class));
		self::$instance->set(AgentsRepository::class, autowire(AgentsRepository::class));
		self::$instance->set(FaqsRepositoryInterface::class, autowire(FaqsRepository::class));
		self::$instance->set(FaqsServiceInterface::class, autowire(FaqsService::class));

		// Configure AgentsServiceInterface with Pro/Free switching
		if (defined('WPCHAT_PRO') && WPCHAT_PRO) {
			self::$instance->set(AgentsServiceInterface::class, autowire(\SmashBalloon\WPChat\Pro\Services\Database\AgentsService::class));
		} else {
			self::$instance->set(AgentsServiceInterface::class, autowire(AgentsService::class));
		}
		self::$instance->set(
			SearchServiceInterface::class,
			autowire(FaqSearchService::class)
				->constructorParameter('vectorService', \SmashBalloon\WPChat\Vendor\DI\get(VectorEmbeddingService::class))
		);

		// Configure PrivateSettingsService with PrivateOptionsRepository
		self::$instance->set(
			PrivateSettingsService::class,
			autowire(PrivateSettingsService::class)
				->constructorParameter('repository', \SmashBalloon\WPChat\Vendor\DI\get(PrivateOptionsRepository::class))
		);
		self::$instance->set(PrivateOptionsRepository::class, autowire(PrivateOptionsRepository::class));

		// Configure JWTVerifier first (no dependencies)
		self::$instance->set(
			JWTVerifier::class,
			autowire(JWTVerifier::class)
		);

		// Configure KeyStore (depends on ApiService)
		self::$instance->set(
			\SmashBalloon\WPChat\Common\Contracts\KeyStoreInterface::class,
			autowire(KeyStore::class)
		);

		// Configure EntitlementProvider (depends on KeyStore, PrivateSettingsService, JWTVerifier, ApiService)
		self::$instance->set(
			\SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface::class,
			autowire(EntitlementProvider::class)
		);

		// Configure License services (depends on KeyStore and EntitlementProvider)
		self::$instance->set(
			LicenseProviderInterface::class,
			autowire(WPChatProxyLicenseProvider::class)
		);

		self::$instance->set(
			LicenseServiceInterface::class,
			autowire(LicenseService::class)
				->constructorParameter('keyStore', \SmashBalloon\WPChat\Vendor\DI\get(\SmashBalloon\WPChat\Common\Contracts\KeyStoreInterface::class))
				->constructorParameter('entitlementProvider', \SmashBalloon\WPChat\Vendor\DI\get(\SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface::class))
		);

		// Configure PluginUpgradeService
		self::$instance->set(
			PluginUpgradeService::class,
			autowire(PluginUpgradeService::class)
				->constructorParameter('privateSettings', \SmashBalloon\WPChat\Vendor\DI\get(PrivateSettingsService::class))
				->constructorParameter('licenseService', \SmashBalloon\WPChat\Vendor\DI\get(LicenseServiceInterface::class))
		);

		self::$instance->set(
			\SmashBalloon\WPChat\Common\Contracts\GateInterface::class,
			autowire(GateService::class)
		);

		// Configure Analytics Services
		// Pro version will override these to include funnel analytics
		self::$instance->set(
			\SmashBalloon\WPChat\Common\Contracts\AnalyticsServiceInterface::class,
			autowire(\SmashBalloon\WPChat\Common\Services\Analytics\AnalyticsService::class)
		);

		self::$instance->set(
			\SmashBalloon\WPChat\Common\Contracts\AnalyticsAggregationServiceInterface::class,
			autowire(\SmashBalloon\WPChat\Common\Services\Analytics\AnalyticsAggregationService::class)
		);

		// Configure ChatPlatformEndpoint to inject AnalyticsService
		// This configuration is the same for both Pro and Free versions
		self::$instance->set(
			\SmashBalloon\WPChat\Common\RestAPI\ChatPlatformEndpoint::class,
			autowire(\SmashBalloon\WPChat\Common\RestAPI\ChatPlatformEndpoint::class)
				->constructorParameter('settingsService', \SmashBalloon\WPChat\Vendor\DI\get(\SmashBalloon\WPChat\Common\Services\SettingsService::class))
				->constructorParameter('analyticsService', \SmashBalloon\WPChat\Vendor\DI\get(\SmashBalloon\WPChat\Common\Contracts\AnalyticsServiceInterface::class))
		);

		// Configure CLIService with service dependencies injection (development only)
		if (class_exists(CLIService::class)) {
			self::$instance->set(
				CLIService::class,
				autowire(CLIService::class)
					->constructorParameter('vectorService', function ($container) {
						return $container->get(VectorEmbeddingService::class);
					})
					->constructorParameter('entitlementProvider', function ($container) {
						return $container->get(EntitlementProvider::class);
					})
					->constructorParameter('keyStore', function ($container) {
						return $container->get(KeyStore::class);
					})
					->constructorParameter('entitlementDataService', function ($container) {
						return $container->get(EntitlementDataService::class);
					})
					->constructorParameter('licenseService', function ($container) {
						return $container->get(LicenseServiceInterface::class);
					})
			);
		}

		// Configure AgentRoutingService with Pro/Free switching
		if (defined('WPCHAT_PRO') && WPCHAT_PRO) {
			self::$instance->set(AgentRoutingService::class, autowire(\SmashBalloon\WPChat\Pro\Services\Database\AgentRoutingService::class));
		} else {
			self::$instance->set(AgentRoutingService::class, autowire(\SmashBalloon\WPChat\Common\Services\Database\AgentRoutingService::class));
		}

		// Configure VisibilityService with Pro/Free switching
		if (defined('WPCHAT_PRO') && class_exists('\SmashBalloon\WPChat\Pro\Services\Chat\AdvancedVisibilityService')) {
			self::$instance->set(VisibilityServiceInterface::class, autowire(\SmashBalloon\WPChat\Pro\Services\Chat\AdvancedVisibilityService::class));
		} else {
			self::$instance->set(VisibilityServiceInterface::class, autowire(\SmashBalloon\WPChat\Common\Services\Chat\VisibilityService::class));
		}

		// if the Pro version is active, use the Pro services.
		if (defined('WPCHAT_PRO') && WPCHAT_PRO) {
			// Configure routing strategy
			// Available strategies:
			// - RoundRobinRoutingStrategy: Simple round-robin distribution
			// - StrideSchedulingStrategy: Mathematically fair stride scheduling with single global pool (tracks total workload across all platforms)
			self::$instance->set(
				\SmashBalloon\WPChat\Pro\Services\Routing\AgentRoutingStrategyInterface::class,
				// autowire(\SmashBalloon\WPChat\Pro\Services\Routing\RoundRobinRoutingStrategy::class)
				// To use Stride Scheduling instead, uncomment the line below and comment the line above:
				 autowire(\SmashBalloon\WPChat\Pro\Services\Routing\StrideSchedulingStrategy::class)
			);

			self::$instance->set(
				MigratorService::class,
				autowire(\SmashBalloon\WPChat\Pro\Services\Database\MigratorService::class)
			);

			self::$instance->set(
				\SmashBalloon\WPChat\Pro\Repositories\SchedulesRepository::class,
				autowire(\SmashBalloon\WPChat\Pro\Repositories\SchedulesRepository::class)
			);

			self::$instance->set(
				\SmashBalloon\WPChat\Pro\Contracts\FunnelsRepositoryInterface::class,
				autowire(\SmashBalloon\WPChat\Pro\Repositories\FunnelsRepository::class)
			);

			self::$instance->set(
				\SmashBalloon\WPChat\Pro\Contracts\FunnelsServiceInterface::class,
				autowire(\SmashBalloon\WPChat\Pro\Services\Database\FunnelsService::class)
			);

			// Configure FunnelAnalyticsRepository for Pro version
			self::$instance->set(
				\SmashBalloon\WPChat\Pro\Repositories\FunnelAnalyticsRepository::class,
				autowire(\SmashBalloon\WPChat\Pro\Repositories\FunnelAnalyticsRepository::class)
			);

			// Override Analytics Services with Pro versions that include funnel analytics
			self::$instance->set(
				\SmashBalloon\WPChat\Common\Contracts\AnalyticsServiceInterface::class,
				autowire(\SmashBalloon\WPChat\Pro\Services\Analytics\AnalyticsService::class)
			);

			self::$instance->set(
				\SmashBalloon\WPChat\Common\Contracts\AnalyticsAggregationServiceInterface::class,
				autowire(\SmashBalloon\WPChat\Pro\Services\Analytics\AnalyticsAggregationService::class)
			);
		} else {
			// Free version needs the common MigratorService
			self::$instance->set(
				MigratorService::class,
				autowire(\SmashBalloon\WPChat\Common\Services\Database\MigratorService::class)
			);
		}
	}

	/**
	 * Get the singleton instance of the container.
	 *
	 * @return Container
	 */
	public static function getInstance(): Container
	{
		if (self::$instance === null) {
			new self();
		}

		return self::$instance;
	}
}
