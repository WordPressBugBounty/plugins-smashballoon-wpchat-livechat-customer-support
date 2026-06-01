<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\GateInterface;

/**
 * Class EntitlementDataService
 *
 * Adds entitlement data to the localized data object for frontend consumption.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class EntitlementDataService implements ServiceProviderInterface
{
    /**
     * Gate service for entitlement checks.
     *
     * @var GateInterface
     */
    private GateInterface $gate;

    /**
     * Constructor.
     *
     * @param GateInterface $gate
     */
    public function __construct(GateInterface $gate)
    {
        $this->gate = $gate;
    }

    /**
     * @inheritDoc
     */
    public function register(): void
    {
        // Create a filter that the AssetsManagerService can use
    }

    /**
     * Get entitlement data for localization.
     *
     * @return array
     */
    public function getEntitlementData(): array
    {
        return $this->addEntitlementData([])['entitlement'] ?? [];
    }

    /**
     * Get feature flags for localization.
     *
     * @return array
     */
    public function getFeatureFlags(): array
    {
        return [
            'is_pro' => $this->gate->getPlan() !== 'Free',
        ];
    }

    /**
     * Get limits for localization.
     *
     * @return array
     */
    public function getLimits(): array
    {
        return [
            'monthly_messages' => $this->gate->getLimit('wpchat.limits.monthly_messages'),
            'daily_messages' => $this->gate->getLimit('wpchat.limits.daily_messages'),
            'max_faqs' => $this->gate->getLimit('wpchat.faqs.limit'),
            'max_agents' => $this->gate->getLimit('wpchat.agents.limit'),
            'data_retention_days' => $this->gate->getLimit('wpchat.limits.data_retention_days'),
        ];
    }

    /**
     * Add entitlement data to localized admin data.
     *
     * @param array $data Existing localized data.
     * @return array Modified data with entitlement info.
     */
    private function addEntitlementData(array $data): array
    {
        $entitlementMeta = $this->gate->getEntitlementMeta();

        $data['entitlement'] = [
            'plan' => $entitlementMeta['plan'] ?? 'Free',
            'features' => $entitlementMeta['features'] ?? [],
            'limits' => $entitlementMeta['limits'] ?? [],
            'valid' => $entitlementMeta['valid'] ?? false,
            'in_grace_period' => $entitlementMeta['in_grace_period'] ?? false,
            'license_status' => $entitlementMeta['license_status'] ?? 'inactive',
            'expires_at' => $entitlementMeta['expires_at'] ?? null,
        ];

        // Add feature flags for common checks
        $data['features'] = $this->getFeatureFlags();

        // Add limits for UI display
        $data['limits'] = $this->getLimits();

        return $data;
    }

    /**
     * Build the localize script output.
     * This mimics WordPress's wp_localize_script functionality.
     *
     * @param string $object_name
     * @param array $data
     * @return string
     */
    private function buildLocalizeScriptOutput(string $object_name, array $data): string
    {
        $json_data = wp_json_encode($data);
        if (!$json_data) {
            return false;
        }

        $script = "var $object_name = $json_data;";
        return $script;
    }
}
