<?php

namespace SmashBalloon\WPChat\Common\Services\License;

use SmashBalloon\WPChat\Common\Contracts\LicenseProviderInterface;
use SmashBalloon\WPChat\Common\Services\ApiService;

/**
 * Class WPChatProxyLicenseProvider
 *
 * License provider implementation that communicates with the WPChat API site.
 * Uses the new proxy endpoints for license activation, deactivation, and checking.
 * The API acts as a proxy to EDD Software Licensing.
 *
 * @package SmashBalloon\WPChat\Common\Services\License
 */
class WPChatProxyLicenseProvider implements LicenseProviderInterface
{
    /**
     * The API service instance.
     */
    private ApiService $apiService;

    /**
     * Constructor.
     */
    public function __construct(ApiService $apiService)
	{
        $this->apiService = $apiService;
    }

    /**
     * @inheritDoc
     */
    public function activate(string $license_key, string $site_url): array
    {
        $response = $this->apiService->post('license/activate', [
            'license' => $license_key,
            'url' => $site_url
        ], false);

        // Convert WP_Error to standard format
        if (is_wp_error($response)) {
            // Check if the error message is an EDD error code
            $error_message = $response->get_error_message();

            // Return raw error for normalizeResponse to handle
            return [
                'error' => $error_message
            ];
        }

        // Return raw response for normalizeResponse to handle
        return $response;
    }

    /**
     * @inheritDoc
     */
    public function deactivate(string $license_key, string $site_url): array
    {
        $response = $this->apiService->post('license/deactivate', [
            'license' => $license_key,
            'url' => $site_url
        ], false);

        // Convert WP_Error to standard format
        if (is_wp_error($response)) {
            return [
                'error' => $response->get_error_message()
            ];
        }

        // Return raw response for normalizeResponse to handle
        return $response;
    }

    /**
     * @inheritDoc
     */
    public function checkStatus(string $license_key, string $site_url): array
    {
        $response = $this->apiService->post('license/check', [
            'license' => $license_key,
            'url' => $site_url
        ], false);

        // Convert WP_Error to standard format
        if (is_wp_error($response)) {
            return [
                'error' => $response->get_error_message()
            ];
        }

        // Return raw response for normalizeResponse to handle
        return $response;
    }

    /**
     * @inheritDoc
     */
    public function normalizeResponse(array $response, string $action): array
    {
        $normalized = [
            'success' => false,
            'message' => '',
            'license_data' => [],
            'error_code' => null,
            'raw_response' => $response,
            'token' => null
        ];

        // Handle API communication errors
        if (isset($response['error'])) {
            $error_code = $response['error'];

            // Check if this is a known EDD error code
            $known_edd_errors = [
                'invalid_item_id', 'no_activations_left', 'expired', 'revoked',
                'missing', 'invalid', 'inactive', 'site_inactive', 'key_mismatch',
                'item_name_mismatch'
            ];

            if (in_array($error_code, $known_edd_errors)) {
                // Treat as EDD error and get proper user message
                $normalized['error_code'] = $error_code;
                $normalized['message'] = $this->getStatusMessage($action, $error_code, $response);
                return $normalized;
            } else {
                // Regular API error
                $normalized['message'] = $error_code;
                $normalized['error_code'] = 'api_error';
                return $normalized;
            }
        }

        // Extract EDD data from nested structure
        $edd_data = $response['data'] ?? $response; // Fallback to full response if no data field

        // Handle EDD-specific errors within the data
        if (isset($edd_data['error'])) {
            $error_code = $edd_data['error'];

            // Check if this is a known EDD error code that should be handled specially
            $known_edd_errors = [
                'invalid_item_id', 'no_activations_left', 'expired', 'revoked',
                'missing', 'invalid', 'inactive', 'site_inactive', 'key_mismatch',
                'item_name_mismatch'
            ];

            if (in_array($error_code, $known_edd_errors)) {
                // Treat as license status and get proper user message
                $normalized['error_code'] = $error_code;
                $normalized['message'] = $this->getStatusMessage($action, $error_code, $edd_data);
                // Don't set success to false, it's already false by default
                $normalized['license_data']['status'] = $error_code;
                return $normalized;
            } else {
                // Regular API communication error
                $normalized['message'] = $edd_data['error'];
                $normalized['error_code'] = 'api_error';
                return $normalized;
            }
        }

        // Also check if license field contains an error status
        if (isset($edd_data['license'])) {
            $license_status = $edd_data['license'];

            // Check if this is actually an error status
            $error_statuses = [
                'invalid_item_id', 'no_activations_left', 'expired', 'revoked',
                'missing', 'invalid', 'inactive', 'site_inactive', 'key_mismatch',
                'item_name_mismatch'
            ];

            if (in_array($license_status, $error_statuses)) {
                $normalized['error_code'] = $license_status;
                $normalized['message'] = $this->getStatusMessage($action, $license_status, $edd_data);
                $normalized['license_data']['status'] = $license_status;
                return $normalized;
            }
        }

        // Check if proxy request was successful (only after checking for EDD errors)
        if (isset($response['success']) && !$response['success'] && !isset($edd_data['license'])) {
            // If no EDD data and proxy says failure, use proxy message
            $normalized['message'] = $response['message'] ?? __('License request failed.', 'smashballoon-wpchat-livechat-customer-support');
            $normalized['error_code'] = 'proxy_error';
            return $normalized;
        }

        // Extract license status from EDD data
        $license_status = $edd_data['license'] ?? 'invalid';

        // Determine success based on action and status
        if ($action === 'deactivate') {
            $normalized['success'] = $license_status === 'deactivated';
        } else {
            $normalized['success'] = in_array($license_status, ['valid', 'active'], true);
        }

        // Build normalized license data (excluding license_key for security)
        $normalized['license_data'] = [
            'status' => $license_status,
            'expires' => $edd_data['expires'] ?? '',
            'customer_name' => $edd_data['customer_name'] ?? '',
            'customer_email' => $edd_data['customer_email'] ?? '',
            'license_limit' => $edd_data['license_limit'] ?? 0,
            'site_count' => $edd_data['site_count'] ?? 0,
            'activations_left' => $edd_data['activations_left'] ?? 0,
            'payment_id' => $edd_data['payment_id'] ?? '',
            'price_id' => $edd_data['price_id'] ?? '',
            'download_url' => $edd_data['download_url'] ?? ''
        ];

        // Set error code based on license status for failed requests
        if (!$normalized['success']) {
            $normalized['error_code'] = $license_status;
        }

        // Set appropriate messages based on action and status
        $normalized['message'] = $this->getStatusMessage($action, $license_status, $edd_data);

        // Extract tokens if present in EDD data
        if (isset($edd_data['jwt_token'])) {
            $normalized['token'] = $edd_data['jwt_token'];
        }

        // Extract embedding token (WPChat API access token)
        if (isset($edd_data['embedding_token'])) {
            $normalized['embedding_token'] = $edd_data['embedding_token'];
            $normalized['embedding_token_expires'] = $edd_data['embedding_token_expires'] ?? null;
        }

        return $normalized;
    }

