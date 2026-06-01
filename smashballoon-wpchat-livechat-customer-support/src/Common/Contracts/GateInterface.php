<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface GateInterface
 *
 * Public API for checking features and limits.
 * This is the main interface that should be used throughout the codebase.
 *
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface GateInterface
{
	/**
	 * Check if a feature is enabled.
	 *
	 * @param string $feature The feature key (e.g., 'faq.smart_search').
	 * @return bool True if enabled, false otherwise.
	 */
	public function featureEnabled(string $feature): bool;

	/**
	 * Get a limit value.
	 *
	 * @param string $limit The limit key (e.g., 'chatbot.monthly_msgs').
	 * @return int The limit value, or 0 if not found.
	 */
	public function getLimit(string $limit): int;

	/**
	 * Get the current plan.
	 *
	 * @return string The plan name (Free/Pro/Business/etc).
	 */
	public function getPlan(): string;

	/**
	 * Get all entitlement metadata.
	 *
	 * @return array Read-only array of entitlement data.
	 */
	public function getEntitlementMeta(): array;

	/**
	 * Check if the current entitlement is valid.
	 *
	 * @return bool True if valid, false otherwise.
	 */
	public function isValid(): bool;

	/**
	 * Get the expiration timestamp of the current entitlement.
	 *
	 * @return int|null Unix timestamp or null if no entitlement.
	 */
	public function getExpiration(): ?int;

	/**
	 * Check if user can perform an action based on current usage and limits only.
	 * This centralizes all limit checking logic including handling -1 as unlimited.
	 *
	 * @param string $limitName The limit key to check (e.g., 'wpchat.agents.limit').
	 * @param int $currentCount Current usage count.
	 * @param string $displayName Human-readable name for error messages (e.g., 'Agent').
	 * @param string $action Action being performed (e.g., 'create', 'add').
	 * @return true|\WP_Error Returns true if allowed, WP_Error if not.
	 */
	public function checkLimit(string $limitName, int $currentCount, string $displayName = 'Item', string $action = 'create');

	/**
	 * Check if user can perform an action based on feature entitlement and limits.
	 *
	 * @param string $featureName The feature key to check (e.g., 'wpchat.funnels').
	 * @param string $limitName The limit key to check (e.g., 'wpchat.funnels.limit').
	 * @param int $currentCount The current count of items.
	 * @param string $displayName The display name for error messages (e.g., 'Funnel', 'FAQ').
	 * @param string $action The action being performed (e.g., 'create', 'clone').
	 * @return \WP_Error|true WP_Error with formatted message on failure, true on success.
	 */
	public function checkFeatureAndLimit(string $featureName, string $limitName, int $currentCount, string $displayName, string $action = 'create');
}
