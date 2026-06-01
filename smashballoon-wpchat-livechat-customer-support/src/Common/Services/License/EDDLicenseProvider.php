<?php

namespace SmashBalloon\WPChat\Common\Services\License;

use SmashBalloon\WPChat\Common\Contracts\LicenseProviderInterface;

/**
 * Class EDDLicenseProvider
 *
 * License provider implementation for Easy Digital Downloads (EDD) Software Licensing.
 * Handles communication with EDD licensing server.
 *
 * @package SmashBalloon\WPChat\Common\Services\License
 */
class EDDLicenseProvider implements LicenseProviderInterface
{
    /**
     * The EDD licensing server base URL.
     */
    private string $server_url;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->server_url = defined('WPCHAT_STORE_URL') ? WPCHAT_STORE_URL : 'https://wpchat.com';
    }

    /**
     * @inheritDoc
     */
    public function activate(string $license_key, string $site_url): array
    {
        return $this->makeRequest('activate_license', [
            'license' => $license_key,
            'url' => $site_url
        ]);
    }

    /**
     * @inheritDoc
     */
    public function deactivate(string $license_key, string $site_url): array
    {
        return $this->makeRequest('deactivate_license', [
            'license' => $license_key,
            'url' => $site_url
        ]);
    }

    /**
     * @inheritDoc
     */
    public function checkStatus(string $license_key, string $site_url): array
    {
        return $this->makeRequest('check_license', [
            'license' => $license_key,
            'url' => $site_url
        ]);
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
            'raw_response' => $response
        ];

        // Handle API communication errors - but check if it's actually an EDD error code first
        if (isset($response['error'])) {
            $error_code = $response['error'];
            
            // Check if this is a known EDD error code that should be handled specially
            $known_edd_errors = [
                'invalid_item_id', 'no_activations_left', 'expired', 'revoked', 
                'missing', 'invalid', 'inactive', 'site_inactive', 'key_mismatch', 
                'item_name_mismatch'
            ];
            
            if (in_array($error_code, $known_edd_errors)) {
                // Treat as license status instead of API error
                $license_status = $error_code;
                $normalized['error_code'] = $error_code;
                $normalized['message'] = $this->getStatusMessage($action, $license_status, $response);
                return $normalized;
            } else {
                // Regular API communication error
                $normalized['message'] = $response['error'];
                $normalized['error_code'] = 'api_error';
                return $normalized;
            }
        }

        // EDD returns 'license' field with status
        $license_status = $response['license'] ?? 'invalid';
        
        // Determine success based on action and status
        if ($action === 'deactivate') {
            $normalized['success'] = $license_status === 'deactivated';
        } else {
            $normalized['success'] = in_array($license_status, ['valid', 'active'], true);
        }

        // Build normalized license data (excluding license_key for security)
        $normalized['license_data'] = [
            'status' => $license_status,
            'expires' => $response['expires'] ?? '',
            'customer_name' => $response['customer_name'] ?? '',
            'customer_email' => $response['customer_email'] ?? '',
            'license_limit' => $response['license_limit'] ?? 0,
            'site_count' => $response['site_count'] ?? 0,
            'activations_left' => $response['activations_left'] ?? 0,
            'payment_id' => $response['payment_id'] ?? '',
            'price_id' => $response['price_id'] ?? '',
            'download_url' => $response['download_url'] ?? ''
        ];

        // Set error code based on license status for failed requests
        if (!$normalized['success']) {
            $normalized['error_code'] = $license_status;
        }

        // Set appropriate messages based on action and status
        $normalized['message'] = $this->getStatusMessage($action, $license_status, $response);

        return $normalized;
    }

    /**
     * @inheritDoc
     */
    public function getProviderName(): string
    {
        return 'edd';
    }

    /**
     * Make a request to the EDD licensing server.
     *
     * @param string $action The EDD action to perform.
     * @param array $body The request body parameters.
     * @return array The response from the server.
     */
    private function makeRequest(string $action, array $body): array
    {
        $body['edd_action'] = $action;

        $args = [
            'method' => 'POST',
            'timeout' => 120, // 2 minutes timeout for license operations
            'sslverify' => true,
            'redirection' => 5, // Follow up to 5 redirects
            'body' => $body,
            'headers' => [
                'User-Agent' => 'WPChat Pro/' . $this->getPluginVersion(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/x-www-form-urlencoded'
            ]
        ];

        $response = wp_remote_post($this->server_url, $args);

        if (is_wp_error($response)) {
            return [
                'error' => sprintf(
                    /* translators: %s: Error message */
                    __('License server connection failed: %s', 'smashballoon-wpchat-livechat-customer-support'),
                    $response->get_error_message()
                )
            ];
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return [
                'error' => sprintf(
                    /* translators: %d: HTTP status code */
                    __('License server returned HTTP %d error', 'smashballoon-wpchat-livechat-customer-support'),
                    $response_code
                )
            ];
        }

        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'error' => __('Invalid response from license server', 'smashballoon-wpchat-livechat-customer-support')
            ];
        }

        return $decoded;
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
        // Try to get version from plugin file
        if (defined('WPCHAT_VERSION')) {
            return WPCHAT_VERSION;
        }

        return '1.2.0';
    }
}
