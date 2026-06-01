<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface KeyStoreInterface
 * 
 * Manages public keys for entitlement token verification.
 * 
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface KeyStoreInterface
{
    /**
     * Get a public key by its key ID.
     *
     * @param string $kid The key ID.
     * @return array|null The key data or null if not found.
     */
    public function getKey(string $kid): ?array;

    /**
     * Refresh the keyring from the remote server.
     *
     * @return bool True if refresh was successful.
     */
    public function refreshKeys(): bool;

    /**
     * Get all available keys.
     *
     * @return array Array of keys indexed by kid.
     */
    public function getAllKeys(): array;

    /**
     * Check if a key needs refresh based on cache age.
     *
     * @return bool True if keys should be refreshed.
     */
    public function needsRefresh(): bool;
}