<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\GateInterface;
use SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;

/**
 * Class GateService
 *
 * Main public API for checking features and limits.
 * This is the single source of truth for entitlement checks.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class GateService implements GateInterface, ServiceProviderInterface
{
	/**
	 * Entitlement provider instance.
	 *
	 * @var EntitlementProviderInterface
	 */
	private EntitlementProviderInterface $entitlementProvider;

	/**
	 * Constructor.
	 *
	 * @param EntitlementProviderInterface $entitlementProvider
	 */
	public function __construct(EntitlementProviderInterface $entitlementProvider)
	{
		$this->entitlementProvider = $entitlementProvider;
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void
	{
		// No WordPress hooks needed
	}

	/**
	 * @inheritDoc
	 */
	public function featureEnabled(string $feature): bool
	{
		return $this->entitlementProvider->isFeatureEnabled($feature);
	}

	/**
	 * @inheritDoc
	 */
	public function getLimit(string $limit): int
	{
		return $this->entitlementProvider->getLimit($limit);
	}

	/**
	 * @inheritDoc
	 */
	public function getPlan(): string
	{
		return $this->entitlementProvider->getPlan();
	}

	/**
	 * @inheritDoc
	 */
	public function getEntitlementMeta(): array
	{
		$entitlement = $this->entitlementProvider->getEntitlement();
		if (!$entitlement) {
			return [
				'plan' => 'Free',
				'features' => [],
				'limits' => [],
				'status' => 'inactive',
				'valid' => false,
			];
		}

		// Return read-only copy with selected fields
		return [
			'plan' => $entitlement['plan'] ?? 'Free',
			'features' => $entitlement['features'] ?? [],
			'limits' => $entitlement['limits'] ?? [],
			'license_id' => $entitlement['license_id'] ?? null,
			'license_status' => $entitlement['license_status'] ?? 'inactive',
			'expires_at' => $entitlement['exp'] ?? null,
			'issued_at' => $entitlement['iat'] ?? null,
			'valid' => $this->isValid(),
			'in_grace_period' => $this->entitlementProvider->isInGracePeriod(),
		];
	}

	/**
	 * @inheritDoc
	 */
	public function isValid(): bool
	{
		$entitlement = $this->entitlementProvider->getEntitlement();
		if (!$entitlement) {
			return false;
		}

		// Check if token is expired
		if (isset($entitlement['exp']) && $entitlement['exp'] < time()) {
			// But still valid if in grace period
			return $this->entitlementProvider->isInGracePeriod();
		}

		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getExpiration(): ?int
	{
		$entitlement = $this->entitlementProvider->getEntitlement();
		if (!$entitlement || !isset($entitlement['exp'])) {
			return null;
		}

		return (int) $entitlement['exp'];
	}

	/**
	 * Check if a Pro feature is available.
	 * Convenience method that checks both plan and specific feature.
	 *
	 * @param string $feature
	 * @return bool
	 */
	public function isProFeature(string $feature): bool
	{
		// First check if we're on a Pro plan
		$plan = $this->getPlan();
		if ($plan === 'Free') {
			return false;
		}

		// Then check the specific feature
		return $this->featureEnabled($feature);
	}

	/**
	 * Get remaining limit for a countable resource.
	 * This would integrate with usage tracking in the future.
	 *
	 * @param string $limit
	 * @param int    $used
	 * @return int Returns PHP_INT_MAX for unlimited (-1), 0 for no access (0), or remaining count
	 */
	public function getRemainingLimit(string $limit, int $used): int
	{
		$total = $this->getLimit($limit);
		if ($total === -1) {
			return PHP_INT_MAX; // Unlimited access
		}
		if ($total === 0) {
			return 0; // No access
		}

		$remaining = $total - $used;
		return max(0, $remaining);
	}

	/**
	 * Check if user can perform an action based on current usage and limits.
	 * This centralizes all limit checking logic.
	 *
	 * @param string $limitName The limit key to check
	 * @param int    $currentCount Current usage count
	 * @param string $displayName Human-readable name for error messages
	 * @param string $action Action being performed (e.g., 'create', 'add')
	 * @return true|\WP_Error Returns true if allowed, WP_Error if not
	 */
	public function checkLimit(string $limitName, int $currentCount, string $displayName = 'Item', string $action = 'create')
	{
		$limit = $this->getLimit($limitName);
		
		// -1 means unlimited access
		if ($limit === -1) {
			return true;
		}
		
		// 0 means no access at all
		if ($limit === 0) {
			return new \WP_Error(
				'feature_not_allowed',
				sprintf(
					/* translators: 1: Display name plural, 2: Action verb */
					__('[WPC-SYS-003] %1$s are not available in your current plan. Upgrade to %2$s %1$s.', 'smashballoon-wpchat-livechat-customer-support'),
					$displayName . 's',
					$action
				),
				['status' => 403]
			);
		}
		
		// Positive number means actual limit
		if ($currentCount >= $limit) {
			$displayNamePlural = $displayName . 's';
			
			return new \WP_Error(
				'limit_exceeded',
				sprintf(
					/* translators: 1: Display name, 2: Current limit, 3: Display name plural */
					__('%1$s limit reached. Your current plan allows %2$d %3$s. Upgrade your plan for more %3$s.', 'smashballoon-wpchat-livechat-customer-support'),
					$displayName,
					$limit,
					strtolower($displayNamePlural)
				),
				['status' => 403]
			);
		}

		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function checkFeatureAndLimit(string $featureName, string $limitName, int $currentCount, string $displayName, string $action = 'create')
	{
		// Check if user has the required feature entitlement
		if (!$this->featureEnabled($featureName)) {
			// If user doesn't have the feature at all, they need to upgrade
			$currentPlan = $this->getPlan();
			$requiredPlan = ($currentPlan === 'Free') ? 'Pro' : 'Elite';
			
			return new \WP_Error(
				strtolower($displayName) . '_entitlement_required',
				sprintf(
					/* translators: 1: Display name (e.g. "Funnels"), 2: Required plan, 3: Action verb, 4: Display name plural */
					__('[WPC-SYS-003] %1$s feature requires a %2$s plan. Upgrade your plan to %3$s %4$s.', 'smashballoon-wpchat-livechat-customer-support'),
					$displayName,
					$requiredPlan,
					$action,
					$displayName . 's'
				),
				['status' => 403]
			);
		}

		// Check limits
		$limit = $this->getLimit($limitName);
		
		// -1 means unlimited access
		if ($limit === -1) {
			return true;
		}
		
		// 0 means no access at all
		if ($limit === 0) {
			return new \WP_Error(
				strtolower($displayName) . '_not_allowed',
				sprintf(
					/* translators: 1: Display name, 2: Action verb, 3: Display name plural */
					__('[WPC-SYS-003] %1$s are not available in your current plan. Upgrade to %2$s %3$s.', 'smashballoon-wpchat-livechat-customer-support'),
					$displayName . 's',
					$action,
					$displayName . 's'
				),
				['status' => 403]
			);
		}
		
		// Positive number means actual limit
		if ($limit > 0 && $currentCount >= $limit) {
			$displayNamePlural = $displayName . 's';
			
			return new \WP_Error(
				strtolower($displayName) . '_limit_exceeded',
				sprintf(
					/* translators: 1: Display name, 2: Current limit, 3: Display name plural */
					__('%1$s limit reached. Your current plan allows %2$d %3$s. Upgrade to Elite for unlimited %3$s.', 'smashballoon-wpchat-livechat-customer-support'),
					$displayName,
					$limit,
					$displayNamePlural
				),
				['status' => 403]
			);
		}

		return true;
	}
}
