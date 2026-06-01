<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\ApiService;
use SmashBalloon\WPChat\Common\Services\PrivateSettingsService;
use WP_Error;

/**
 * Class WPChatApiService
 *
 * Service for handling WPChat API operations like newsletter subscriptions,
 * user registration, ChatAI assistant, and other integrations.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class WPChatApiService implements ServiceProviderInterface
{
    /**
     * The API service instance.
     *
     * @var ApiService
     */
    private $apiService;

    /**
     * The private settings service instance.
     *
     * @var PrivateSettingsService
     */
    private $privateSettingsService;

    /**
     * Constructor for the WPChatApiService class.
     *
     * @param ApiService $apiService The API service instance.
     * @param PrivateSettingsService $privateSettingsService The private settings service instance.
     */
    public function __construct(ApiService $apiService, PrivateSettingsService $privateSettingsService)
    {
        $this->apiService = $apiService;
        $this->privateSettingsService = $privateSettingsService;
    }

    /**
     * @inheritDoc
     */
    public function register(): void
    {
        // No hooks needed for this service
    }

    /**
     * Collect email for newsletter subscription.
     *
     * @param string $email The email address to collect.
     * @param array $additionalData Additional data to send with the request.
     * @return array|WP_Error The response data or WP_Error on failure.
     */
    public function collectEmail(string $email, array $additionalData = [])
    {
        if (empty($email) || !is_email($email)) {
            return new WP_Error(
                'invalid_email',
                __('Invalid email address provided.', 'smashballoon-wpchat-livechat-customer-support'),
                ['status' => 400]
            );
        }

        // Get and validate site URL and domain
        $siteData = $this->getSiteUrlAndDomain();
        if (is_wp_error($siteData)) {
            return $siteData;
        }

        $data = array_merge([
            'email' => $email,
            'domain' => $siteData['domain'],
            'source' => 'wpchat_plugin_onboarding',
			'site_url' => $siteData['site_url']
        ], $additionalData);

        // Make the API request to collect the email
        $response = $this->apiService->post('collect-email', $data, false); // No auth required

        return $response;
    }

    /**
     * Register user's domain and email with the API.
     *
     * @param string $email The email address to register.
     * @param string|null $domain The domain to register (optional, will use site domain if not provided).
     * @param array $additionalData Additional data to send with the request.
     * @return array|WP_Error The response data or WP_Error on failure.
     */
    public function registerUser(string $email, ?string $domain = null, array $additionalData = [])
    {
        if (empty($email) || !is_email($email)) {
            return new WP_Error(
                'invalid_email',
                __('Invalid email address provided.', 'smashballoon-wpchat-livechat-customer-support'),
                ['status' => 400]
            );
        }

        // Use provided domain or get from WordPress site URL
        if (empty($domain)) {
            $siteData = $this->getSiteUrlAndDomain();
            if (is_wp_error($siteData)) {
                return $siteData;
            }
            $domain = $siteData['domain'];
            $siteUrl = $siteData['site_url'];
        } else {
            // If domain is provided, we still need the site URL
            $siteUrl = get_site_url();
        }

        if (empty($domain) || !is_string($domain)) {
            return new WP_Error(
                'invalid_domain',
                __('Failed to determine domain for registration.', 'smashballoon-wpchat-livechat-customer-support'),
                ['status' => 500]
            );
        }

        $data = array_merge([
            'action' => 'register',
            'email' => $email,
            'domain' => $domain,
            'site_url' => $siteUrl,
            'source' => 'wpchat_plugin_registration',
        ], $additionalData);

        // Make the API request to register the user
        $response = $this->apiService->post('auth/register', $data, false); // No auth required

        if (is_wp_error($response)) {
            return $response;
        }

        return $response;
    }

    /**
     * Register and collect email in one action.
     * This will call both register and collect-email endpoints.
     *
     * @param string $email The email address.
     * @param string|null $domain The domain (optional).
     * @param array $additionalData Additional data to send with both requests.
     * @return array Results with both register and collect-email responses.
     */
    public function registerAndCollectEmail(string $email, ?string $domain = null, array $additionalData = [])
    {
        $results = [
            'register' => null,
            'collect_email' => null,
            'success' => false,
        ];

        // First register the user
        $registerResult = $this->registerUser($email, $domain, $additionalData);
        $results['register'] = $registerResult;

        if (is_wp_error($registerResult)) {
            return $results;
        }

        // Then collect the email for newsletter
        $collectResult = $this->collectEmail($email, $additionalData);
        $results['collect_email'] = $collectResult;

        // Consider successful if register succeeded (email collection is secondary)
        $results['success'] = !is_wp_error($registerResult);

        // Save newsletter subscription status to private settings if successful
        if ($results['success']) {
            $this->privateSettingsService->updateSetting('newsletter_subscribed', true);
            $this->privateSettingsService->updateSetting('newsletter_email', $email);
            $this->privateSettingsService->updateSetting('newsletter_subscription_date', current_time('mysql'));
        }

        return $results;
    }

    /**
     * Get and validate the site URL and domain.
     *
     * @return array|WP_Error Array with 'site_url' and 'domain' keys on success, WP_Error on failure.
     */
    private function getSiteUrlAndDomain()
    {
        $siteUrl = get_site_url();
        $domain = wp_parse_url($siteUrl, PHP_URL_HOST);

        if ($domain === false) {
            return new WP_Error(
                'malformed_site_url',
                __('The site URL appears to be malformed.', 'smashballoon-wpchat-livechat-customer-support'),
                ['status' => 500]
            );
        }

        if (empty($domain) || !is_string($domain)) {
            return new WP_Error(
                'invalid_domain',
                __('Failed to determine site domain.', 'smashballoon-wpchat-livechat-customer-support'),
                ['status' => 500]
            );
        }

        return [
            'site_url' => $siteUrl,
            'domain' => $domain
        ];
    }
}