    /**
     * @inheritDoc
     */
    public function getProviderName(): string
    {
        return 'wpchat_proxy';
    }


    /**
     * Get appropriate status message based on action and license status.
     *
     * @param string $action The action performed.
     * @param string $status The license status.
     * @param array $response The full response.
     * @return string The status message.
     */
    private function getStatusMessage(string $action, string $status, array $response): string
    {
        switch ($action) {
            case 'activate':
                switch ($status) {
                    case 'valid':
                    case 'active':
                        return __('License activated successfully!', 'smashballoon-wpchat-livechat-customer-support');
                    case 'expired':
                        return __('License key has expired. Please renew your license.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'invalid':
                        return __('Invalid license key.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'inactive':
                        return __('License key is not active for this site.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'site_inactive':
                        return __('License key is not active for this site.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'no_activations_left':
                        return __('License key has reached its activation limit. Please deactivate it from another site or upgrade your license.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'invalid_item_id':
                        return __('This license key is not valid for this product.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'item_name_mismatch':
                        return __('This license key is not valid for this product.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'revoked':
                        return __('This license key has been revoked and is no longer valid.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'missing':
                        return __('License key not found in our system.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'key_mismatch':
                        return __('This license key does not match the installed product.', 'smashballoon-wpchat-livechat-customer-support');
                    default:
                        return $response['error'] ?? __('License activation failed.', 'smashballoon-wpchat-livechat-customer-support');
                }

            case 'deactivate':
                if ($status === 'deactivated') {
                    return __('License deactivated successfully!', 'smashballoon-wpchat-livechat-customer-support');
                }
                return $response['error'] ?? __('License deactivation failed.', 'smashballoon-wpchat-livechat-customer-support');

            case 'check_status':
                switch ($status) {
                    case 'valid':
                    case 'active':
                        $expires = $response['expires'] ?? '';
                        if ($expires && $expires !== 'lifetime') {
                            return sprintf(
                                /* translators: %s: Expiration date */
                                __('License is active and expires on %s.', 'smashballoon-wpchat-livechat-customer-support'),
                                date_i18n(get_option('date_format'), strtotime($expires))
                            );
                        }
                        return __('License is active.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'expired':
                        return __('License has expired.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'invalid':
                        return __('License is invalid.', 'smashballoon-wpchat-livechat-customer-support');
                    case 'inactive':
                        return __('License is inactive for this site.', 'smashballoon-wpchat-livechat-customer-support');
                    default:
                        return __('License status unknown.', 'smashballoon-wpchat-livechat-customer-support');
                }

            default:
                return $response['error'] ?? __('Unknown action.', 'smashballoon-wpchat-livechat-customer-support');
        }
    }

    /**
     * Get the plugin version for User-Agent header.
     *
     * @return string Plugin version.
     */
    private function getPluginVersion(): string
    {
        if (defined('WPCHAT_VERSION')) {
            return WPCHAT_VERSION;
        }

        return '1.0.0';
    }
}
