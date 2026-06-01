<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;

/**
 * Class PluginUpgradeService
 *
 * Handles the upgrade process from WP Chat Free to WP Chat Pro.
 * Downloads the Pro plugin, migrates settings, and activates it seamlessly.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class PluginUpgradeService implements ServiceProviderInterface
{
    /**
     * Private settings service for storing sensitive data.
     *
     * @var PrivateSettingsService
     */
    private PrivateSettingsService $privateSettings;

    /**
     * License service for managing licenses.
     *
     * @var LicenseService
     */
    private LicenseServiceInterface $licenseService;

    /**
     * Constructor.
     */
    public function __construct(PrivateSettingsService $privateSettings, LicenseServiceInterface $licenseService)
    {
        $this->privateSettings = $privateSettings;
        $this->licenseService = $licenseService;
    }

    /**
     * @inheritDoc
     */
    public function register(): void
    {
        // Hook into license activation to check for upgrade eligibility
        add_action('wpchat_license_activated', [$this, 'checkUpgradeEligibility'], 10, 2);
    }




    /**
     * Check if upgrade is eligible after license activation.
     *
     * @param string $license_key The activated license key.
     * @param array $license_data The license data from activation.
     */
    public function checkUpgradeEligibility(string $license_key, array $license_data): void
    {
        // Only check if we're on the free version
        if (!defined('WPCHAT_LITE') || !WPCHAT_LITE) {
            return;
        }

        // Check if download URL is provided in license data
        if (isset($license_data['download_url']) && !empty($license_data['download_url'])) {
            // Initialize upgrade progress
            $this->updateUpgradeProgress('starting', __('Starting upgrade to Pro...', 'smashballoon-wpchat-livechat-customer-support'), 0);

            // Start upgrade process immediately
            $this->performUpgrade($license_data['download_url']);
        }
    }

    /**
     * Perform the upgrade from Free to Pro.
     *
     * @param string $download_url The Pro plugin download URL.
     * @return array|\WP_Error The result or error.
     */
    private function performUpgrade(string $download_url)
    {
        // Verify we're on the free version
        if (!defined('WPCHAT_LITE') || !WPCHAT_LITE) {
            return new \WP_Error('already_pro', __('[WPC-LIC-005] Already running Pro version', 'smashballoon-wpchat-livechat-customer-support'));
        }

        // Include required files
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        // Store current settings before upgrade
        $this->updateUpgradeProgress('backing_up', __('Backing up current settings...', 'smashballoon-wpchat-livechat-customer-support'), 10);
        $settings_backup = $this->backupCurrentSettings();

        // Note: We no longer track upgrade_in_progress since the upgrade happens synchronously

        try {
            // Download the Pro plugin
            $this->updateUpgradeProgress('downloading', __('Downloading Pro plugin...', 'smashballoon-wpchat-livechat-customer-support'), 25);
            $download_result = $this->downloadProPlugin($download_url);
            if (is_wp_error($download_result)) {
                $this->updateUpgradeProgress('error', $download_result->get_error_message(), 0);
                return $download_result;
            }

            // Install the Pro plugin
            $this->updateUpgradeProgress('installing', __('Installing Pro plugin...', 'smashballoon-wpchat-livechat-customer-support'), 50);
            $install_result = $this->installProPlugin($download_result['file']);
            if (is_wp_error($install_result)) {
                $this->updateUpgradeProgress('error', $install_result->get_error_message(), 0);
                @wp_delete_file($download_result['file']);
                return $install_result;
            }

            // Store settings backup for the shutdown hook
            $this->privateSettings->updateSetting('settings_backup', $settings_backup);

            // Update progress before completing
            $this->updateUpgradeProgress('switching', __('Switching to Pro version...', 'smashballoon-wpchat-livechat-customer-support'), 75);

            // Deactivate Free plugin
            $free_plugin = $this->getFreePluginPath();
            if ($free_plugin) {
                deactivate_plugins($free_plugin, true);
            }

            // Activate Pro plugin
            $pro_plugin = $this->getProPluginPath();
            if (!$pro_plugin) {
                return new \WP_Error('upgrade_failed', __('[WPC-LIC-006] Pro plugin not found after installation', 'smashballoon-wpchat-livechat-customer-support'));
            }

            $activation = activate_plugin($pro_plugin);
            if (is_wp_error($activation)) {
                // Reactivate Free if Pro activation failed
                if ($free_plugin) {
                    activate_plugin($free_plugin);
                }
                return $activation;
            }

            // Migrate settings
            $this->migrateSettings($settings_backup);

            // Run database migrations
            $this->runDatabaseMigrations();

            // Clear caches
            $this->clearCaches();

            // Update progress to completed
            $this->updateUpgradeProgress('completed', __('Upgrade completed successfully!', 'smashballoon-wpchat-livechat-customer-support'), 100);

            return [
                'success' => true,
                'message' => __('Upgrade completed successfully!', 'smashballoon-wpchat-livechat-customer-support'),
                'reload_required' => true
            ];

        } catch (\Exception $e) {
            $this->updateUpgradeProgress('error', $e->getMessage(), 0);
            return new \WP_Error('upgrade_failed', $e->getMessage());
        }
    }


    /**
     * Download the Pro plugin from the provided URL.
     *
     * @param string $url The download URL.
     * @return array|\WP_Error The downloaded file info or error.
     */
    private function downloadProPlugin(string $url)
    {
        Logger::error('WPChat Upgrade: Attempting to download from URL: ' . $url);

        // Set up temporary file
        $temp_file = download_url($url, 300); // 5 minute timeout

        if (is_wp_error($temp_file)) {
            Logger::error('WPChat Upgrade: Download failed - ' . $temp_file->get_error_message());
            Logger::error('WPChat Upgrade: Error code - ' . $temp_file->get_error_code());
            return new \WP_Error('download_failed',
                /* translators: %s: Error message */
                sprintf(__('Failed to download Pro plugin: %s', 'smashballoon-wpchat-livechat-customer-support'), $temp_file->get_error_message())
            );
        }

        Logger::error('WPChat Upgrade: Download successful, temp file: ' . $temp_file);
        Logger::error('WPChat Upgrade: File size: ' . (file_exists($temp_file) ? filesize($temp_file) . ' bytes' : 'File does not exist'));

        return [
            'file' => $temp_file,
            'url' => $url
        ];
    }

    /**
     * Install the downloaded Pro plugin.
     *
     * @param string $file The downloaded plugin file path.
     * @return bool|\WP_Error True on success, WP_Error on failure.
     */
    private function installProPlugin(string $file)
    {
        WP_Filesystem();

        $upgrader = new \Plugin_Upgrader(new \WP_Ajax_Upgrader_Skin());
        $result = $upgrader->install($file, [
            'overwrite_package' => true
        ]);

        // Clean up temp file
        @wp_delete_file($file);

        if (is_wp_error($result)) {
            return new \WP_Error('install_failed',
                /* translators: %s: Error message */
                sprintf(__('Failed to install Pro plugin: %s', 'smashballoon-wpchat-livechat-customer-support'), $result->get_error_message())
            );
        }

        return true;
    }

    /**
     * Backup current settings before upgrade.
     *
     * @return array The backed up settings.
     */
    private function backupCurrentSettings(): array
    {
        $settings = [];

        // Get all WP Chat options
        $option_keys = [
            'wpchat_settings',
            'wpchat_private_settings',
            'wpchat_appearance_settings',
            'wpchat_widget_settings',
            'wpchat_integrations',
            'wpchat_license_key'
        ];

        foreach ($option_keys as $key) {
            $value = get_option($key);
            if ($value !== false) {
                $settings[$key] = $value;
            }
        }

        // Store the license key separately
        $license_key = $this->licenseService->getStoredLicenseKey();
        if ($license_key) {
            $settings['_license_key'] = $license_key;
        }

        return $settings;
    }

    /**
     * Migrate settings from Free to Pro.
     *
     * @param array $settings The settings to migrate.
     */
    private function migrateSettings(array $settings): void
    {
        foreach ($settings as $key => $value) {
            if ($key === '_license_key') {
                // Restore license key through the service
                $this->privateSettings->updateSetting('license_key', $value);
            } else {
                // Restore other settings
                update_option($key, $value);
            }
        }
    }

    /**
     * Run any necessary database migrations for Pro features.
     */
    private function runDatabaseMigrations(): void
    {
        // Set a flag that Pro migrations need to be run on next initialization
        // This will be checked by the Pro plugin during its startup
        update_option('wpchat_needs_pro_migrations', true);

        // Clear the migrations verified transient to force a check
        delete_transient('wpchat_pro_migrations_verified');

        // Fire action hook for any additional migrations
        do_action('wpchat_pro_run_migrations');

        // Update database version
        update_option('wpchat_db_version', WPCHAT_VERSION);
    }

    /**
     * Clear various caches after upgrade.
     */
    private function clearCaches(): void
    {
        // Clear license cache
        $this->licenseService->clearLicenseCache();

        // Clear transients
        delete_transient('wpchat_plugin_info');
        delete_site_transient('update_plugins');

        // Clear object cache if available
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
    }

    /**
     * Get the Free plugin path.
     *
     * @return string|false The plugin path or false if not found.
     */
    private function getFreePluginPath()
    {
        $plugins = get_plugins();
        foreach ($plugins as $path => $data) {
            if (strpos($path, 'wp-chat.php') !== false) {
                return $path;
            }
        }
        return false;
    }

    /**
     * Get the Pro plugin path.
     *
     * @return string|false The plugin path or false if not found.
     */
    private function getProPluginPath()
    {
        $plugins = get_plugins();
        foreach ($plugins as $path => $data) {
            if (strpos($path, 'wp-chat-pro.php') !== false) {
                return $path;
            }
        }
        return false;
    }

    /**
     * Update upgrade progress.
     * Note: This is kept for logging purposes but progress is not polled by frontend anymore.
     *
     * @param string $status The current status.
     * @param string $message The progress message.
     * @param int $percentage The completion percentage.
     */
    private function updateUpgradeProgress(string $status, string $message, int $percentage): void
    {
        // Log the progress for debugging
        if ($status === 'error') {
            Logger::error("WPChat upgrade error: $message");
        } else {
            Logger::error("WPChat upgrade progress: $status - $message ($percentage%)");
        }
    }

}
