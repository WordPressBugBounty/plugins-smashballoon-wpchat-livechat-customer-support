<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;

/**
 * Class EntitlementCronService
 * 
 * Handles scheduled entitlement token refresh.
 * 
 * @package SmashBalloon\WPChat\Common\Services
 */
class EntitlementCronService implements ServiceProviderInterface
{
    /**
     * Cron hook name.
     */
    private const CRON_HOOK = 'wpchat_refresh_entitlement';

    /**
     * Entitlement provider.
     *
     * @var EntitlementProviderInterface
     */
    private EntitlementProviderInterface $entitlementProvider;

    /**
     * License service.
     *
     * @var LicenseServiceInterface
     */
    private LicenseServiceInterface $licenseService;

    /**
     * Constructor.
     *
     * @param EntitlementProviderInterface $entitlementProvider
     * @param LicenseServiceInterface $licenseService
     */
    public function __construct(
        EntitlementProviderInterface $entitlementProvider,
        LicenseServiceInterface $licenseService
    ) {
        $this->entitlementProvider = $entitlementProvider;
        $this->licenseService = $licenseService;
    }

    /**
     * @inheritDoc
     */
    public function register(): void
    {
        // Register cron hook
        add_action(self::CRON_HOOK, [$this, 'refreshEntitlement']);

        // Schedule cron if not already scheduled
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'daily', self::CRON_HOOK);
        }

        // Hook into license activation to fetch entitlement
        add_action('wpchat_license_activated', [$this, 'onLicenseActivated'], 10, 2);
        
        // Hook into license deactivation to clear entitlement
        add_action('wpchat_license_deactivated', [$this, 'onLicenseDeactivated']);
    }

    /**
     * Refresh entitlement token.
     */
    public function refreshEntitlement(): void
    {
        // Get stored license key
        $licenseKey = $this->licenseService->getStoredLicenseKey();
        if (!$licenseKey) {
            $this->log('No license key found, skipping entitlement refresh');
            return;
        }

        // Check if token exists first
        $tokenExists = get_option('wpchat_entitlement_token') !== false;
        
        // Check current entitlement
        $currentEntitlement = $this->entitlementProvider->getEntitlement();
        
        // Determine if we need to refresh
        $shouldRefresh = false;
        
        if (!$tokenExists) {
            $shouldRefresh = true;
            $this->log('No entitlement token found, will refresh');
        } elseif (!$currentEntitlement) {
            $shouldRefresh = true;
            $this->log('No entitlement found, will refresh');
        } elseif (isset($currentEntitlement['license_status']) && $currentEntitlement['license_status'] === 'inactive') {
            $shouldRefresh = true;
            $this->log('License is inactive, will refresh');
        } elseif (isset($currentEntitlement['exp'])) {
            // Refresh if expiring within 24 hours
            $expiresIn = $currentEntitlement['exp'] - time();
            if ($expiresIn < 86400) {
                $shouldRefresh = true;
                $this->log('Entitlement expiring soon, will refresh');
            }
        }

        if (!$shouldRefresh) {
            $this->log('Entitlement still valid, skipping refresh');
            return;
        }

        // Get site URL without protocol and trailing slash
        $siteUrl = preg_replace('#^https?://#', '', rtrim(home_url(), '/'));

        // Fetch new entitlement
        $result = $this->entitlementProvider->fetchEntitlement($licenseKey, $siteUrl);
        
        if ($result['success']) {
            $this->log('Entitlement refreshed successfully');
            
            // Clear any cached data
            $this->entitlementProvider->clearCache();
            
            // Trigger action for other services
            do_action('wpchat_entitlement_refreshed', $this->entitlementProvider->getEntitlement());
        } else {
            $this->log('Failed to refresh entitlement: ' . $result['message']);
            
            // If in grace period, schedule more frequent checks
            if ($this->entitlementProvider->isInGracePeriod()) {
                $this->scheduleGracePeriodCheck();
            }
        }
    }

    /**
     * Handle license activation.
     *
     * @param string $licenseKey
     * @param array $licenseData
     */
    public function onLicenseActivated(string $licenseKey, array $licenseData): void
    {
        $this->log('License activated, fetching entitlement');
        
        $siteUrl = preg_replace('#^https?://#', '', rtrim(home_url(), '/'));
        $result = $this->entitlementProvider->fetchEntitlement($licenseKey, $siteUrl);
        
        if ($result['success']) {
            $this->log('Initial entitlement fetched successfully');
        } else {
            $this->log('Failed to fetch initial entitlement: ' . $result['message']);
        }
    }

    /**
     * Handle license deactivation.
     */
    public function onLicenseDeactivated(): void
    {
        $this->log('License deactivated, clearing entitlement');
        
        // Clear stored entitlement
        delete_option('wpchat_entitlement_token');
        delete_option('wpchat_entitlement_hash');
        delete_option('wpchat_entitlement_grace_start');
        
        // Clear cache
        $this->entitlementProvider->clearCache();
        
        // Trigger action
        do_action('wpchat_entitlement_cleared');
    }

    /**
     * Schedule more frequent checks during grace period.
     */
    private function scheduleGracePeriodCheck(): void
    {
        $hookName = 'wpchat_grace_period_check';
        
        if (!wp_next_scheduled($hookName)) {
            // Check every 6 hours during grace period
            wp_schedule_single_event(time() + 21600, $hookName);
            add_action($hookName, [$this, 'refreshEntitlement']);
        }
    }

    /**
     * Log messages for debugging.
     *
     * @param string $message
     */
    private function log(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            Logger::error('[WPChat EntitlementCron] ' . $message);
        }
    }

    /**
     * Clean up on deactivation.
     */
    public static function deactivate(): void
    {
        wp_clear_scheduled_hook(self::CRON_HOOK);
        wp_clear_scheduled_hook('wpchat_grace_period_check');
    }
}