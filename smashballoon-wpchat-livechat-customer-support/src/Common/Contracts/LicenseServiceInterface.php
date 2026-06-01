<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface LicenseServiceInterface
 * 
 * Defines the contract for license management services.
 * This abstraction allows for easy migration from EDD to custom solutions.
 * 
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface LicenseServiceInterface
{
    /**
     * Activate a license key.
     *
     * @param string $license_key The license key to activate.
     * @param string $site_url The site URL for activation.
     * @return array Response containing status, message, and license data.
     */
    public function activateLicense(string $license_key, string $site_url): array;

    /**
     * Deactivate a license key.
     *
     * @param string $license_key The license key to deactivate.
     * @param string $site_url The site URL for deactivation.
     * @return array Response containing status and message.
     */
    public function deactivateLicense(string $license_key, string $site_url): array;

    /**
     * Check the status of a license key.
     *
     * @param string $license_key The license key to check.
     * @param string $site_url The site URL for validation.
     * @param bool $force_refresh Whether to bypass cache and force a fresh check.
     * @return array Response containing license status and details.
     */
    public function checkLicenseStatus(string $license_key, string $site_url, bool $force_refresh = false): array;

    /**
     * Get the cached license status without making an API call.
     *
     * @return array|null Cached license data or null if not cached.
     */
    public function getCachedLicenseStatus(): ?array;

    /**
     * Clear the license cache.
     *
     * @return bool True if cache was cleared successfully.
     */
    public function clearLicenseCache(): bool;
}