<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\LicenseServiceInterface;
use SmashBalloon\WPChat\Common\Contracts\LicenseProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\KeyStoreInterface;
use SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface;

/**
 * Class LicenseService
 *
 * Main service for managing software licenses with caching and validation.
 * Provides an abstracted interface that can work with different license providers.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class LicenseService implements ServiceProviderInterface, LicenseServiceInterface
{
	/**
	 * The license provider instance.
	 *
	 * @var LicenseProviderInterface
	 */
	private LicenseProviderInterface $provider;

	/**
	 * Private settings service for storing sensitive license data.
	 *
	 * @var PrivateSettingsService
	 */
	private PrivateSettingsService $privateSettings;

	/**
	 * Key store service for managing public keys.
	 *
	 * @var KeyStoreInterface|null
	 */
	private KeyStoreInterface $keyStore;

	/**
	 * Entitlement provider for storing JWT tokens.
	 *
	 * @var EntitlementProviderInterface|null
	 */
	private EntitlementProviderInterface $entitlementProvider;

	/**
	 * Cache expiration time in seconds (24 hours).
	 */
	private const CACHE_EXPIRATION = 24 * 60 * 60;

	/**
	 * Cache key for license status.
	 */
	private const CACHE_KEY = 'wpchat_license_cache';

	/**
	 * Constructor.
	 *
	 * @param LicenseProviderInterface          $provider The license provider.
	 * @param PrivateSettingsService            $privateSettings Private settings service.
	 * @param KeyStoreInterface|null            $keyStore Optional key store service.
	 * @param EntitlementProviderInterface|null $entitlementProvider Optional entitlement provider.
	 */
	public function __construct(
		LicenseProviderInterface $provider,
		PrivateSettingsService $privateSettings,
		KeyStoreInterface $keyStore,
		EntitlementProviderInterface $entitlementProvider
	) {
		$this->provider = $provider;
		$this->privateSettings = $privateSettings;
		$this->keyStore = $keyStore;
		$this->entitlementProvider = $entitlementProvider;
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void
	{
		// No WordPress actions needed for the base license service
		// Cron scheduling is handled by LicenseCronService
	}

	/**
	 * @inheritDoc
	 */
	public function activateLicense(string $license_key, string $site_url): array
	{
		if (empty($license_key)) {
			return [
				'success' => false,
				'message' => __('[WPC-LIC-001] License key is required', 'smashballoon-wpchat-livechat-customer-support'),
				'error_code' => 'missing_license_key'
			];
		}

		try {
			// Call the provider to activate the license
			$response = $this->provider->activate($license_key, $site_url);
			$normalized = $this->provider->normalizeResponse($response, 'activate');

			if ($normalized['success']) {
				// Store the license key in private settings
				$this->privateSettings->updateSetting('license_key', $license_key);

				// Cache the successful activation response
				$this->cacheLicenseData($normalized['license_data']);

				// Handle JWT token if present
				if (isset($normalized['token']) && $this->entitlementProvider) {
					$this->entitlementProvider->storeToken($normalized['token']);
				}

				// Handle embedding token (WPChat API access token) if present
				if (isset($normalized['embedding_token'])) {
					$this->privateSettings->updateSetting('api_token', $normalized['embedding_token']);
					
					// Store expiration if provided
					if (isset($normalized['embedding_token_expires'])) {
						$this->privateSettings->updateSetting('api_token_expires', $normalized['embedding_token_expires']);
					}

					// Trigger action for any dependent services
					do_action('wpchat_api_token_updated', $normalized['embedding_token']);
				}

				// Refresh keystore after successful activation
				if ($this->keyStore) {
					$this->keyStore->refreshKeys();
				}

				// Log successful activation
				$this->logLicenseAction('activate', $license_key, 'success', $normalized['message']);
				
				// Fire action hook to notify other components (e.g., update service)
				do_action('wpchat_license_activated', $license_key, $normalized['license_data']);
				do_action('wpchat_license_status_changed', 'activated', $license_key);
			} else {
				// Log failed activation
				$this->logLicenseAction('activate', $license_key, 'failed', $normalized['message']);
			}

			return $normalized;
		} catch (\Exception $e) {
			$error_message = sprintf(
				/* translators: %s: Error message */
				__('License activation failed: %s', 'smashballoon-wpchat-livechat-customer-support'),
				$e->getMessage()
			);

			$this->logLicenseAction('activate', $license_key, 'error', $error_message);

			return [
				'success' => false,
				'message' => $error_message,
				'error_code' => 'activation_exception'
			];
		}
	}

	/**
	 * @inheritDoc
	 */
	public function deactivateLicense(string $license_key, string $site_url): array
	{
		if (empty($license_key)) {
			return [
				'success' => false,
				'message' => __('[WPC-LIC-001] License key is required', 'smashballoon-wpchat-livechat-customer-support'),
				'error_code' => 'missing_license_key'
			];
		}

		try {
			// Call the provider to deactivate the license
			$response = $this->provider->deactivate($license_key, $site_url);
			$normalized = $this->provider->normalizeResponse($response, 'deactivate');

			if ($normalized['success']) {
				// Remove license key from private settings
				$this->privateSettings->deleteSetting('license_key');

				// Clear the license cache
				$this->clearLicenseCache();

				// Clear all entitlement data when deactivating
				if ($this->entitlementProvider) {
					$this->entitlementProvider->clearAllEntitlementData();
				}

				// Remove API token from private settings
				$this->privateSettings->deleteSetting('api_token');
				$this->privateSettings->deleteSetting('api_token_expires');

				// Log successful deactivation
				$this->logLicenseAction('deactivate', $license_key, 'success', $normalized['message']);

				// Fire action hook to notify other components (e.g., update service)
				do_action('wpchat_license_deactivated', $license_key);
				do_action('wpchat_license_status_changed', 'deactivated', $license_key);
			} else {
				// Log failed deactivation
				$this->logLicenseAction('deactivate', $license_key, 'failed', $normalized['message']);
			}

			return $normalized;
		} catch (\Exception $e) {
			$error_message = sprintf(
				/* translators: %s: Error message */
				__('License deactivation failed: %s', 'smashballoon-wpchat-livechat-customer-support'),
				$e->getMessage()
			);

			$this->logLicenseAction('deactivate', $license_key, 'error', $error_message);

			return [
				'success' => false,
				'message' => $error_message,
				'error_code' => 'deactivation_exception'
			];
		}
	}

	/**
	 * @inheritDoc
	 */
	public function checkLicenseStatus(string $license_key, string $site_url, bool $force_refresh = false): array
	{
		if (empty($license_key)) {
			return [
				'success' => false,
				'message' => __('[WPC-LIC-001] License key is required', 'smashballoon-wpchat-livechat-customer-support'),
				'error_code' => 'missing_license_key'
			];
		}

		// Check cache first unless forced refresh
		if (!$force_refresh) {
			$cached = $this->getCachedLicenseStatus();
			if ($cached !== null) {
				return [
					'success' => true,
					'message' => __('License status retrieved from cache.', 'smashballoon-wpchat-livechat-customer-support'),
					'license_data' => $cached,
					'from_cache' => true
				];
			}
		}

		try {
			// Call the provider to check license status
			$response = $this->provider->checkStatus($license_key, $site_url);
			$normalized = $this->provider->normalizeResponse($response, 'check_status');

			if ($normalized['success']) {
				// Cache the license data
				$this->cacheLicenseData($normalized['license_data']);

				// Handle JWT token if present
				if (isset($normalized['token']) && $this->entitlementProvider) {
					$this->entitlementProvider->storeToken($normalized['token']);
				}

				// Handle embedding token (WPChat API access token) if present
				if (isset($normalized['embedding_token'])) {
					$this->privateSettings->updateSetting('api_token', $normalized['embedding_token']);
					
					// Store expiration if provided
					if (isset($normalized['embedding_token_expires'])) {
						$this->privateSettings->updateSetting('api_token_expires', $normalized['embedding_token_expires']);
					}

					// Trigger action for any dependent services
					do_action('wpchat_api_token_updated', $normalized['embedding_token']);
				}

				// Refresh keystore after successful license check
				if ($this->keyStore) {
					$this->keyStore->refreshKeys();
				}

				// Log successful status check
				$this->logLicenseAction('check_status', $license_key, 'success', 'Status checked successfully');
			} else {
				// Log failed status check
				$this->logLicenseAction('check_status', $license_key, 'failed', $normalized['message']);
			}

			return $normalized;
		} catch (\Exception $e) {
			$error_message = sprintf(
				/* translators: %s: Error message */
				__('License status check failed: %s', 'smashballoon-wpchat-livechat-customer-support'),
				$e->getMessage()
			);

			$this->logLicenseAction('check_status', $license_key, 'error', $error_message);

			return [
				'success' => false,
				'message' => $error_message,
				'error_code' => 'status_check_exception'
			];
		}
	}

	/**
	 * @inheritDoc
	 */
	public function getCachedLicenseStatus(): ?array
	{
		$cached_data = get_transient(self::CACHE_KEY);

		if ($cached_data === false) {
			return null;
		}

		return $cached_data;
	}

	/**
	 * @inheritDoc
	 */
	public function clearLicenseCache(): bool
	{
		return delete_transient(self::CACHE_KEY);
	}

	/**
	 * Get the stored license key from private settings.
	 *
	 * @return string|null The stored license key or null if not found.
	 */
	public function getStoredLicenseKey(): ?string
	{
		$license_key = $this->privateSettings->getSetting('license_key');
		return !empty($license_key) ? $license_key : null;
	}

	/**
	 * Check if a license is currently active.
	 *
	 * @return bool True if license is active, false otherwise.
	 */
	public function isLicenseActive(): bool
	{
		$license_key = $this->getStoredLicenseKey();
		if (!$license_key) {
			return false;
		}

		$cached = $this->getCachedLicenseStatus();
		if ($cached && isset($cached['status'])) {
			return in_array($cached['status'], ['valid', 'active'], true);
		}

		return false;
	}

	/**
	 * Cache license data with expiration.
	 *
	 * @param array $license_data The license data to cache.
	 * @return bool True if cached successfully.
	 */
	private function cacheLicenseData(array $license_data): bool
	{
		$cache_data = array_merge($license_data, [
			'cached_at' => current_time('timestamp'),
			'expires_at' => current_time('timestamp') + self::CACHE_EXPIRATION
		]);

		return set_transient(self::CACHE_KEY, $cache_data, self::CACHE_EXPIRATION);
	}

	/**
	 * Log license actions for debugging and audit purposes.
	 *
	 * @param string $action The action performed.
	 * @param string $license_key The license key (will be partially masked in logs).
	 * @param string $status The status of the action.
	 * @param string $message Additional message.
	 */
	private function logLicenseAction(string $action, string $license_key, string $status, string $message): void
	{
		if (!defined('WP_DEBUG') || !WP_DEBUG) {
			return;
		}

		$masked_key = $this->maskLicenseKey($license_key);
		$log_message = sprintf(
			'[WPChat License] Action: %s | License: %s | Status: %s | Message: %s',
			$action,
			$masked_key,
			$status,
			$message
		);

		Logger::error($log_message);
	}

	/**
	 * Mask license key for logging and API responses (show only first 4 and last 4 characters).
	 *
	 * @param string $license_key The license key to mask.
	 * @return string Masked license key.
	 */
	public function maskLicenseKey(string $license_key): string
	{
		if (strlen($license_key) <= 8) {
			return str_repeat('*', strlen($license_key));
		}

		return substr($license_key, 0, 4) . str_repeat('*', strlen($license_key) - 8) . substr($license_key, -4);
	}
}
