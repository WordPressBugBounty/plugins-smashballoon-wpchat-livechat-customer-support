<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\KeyStoreInterface;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\JWT\JWTVerifier;
use SmashBalloon\WPChat\Common\Services\ApiService;

/**
 * Class EntitlementProvider
 *
 * Manages entitlement tokens with secure verification and caching.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class EntitlementProvider implements EntitlementProviderInterface, ServiceProviderInterface
{
	/**
	 * Key store for public key management.
	 *
	 * @var KeyStoreInterface
	 */
	private KeyStoreInterface $keyStore;

	/**
	 * Private settings service for secure storage.
	 *
	 * @var PrivateSettingsService
	 */
	private PrivateSettingsService $privateSettings;

	/**
	 * JWT verifier instance.
	 *
	 * @var JWTVerifier
	 */
	private JWTVerifier $jwtVerifier;

	/**
	 * API service instance.
	 *
	 * @var ApiService
	 */
	private ApiService $apiService;

	/**
	 * Cached entitlement data for the current request.
	 *
	 * @var array|null
	 */
	private ?array $cachedEntitlement = null;

	/**
	 * Grace period in seconds (7 days).
	 */
	private const GRACE_PERIOD = 7 * 24 * 60 * 60;

	/**
	 * Token storage option name.
	 */
	private const TOKEN_OPTION = 'wpchat_entitlement_token';

	/**
	 * Token hash option name.
	 */
	private const HASH_OPTION = 'wpchat_entitlement_hash';

	/**
	 * Grace period start option name.
	 */
	private const GRACE_START_OPTION = 'wpchat_entitlement_grace_start';

	/**
	 * Last valid token option name (for grace period).
	 */
	private const LAST_VALID_OPTION = 'wpchat_entitlement_last_valid';

	/**
	 * Default free tier entitlement token.
	 * This pre-signed token provides basic free tier access.
	 */
	private const DEFAULT_FREE_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6ImtleV9vRVVoNnNyZE5GIn0.eyJraWQiOiJrZXlfb0VVaDZzcmRORiIsImp0aSI6IjA5NDlmM2NhLTVkZWYtNDM0ZS05YWI4LTJmOWJiOTc0YmRlMyIsImlhdCI6MTc3Njk0MjY5OSwiZXhwIjoxODA4NDc4Njk5LCJsaWNlbnNlX2lkIjoiRlJFRV9LRUxIT0xERklUIiwibGljZW5zZV9zdGF0dXMiOiJ2YWxpZCIsImRvbWFpbl9oYXNoIjpudWxsLCJkb21haW4iOm51bGwsInBsYW4iOiJGcmVlIiwiZmVhdHVyZXMiOnsid3BjaGF0LmZhcXMiOnRydWV9LCJsaW1pdHMiOnsid3BjaGF0LmxpbWl0cy5hZ2VudHMiOjEsIndwY2hhdC5hZ2VudHMubGltaXQiOjEsIndwY2hhdC5mYXFzLmxpbWl0IjoxMCwid3BjaGF0LmZ1bm5lbHMubGltaXQiOjB9LCJpc19mcmVlX3Rva2VuIjp0cnVlLCJyZWZlcmVuY2UiOm51bGx9.3UI0fwZi534e-K-JIrodFIyKyRqNRDUII8ZRZOmSL-UriS0_DoJ8F2CzJjbVMwHwcucngcmd_9gv01eG8qXnfA';


	/**
	 * Constructor.
	 *
	 * @param KeyStoreInterface      $keyStore Key store for verification.
	 * @param PrivateSettingsService $privateSettings Private settings service.
	 * @param JWTVerifier            $jwtVerifier JWT verifier.
	 * @param ApiService             $apiService API service.
	 */
	public function __construct(
		KeyStoreInterface $keyStore,
		PrivateSettingsService $privateSettings,
		JWTVerifier $jwtVerifier,
		ApiService $apiService
	) {
		$this->keyStore = $keyStore;
		$this->privateSettings = $privateSettings;
		$this->jwtVerifier = $jwtVerifier;
		$this->apiService = $apiService;
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void
	{
		// No WordPress hooks needed for base provider
	}

	/**
	 * @inheritDoc
	 */
	public function fetchEntitlement(string $license_id, string $site_id): array
	{
		try {
			$data = [
				'license_key' => $license_id,
				'url' => $site_id,
			];

			$response = $this->apiService->post('entitlements', $data, false);

			if (is_wp_error($response)) {
				return [
					'success' => false,
					'message' => sprintf(
				/* translators: %s: Error message */
						__('Failed to fetch entitlement: %s', 'smashballoon-wpchat-livechat-customer-support'),
						$response->get_error_message()
					),
					'error_code' => 'fetch_failed',
					'upsell_url' => null,
				];
			}

			// Handle error responses - the API returns success:false for business logic errors
			if (isset($response['success']) && !$response['success']) {
				return [
					'success' => false,
					'message' => $response['message'] ?? __('Unknown error from entitlement server.', 'smashballoon-wpchat-livechat-customer-support'),
					'error_code' => $response['error_code'] ?? 'unknown_error',
					'upsell_url' => $response['upsell_url'] ?? null,
					'details' => $response['details'] ?? null,
				];
			}

			if (!isset($response['token'])) {
				return [
					'success' => false,
					'message' => __('No token in successful response.', 'smashballoon-wpchat-livechat-customer-support'),
					'error_code' => 'missing_token',
					'upsell_url' => null,
				];
			}

			// Store the token
			$this->storeToken($response['token']);

			// Clear grace period if successful
			delete_option(self::GRACE_START_OPTION);

			return [
				'success' => true,
				'message' => __('Entitlement fetched successfully.', 'smashballoon-wpchat-livechat-customer-support'),
				'token' => $response['token'],
				'expires_in' => $response['expires_in'] ?? null,
			];
		} catch (\Exception $e) {
			return [
				'success' => false,
				'message' => sprintf(
					/* translators: %s: Error message */
					__('Error fetching entitlement: %s', 'smashballoon-wpchat-livechat-customer-support'),
					$e->getMessage()
				),
				'error_code' => 'exception',
				'upsell_url' => null,
			];
		}
	}

	/**
	 * @inheritDoc
	 */
	public function verifyToken(string $token): array
	{
		try {
			// Parse JWT header to get kid
			$parts = explode('.', $token);
			if (count($parts) !== 3) {
				throw new \UnexpectedValueException('Invalid token format');
			}

			$header = json_decode($this->base64UrlDecode($parts[0]), true);
			if (!$header || !isset($header['kid'])) {
				throw new \UnexpectedValueException('Invalid token header');
			}


			// Get the public key
			$keyData = $this->keyStore->getKey($header['kid']);
			if (!$keyData) {
				// Try refreshing keys once
				$this->keyStore->refreshKeys();
				$keyData = $this->keyStore->getKey($header['kid']);

				if (!$keyData) {
					throw new \UnexpectedValueException('Unknown key ID: ' . $header['kid']);
				}
			}


			// Verify token with our custom verifier
			$result = $this->jwtVerifier->verify($token, $keyData['key'], $keyData['alg']);

			if (!$result['valid']) {
				return [
					'success' => false,
					'error' => $result['error'],
					'message' => $result['message'],
				];
			}

			$claims = $result['payload'];

			// Verify domain binding
			$currentDomain = wp_parse_url(home_url(), PHP_URL_HOST);


			if (!isset($claims['domain']) || $claims['domain'] !== $currentDomain) {
				// Check if domain hash matches (for staging/dev)
				if (!isset($claims['domain_hash']) || !$this->verifyDomainHash($currentDomain, $claims['domain_hash'])) {
					throw new \UnexpectedValueException('Domain mismatch');
				}
			}

			return [
				'success' => true,
				'claims' => $claims,
				'expires_at' => $claims['exp'] ?? 0,
			];
		} catch (\Exception $e) {
			return [
				'success' => false,
				'error' => 'verification_failed',
				'message' => sprintf(
					/* translators: %s: Error message */
					__('Token verification failed: %s', 'smashballoon-wpchat-livechat-customer-support'),
					$e->getMessage()
				),
			];
		}
	}

	/**
	 * @inheritDoc
	 */
	public function getEntitlement(): ?array
	{
		// Return cached if available
		if ($this->cachedEntitlement !== null) {
			return $this->cachedEntitlement;
		}

		// In free version, always use free entitlements
		if (defined('WPCHAT_LITE') && WPCHAT_LITE) {
			return $this->handleNoToken();
		}

		// Get stored token
		$token = get_option(self::TOKEN_OPTION);
		if (!$token) {
			return $this->handleNoToken();
		}

		// Verify hash integrity
		$storedHash = get_option(self::HASH_OPTION);
		$actualHash = hash('sha256', $token);

		if ($storedHash !== $actualHash) {
			// Token has been tampered with
			$this->clearStoredToken();
			return $this->handleNoToken();
		}

		// Verify token
		$result = $this->verifyToken($token);

		// Debug logging for token verification
		if (defined('WP_DEBUG') && WP_DEBUG) {
			Logger::error('[WPChat Debug] Token verification result: ' . json_encode($result));
		}

		if ($result['success']) {
			$this->cachedEntitlement = $result['claims'];

			// Store as last valid for grace period
			update_option(self::LAST_VALID_OPTION, [
				'token' => $token,
				'claims' => $result['claims'],
				'verified_at' => time(),
			]);

			return $this->cachedEntitlement;
		}

		// Token verification failed
		if (isset($result['error']) && $result['error'] === 'expired') {
			return $this->handleExpiredToken();
		}

		// Other verification failures
		$this->clearStoredToken();
		return $this->handleNoToken();
	}

	/**
	 * @inheritDoc
	 */
	public function isFeatureEnabled(string $feature_key): bool
	{
		$entitlement = $this->getEntitlement();
		if (!$entitlement) {
			return false;
		}

		$features = $entitlement['features'] ?? [];
		return isset($features[$feature_key]) && $features[$feature_key] === true;
	}

	/**
	 * @inheritDoc
	 */
	public function getLimit(string $limit_key): int
	{
		$entitlement = $this->getEntitlement();
		if (!$entitlement) {
			return $this->getDefaultLimit($limit_key);
		}

		$limits = $entitlement['limits'] ?? [];
		return isset($limits[$limit_key]) ? (int) $limits[$limit_key] : $this->getDefaultLimit($limit_key);
	}

	/**
	 * @inheritDoc
	 */
	public function getPlan(): string
	{
		$entitlement = $this->getEntitlement();
		if (!$entitlement) {
			return 'Free';
		}

		return $entitlement['plan'] ?? 'Free';
	}

	/**
	 * @inheritDoc
	 */
	public function isInGracePeriod(): bool
	{
		$graceStart = get_option(self::GRACE_START_OPTION);
		if (!$graceStart) {
			return false;
		}

		$elapsed = time() - $graceStart;
		return $elapsed < self::GRACE_PERIOD;
	}

	/**
	 * @inheritDoc
	 */
	public function clearCache(): bool
	{
		$this->cachedEntitlement = null;
		return true;
	}

	/**
	 * Clear all entitlement data including token, hash, and grace period.
	 *
	 * @return void
	 */
	public function clearAllEntitlementData(): void
	{
		delete_option(self::TOKEN_OPTION);
		delete_option(self::HASH_OPTION);
		delete_option(self::GRACE_START_OPTION);
		delete_option(self::LAST_VALID_OPTION);
		$this->clearCache();
	}

	/**
	 * @inheritDoc
	 */
	public function storeToken(string $token): bool
	{
		$result1 = update_option(self::TOKEN_OPTION, $token);
		$result2 = update_option(self::HASH_OPTION, hash('sha256', $token));
		$this->clearCache();
		return $result1 && $result2;
	}

	/**
	 * Clear stored token and related data.
	 */
	private function clearStoredToken(): void
	{
		delete_option(self::TOKEN_OPTION);
		delete_option(self::HASH_OPTION);
		$this->clearCache();
	}

	/**
	 * Handle case when no token is available.
	 *
	 * @return array|null
	 */
	private function handleNoToken(): ?array
	{
		// Check if we're in grace period
		if (!defined('WPCHAT_LITE') && $this->isInGracePeriod()) {
			$lastValid = get_option(self::LAST_VALID_OPTION);
			if ($lastValid && isset($lastValid['claims'])) {
				$this->cachedEntitlement = $lastValid['claims'];
				return $this->cachedEntitlement;
			}
		}

		// Use default free tier token
		$result = $this->verifyDefaultToken();

		if ($result['success']) {
			$this->cachedEntitlement = $result['claims'];
			return $this->cachedEntitlement;
		}

		// Fallback to raw entitlements if default token fails
		$this->cachedEntitlement = [
			'plan' => 'Free',
			'features' => $this->getDefaultFeatures(),
			'limits' => $this->getDefaultLimits(),
			'license_status' => 'inactive',
		];

		return $this->cachedEntitlement;
	}

	/**
	 * Handle expired token.
	 *
	 * @return array|null
	 */
	private function handleExpiredToken(): ?array
	{
		// Start grace period if not already started
		if (!get_option(self::GRACE_START_OPTION)) {
			update_option(self::GRACE_START_OPTION, time());
		}

		return $this->handleNoToken();
	}

	/**
	 * Verify domain hash for staging/dev environments.
	 *
	 * @param string $domain Current domain.
	 * @param string $hash Expected hash.
	 * @return bool
	 */
	private function verifyDomainHash(string $domain, string $hash): bool
	{
		// Implementation would use a shared secret
		$secret = defined('WPCHAT_DOMAIN_SECRET') ? WPCHAT_DOMAIN_SECRET : '';
		$expectedHash = hash_hmac('sha256', $domain, $secret);
		return hash_equals($expectedHash, $hash);
	}

	/**
	 * Verify the default free tier token.
	 *
	 * @return array Verification result with claims.
	 */
	private function verifyDefaultToken(): array
	{
		try {
			$token = self::DEFAULT_FREE_TOKEN;

			// Parse JWT header to get kid
			$parts = explode('.', $token);
			if (count($parts) !== 3) {
				throw new \UnexpectedValueException('Invalid default token format');
			}

			$header = json_decode($this->base64UrlDecode($parts[0]), true);
			if (!$header || !isset($header['kid'])) {
				throw new \UnexpectedValueException('Invalid default token header');
			}

			// Get the default free tier public key
			$keyData = $this->keyStore->getKey($header['kid']);
			if (!$keyData) {
				throw new \UnexpectedValueException('Default free tier key not found');
			}

			// Verify token with our custom verifier
			$result = $this->jwtVerifier->verify($token, $keyData['key'], $keyData['alg']);

			if (!$result['valid']) {
				return [
					'success' => false,
					'error' => $result['error'],
					'message' => $result['message'],
				];
			}

			// For free tier, skip domain verification since it applies to all domains
			$claims = $result['payload'];

			return [
				'success' => true,
				'claims' => $claims,
				'expires_at' => $claims['exp'] ?? 0,
			];
		} catch (\Exception $e) {
			return [
				'success' => false,
				'error' => 'default_verification_failed',
				'message' => 'Default free tier token verification failed: ' . $e->getMessage(),
			];
		}
	}

	/**
	 * Get default limit for a key.
	 *
	 * @param string $key Limit key.
	 * @return int
	 */
	private function getDefaultLimit(string $key): int
	{
		$defaults = $this->getDefaultLimits();
		return $defaults[$key] ?? 0;
	}

	/**
	 * Get default features for Free plan.
	 *
	 * @return array
	 */
	private function getDefaultFeatures(): array
	{
		// Try to get features from the default token
		$result = $this->verifyDefaultToken();
		if ($result['success'] && isset($result['claims']['features'])) {
			return $result['claims']['features'];
		}

		// Fallback to hardcoded features if token verification fails
		return [
			'wpchat.faqs' => true
		];
	}

	/**
	 * Get default limits for Free plan.
	 *
	 * @return array
	 */
	private function getDefaultLimits(): array
	{
		// Try to get limits from the default token
		$result = $this->verifyDefaultToken();

		if ($result['success'] && isset($result['claims']['limits'])) {
			return $result['claims']['limits'];
		}

		// Fallback to hardcoded limits if token verification fails
		return [];
	}

	/**
	 * Base64 URL decode.
	 *
	 * @param string $input
	 * @return string
	 */
	private function base64UrlDecode(string $input): string
	{
		$remainder = strlen($input) % 4;
		if ($remainder) {
			$padlen = 4 - $remainder;
			$input .= str_repeat('=', $padlen);
		}
		return base64_decode(strtr($input, '-_', '+/'));
	}

	/**
	 * Verify a token with the API server.
	 *
	 * @param string $token The token to verify.
	 * @return array Verification result.
	 */
	public function verifyTokenWithApi(string $token): array
	{
		try {
			$response = $this->apiService->post('entitlements/verify', ['token' => $token], false);

			if (is_wp_error($response)) {
				return [
					'success' => false,
					'message' => sprintf(
						/* translators: %s: Error message */
						__('Failed to verify token: %s', 'smashballoon-wpchat-livechat-customer-support'),
						$response->get_error_message()
					),
					'error_code' => 'verification_failed',
				];
			}

			return $response;
		} catch (\Exception $e) {
			return [
				'success' => false,
				'message' => sprintf(
					/* translators: %s: Error message */
					__('Error verifying token: %s', 'smashballoon-wpchat-livechat-customer-support'),
					$e->getMessage()
				),
				'error_code' => 'exception',
			];
		}
	}

	/**
	 * Deactivate a site from a license.
	 *
	 * @param string $license_id License ID.
	 * @param string $site_id Site ID.
	 * @return array Deactivation result.
	 */
	public function deactivateSite(string $license_id, string $site_id): array
	{
		try {
			$data = [
				'license_id' => $license_id,
				'site_id' => $site_id,
			];

			$response = $this->apiService->post('entitlements/deactivate', $data, false);

			if (is_wp_error($response)) {
				return [
					'success' => false,
					'message' => sprintf(
						/* translators: %s: Error message */
						__('Failed to deactivate site: %s', 'smashballoon-wpchat-livechat-customer-support'),
						$response->get_error_message()
					),
					'error_code' => 'deactivation_failed',
				];
			}

			return $response;
		} catch (\Exception $e) {
			return [
				'success' => false,
				'message' => sprintf(
					/* translators: %s: Error message */
					__('Error deactivating site: %s', 'smashballoon-wpchat-livechat-customer-support'),
					$e->getMessage()
				),
				'error_code' => 'exception',
			];
		}
	}

	/**
	 * Get public keys from the API.
	 *
	 * @return array Keys result.
	 */
	public function getPublicKeys(): array
	{
		try {
			$response = $this->apiService->get('keys', [], false);

			if (is_wp_error($response)) {
				return [
					'success' => false,
					'message' => sprintf(
						/* translators: %s: Error message */
						__('Failed to fetch public keys: %s', 'smashballoon-wpchat-livechat-customer-support'),
						$response->get_error_message()
					),
					'error_code' => 'keys_fetch_failed',
				];
			}

			return $response;
		} catch (\Exception $e) {
			return [
				'success' => false,
				'message' => sprintf(
					/* translators: %s: Error message */
					__('Error fetching public keys: %s', 'smashballoon-wpchat-livechat-customer-support'),
					$e->getMessage()
				),
				'error_code' => 'exception',
			];
		}
	}
}
