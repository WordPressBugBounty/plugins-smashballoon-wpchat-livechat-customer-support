<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\ApiService;
use SmashBalloon\WPChat\Common\Services\PrivateSettingsService;
use Exception;

/**
 * Class SmartSearchManagerService
 *
 * Service for managing Smart Search functionality including token offers,
 * API communications, and subscription management.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class SmartSearchManagerService implements ServiceProviderInterface
{
	/**
	 * The API service instance.
	 *
	 * @var ApiService
	 */
	private ApiService $apiService;

	/**
	 * The private settings service instance.
	 *
	 * @var PrivateSettingsService
	 */
	private PrivateSettingsService $privateSettingsService;

	/**
	 * Constructor for the SmartSearchManagerService class.
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
		// No initialization needed for now
	}

	/**
	 * Handle the claim offer process.
	 * This includes calling both collect-email and auth/register endpoints,
	 * and saving the subscription data locally.
	 *
	 * @param string $email The user's email address.
	 * @return array Result array with success status and message.
	 * @throws Exception If API calls fail.
	 */
	public function claimOffer(string $email): array
	{
		// Get the domain from WordPress site URL
		$domain = wp_parse_url(get_site_url(), PHP_URL_HOST);

		if (empty($domain) || !is_string($domain)) {
			throw new Exception('Failed to determine site domain.');
		}

		// Call collect-email endpoint
		try {
			$collectEmailResponse = $this->apiService->post('collect-email', [
				'email' => $email,
				'domain' => $domain
			], true); // requires authentication

			if (is_wp_error($collectEmailResponse)) {
				throw new Exception('Failed to submit email to collect-email endpoint: ' . $collectEmailResponse->get_error_message());
			}
		} catch (Exception $e) {
			throw new Exception('collect-email API call failed: ' . esc_html($e->getMessage()));
		}

		// Call auth/register endpoint
		try {
			$authRegisterResponse = $this->apiService->post('auth/register', [
				'email' => $email,
				'domain' => $domain
			], true); // requires authentication

			if (is_wp_error($authRegisterResponse)) {
				throw new Exception('Failed to register with auth/register endpoint: ' . $authRegisterResponse->get_error_message());
			}
		} catch (Exception $e) {
			throw new Exception('auth/register API call failed: ' . esc_html($e->getMessage()));
		}

		// Save newsletter subscription data locally
		$newsletterData = [
			'newsletter_email' => $email,
			'newsletter_subscribed' => true,
			'newsletter_subscription_date' => current_time('mysql'),
		];

		if (!$this->privateSettingsService->updateSettings($newsletterData)) {
			throw new Exception('Failed to save subscription data locally.');
		}

		return [
			'success' => true,
			'message' => 'Successfully claimed offer. Please check your email for verification.',
			'collect_email_response' => $collectEmailResponse,
			'auth_register_response' => $authRegisterResponse,
		];
	}

	/**
	 * Check if the user has an active claim offer within the last 24 hours.
	 *
	 * @return bool True if user claimed offer within 24 hours, false otherwise.
	 */
	public function hasRecentClaimOffer(): bool
	{
		$subscriptionDate = $this->privateSettingsService->getSetting('newsletter_subscription_date', '');
		$isSubscribed = $this->privateSettingsService->getSetting('newsletter_subscribed', false);

		if (!$subscriptionDate || !$isSubscribed) {
			return false;
		}

		$subscriptionTime = new \DateTime($subscriptionDate);
		$now = new \DateTime();
		$hoursDiff = ($now->getTimestamp() - $subscriptionTime->getTimestamp()) / 3600;

		return $hoursDiff < 24;
	}

	/**
	 * Get the email address from the last claim offer.
	 *
	 * @return string The email address or empty string if none found.
	 */
	public function getClaimOfferEmail(): string
	{
		return $this->privateSettingsService->getSetting('newsletter_email', '');
	}
}