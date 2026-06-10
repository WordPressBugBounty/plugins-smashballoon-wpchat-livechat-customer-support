<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Helpers\Logger;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\Database\MigratorService;
use Exception;

/**
 * PluginUninstallService
 *
 * This class is used to define and register the plugin uninstall hook.
 */
class PluginUninstallService implements ServiceProviderInterface
{
	/**
	 * Register the plugin uninstall hook.
	 *
	 * @inheritDoc
	 */
	public function register(): void
	{
		register_uninstall_hook(WPCHAT_PLUGIN_FILE, [self::class, 'uninstall']);
	}

	/**
	 * This method is called when the plugin is uninstalled.
	 *
	 * Since the uninstall hook is static, we cannot use the constructor to inject the settings service.
	 * We are using the container here to get the settings service instance.
	 *
	 * @return void
	 */
	public static function uninstall(): void
	{
		$container = SingletonContainer::getInstance();
		$settingsService = $container->get(SettingsService::class);
		$settings = $settingsService->getAllSettings();

		// Check if the 'preserveSettings' key exists in the settings array and is truthy.
		if (!empty($settings['preserveSettings'])) {
			return;
		}

		// Remove all migrations using the migrator service.
		$migrator = $container->get( MigratorService::class );
		$migrator->uninstall();

		// Delete plugin settings from WordPress options table.
		$settingsService->deleteSettings();

		// Clean up seeding flag
		delete_option('wpchat_faqs_seeded');

		// Clean up funnels visibility map
		delete_option('wpchat_funnels_visibility_map');

		// Clean up translation data
		delete_option('wpchat_translations_version');
		delete_site_transient('wpchat_t15s_smashballoon-wpchat-livechat-customer-support');

		// Clean up wpchat_admin capability from all roles
		global $wp_roles;
		if (isset($wp_roles) && is_object($wp_roles)) {
			foreach ($wp_roles->roles as $role_name => $role_data) {
				$role = get_role($role_name);
				if ($role && $role->has_cap('wpchat_admin')) {
					$role->remove_cap('wpchat_admin');
				}
			}
		}

		// Clean up vector embeddings
		try {
			$vectorService = $container->get(\SmashBalloon\WPChat\Common\Services\VectorEmbeddingService::class);
			$vectorService->cleanupAllVectorData();
		} catch (Exception $e) {
			Logger::error('Failed to clean up vector embeddings during uninstall: ' . $e->getMessage());
		}
	}
}
