<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface LicenseProviderInterface
 * 
 * Defines the contract for specific license providers (EDD, custom, etc.).
 * This allows for easy switching between different licensing systems.
 * 
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface LicenseProviderInterface
{
    /**
     * Perform license activation with the licensing server.
     *
     * @param string $license_key The license key to activate.
     * @param string $site_url The site URL for activation.
     * @return array Raw response from the licensing server.
     */
    public function activate(string $license_key, string $site_url): array;

    /**
     * Perform license deactivation with the licensing server.
     *
     * @param string $license_key The license key to deactivate.
     * @param string $site_url The site URL for deactivation.
     * @return array Raw response from the licensing server.
     */
    public function deactivate(string $license_key, string $site_url): array;

    /**
     * Check license status with the licensing server.
     *
     * @param string $license_key The license key to check.
     * @param string $site_url The site URL for validation.
     * @return array Raw response from the licensing server.
     */
    public function checkStatus(string $license_key, string $site_url): array;

    /**
     * Normalize the provider's response to a standard format.
     *
     * @param array $response Raw response from the provider.
     * @param string $action The action performed (activate, deactivate, check_status).
     * @return array Normalized response with consistent structure.
     */
    public function normalizeResponse(array $response, string $action): array;

    /**
     * Get the provider name (e.g., 'edd', 'custom').
     *
     * @return string Provider identifier.
     */
    public function getProviderName(): string;
}