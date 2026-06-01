<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface EntitlementProviderInterface
 *
 * Defines the contract for entitlement management services.
 * This handles secure token-based plan/feature/limit management.
 *
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface EntitlementProviderInterface
{
	/**
	 * Fetch a new entitlement token from the server.
	 *
	 * @param string $license_id The license ID to fetch entitlements for.
	 * @param string $site_id The canonical site domain.
	 * @return array Response containing success status and token data.
	 */
	public function fetchEntitlement(string $license_id, string $site_id): array;

	/**
	 * Verify an entitlement token's signature and claims.
	 *
	 * @param string $token The raw JWT/COSE token to verify.
	 * @return array Verification result with decoded claims if valid.
	 */
	public function verifyToken(string $token): array;

	/**
	 * Get the current verified entitlement data.
	 *
	 * @return array|null The verified entitlement data or null if invalid/missing.
	 */
	public function getEntitlement(): ?array;

	/**
	 * Check if a specific feature is enabled.
	 *
	 * @param string $feature_key The feature key to check (e.g., 'faq.smart_search').
	 * @return bool True if feature is enabled, false otherwise.
	 */
	public function isFeatureEnabled(string $feature_key): bool;

	/**
	 * Get a specific limit value.
	 *
	 * @param string $limit_key The limit key to check (e.g., 'chatbot.monthly_msgs').
	 * @return int The limit value, or 0 if not found.
	 */
	public function getLimit(string $limit_key): int;

	/**
	 * Get the current plan name.
	 *
	 * @return string The plan name (Free/Pro/Business/etc).
	 */
	public function getPlan(): string;

	/**
	 * Check if the entitlement is in grace period.
	 *
	 * @return bool True if in grace period, false otherwise.
	 */
	public function isInGracePeriod(): bool;

	/**
	 * Clear the cached entitlement data.
	 *
	 * @return bool True if cleared successfully.
	 */
	public function clearCache(): bool;

	/**
	 * Store a JWT entitlement token.
	 *
	 * @param string $token The JWT token to store.
	 * @return bool True if stored successfully.
	 */
	public function storeToken(string $token): bool;
}
