<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\KeyStoreInterface;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\ApiService;

/**
 * Class KeyStore
 *
 * Manages public keys for JWT verification with built-in keyring and remote refresh.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class KeyStore implements KeyStoreInterface, ServiceProviderInterface
{
    /**
     * API service instance.
     *
     * @var ApiService
     */
    private ApiService $apiService;

    /**
     * Built-in public key ring.
     * These are the default keys shipped with the plugin.
     */
    private const BUILT_IN_KEYS = [
        'key_oEUh6srdNF' => [
            'kid' => 'key_oEUh6srdNF',
            'alg' => 'ES256',
            'key' => '-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE0/dXIVRg5h70diNUD2P51oiaUCDd
Adhq0HnJxE9QvWTUZhRavjTmn8WiUuNQKQl3PF76rfXkvihKWeoWgibtuA==
-----END PUBLIC KEY-----
',
            'use' => 'sig',
            'valid_from' => '2025-12-09',
            'valid_until' => '2027-12-09',
            'description' => 'Default public key for free tier entitlement tokens'
        ]
    ];

    /**
     * Transient key for cached keys.
     */
    private const CACHE_KEY = 'wpchat_public_keys_cache';

    /**
     * Cache duration (24 hours).
     */
    private const CACHE_DURATION = 86400;


    /**
     * Last refresh timestamp option.
     */
    private const LAST_REFRESH_OPTION = 'wpchat_keys_last_refresh';

    /**
     * Constructor.
     *
     * @param ApiService $apiService API service instance.
     */
    public function __construct(ApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * @inheritDoc
     */
    public function register(): void
    {
        // No hooks needed for base implementation
    }

    /**
     * @inheritDoc
     */
    public function getKey(string $kid): ?array
    {
        $keys = $this->getAllKeys();
        return $keys[$kid] ?? null;
    }

    /**
     * @inheritDoc
     */
    public function refreshKeys(): bool
    {
        try {
            $response = $this->apiService->get('keys', [], false);

            if (is_wp_error($response)) {
                $this->logError('Failed to fetch keys: ' . $response->get_error_message());
                return false;
            }

            // Handle API response format - check for success field if present
            if (isset($response['success']) && !$response['success']) {
                $this->logError('Keys API returned error: ' . ($response['message'] ?? 'Unknown error'));
                return false;
            }

            if (!$response || !isset($response['keys']) || !is_array($response['keys'])) {
                $this->logError('Invalid keys response format');
                return false;
            }

            // Validate and process keys
            $validKeys = [];
            foreach ($response['keys'] as $key) {
                if ($this->validateKeyData($key)) {
                    $validKeys[$key['kid']] = $key;
                }
            }

            if (empty($validKeys)) {
                $this->logError('No valid keys in response');
                return false;
            }

            // Cache the keys
            set_transient(self::CACHE_KEY, $validKeys, self::CACHE_DURATION);
            update_option(self::LAST_REFRESH_OPTION, time());

            return true;
        } catch (\Exception $e) {
            $this->logError('Exception while refreshing keys: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * @inheritDoc
     */
    public function getAllKeys(): array
    {
        // Try to get cached keys first
        $cachedKeys = get_transient(self::CACHE_KEY);
        if ($cachedKeys !== false && is_array($cachedKeys)) {
            return array_merge(self::BUILT_IN_KEYS, $cachedKeys);
        }

        // Return built-in keys if no cache
        return self::BUILT_IN_KEYS;
    }

    /**
     * @inheritDoc
     */
    public function needsRefresh(): bool
    {
        $lastRefresh = get_option(self::LAST_REFRESH_OPTION, 0);
        $timeSinceRefresh = time() - $lastRefresh;

        // Refresh if never refreshed or older than 24 hours
        return $lastRefresh === 0 || $timeSinceRefresh > self::CACHE_DURATION;
    }

    /**
     * Validate key data structure.
     *
     * @param array $keyData
     * @return bool
     */
    private function validateKeyData(array $keyData): bool
    {
        // Required fields
        if (!isset($keyData['kid']) || !isset($keyData['alg']) || !isset($keyData['key'])) {
            return false;
        }

        // Validate algorithm
        if (!in_array($keyData['alg'], ['ES256', 'Ed25519', 'RS256'])) {
            return false;
        }

        // Validate key format based on algorithm
        if ($keyData['alg'] === 'Ed25519' && strlen(base64_decode($keyData['key'])) !== 32) {
            return false;
        }

        // Check validity dates if present
        if (isset($keyData['valid_until'])) {
            $validUntil = strtotime($keyData['valid_until']);
            if ($validUntil && $validUntil < time()) {
                return false; // Key has expired
            }
        }

        if (isset($keyData['valid_from'])) {
            $validFrom = strtotime($keyData['valid_from']);
            if ($validFrom && $validFrom > time()) {
                return false; // Key not yet valid
            }
        }

        return true;
    }

    /**
     * Log error messages.
     *
     * @param string $message
     */
    private function logError(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            Logger::error('[WPChat KeyStore] ' . $message);
        }
    }

    /**
     * Get a specific built-in key (for testing).
     *
     * @param string $kid
     * @return array|null
     */
    public function getBuiltInKey(string $kid): ?array
    {
        return self::BUILT_IN_KEYS[$kid] ?? null;
    }
}
