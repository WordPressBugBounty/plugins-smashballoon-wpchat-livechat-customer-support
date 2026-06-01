<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use WP_Error;

/**
 * Class ApiService
 *
 * Service for communicating with the WPChat API.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class ApiService implements ServiceProviderInterface
{
	/**
	 * The private settings service instance.
	 *
	 * @var PrivateSettingsService
	 */
	private $privateSettingsService;

	/**
	 * The API base URL.
	 *
	 * @var string
	 */
	private $apiUrl;

	/**
	 * Constructor for the ApiService class.
	 *
	 * @param PrivateSettingsService $privateSettingsService The private settings service instance.
	 */
	public function __construct(PrivateSettingsService $privateSettingsService)
	{
		$this->privateSettingsService = $privateSettingsService;
		$this->apiUrl = WPCHAT_API_URL;
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void
	{
	}

	/**
	 * Make a GET request to the API.
	 *
	 * @param string $endpoint The API endpoint (relative to base URL).
	 * @param array  $params Query parameters for the request.
	 * @param bool   $requires_auth Whether authentication is required.
	 *
	 * @return array|WP_Error The response data or WP_Error on failure.
	 */
	public function get(string $endpoint, array $params = [], bool $requires_auth = false)
	{
		$url = $this->buildUrl($endpoint, $params);
		$args = $this->buildRequestArgs('GET', $requires_auth);

		$response = wp_remote_get($url, $args);

		return $this->handleResponse($response);
	}

	/**
	 * Make a POST request to the API.
	 *
	 * @param string $endpoint The API endpoint (relative to base URL).
	 * @param array  $data The data to send in the request body.
	 * @param bool   $requires_auth Whether authentication is required.
	 *
	 * @return array|WP_Error The response data or WP_Error on failure.
	 */
	public function post(string $endpoint, array $data = [], bool $requires_auth = false)
	{
		$url = $this->buildUrl($endpoint);
		$args = $this->buildRequestArgs('POST', $requires_auth);
		$args['body'] = wp_json_encode($data);

		$response = wp_remote_post($url, $args);

		return $this->handleResponse($response);
	}

	/**
	 * Build the full URL for the API request.
	 *
	 * @param string $endpoint The API endpoint.
	 * @param array  $params Query parameters.
	 *
	 * @return string The full URL.
	 */
	private function buildUrl(string $endpoint, array $params = []): string
	{
		$url = trailingslashit($this->apiUrl) . ltrim($endpoint, '/');

		if (!empty($params)) {
			$url = add_query_arg($params, $url);
		}

		return $url;
	}

	/**
	 * Build the request arguments.
	 *
	 * @param string $method The HTTP method.
	 * @param bool   $requires_auth Whether authentication is required.
	 *
	 * @return array The request arguments.
	 */
	private function buildRequestArgs(string $method, bool $requires_auth): array
	{
		$args = [
			'method' => $method,
			'headers' => [
				'Content-Type' => 'application/json',
				'Accept' => 'application/json',
			],
			'timeout' => 120, // 2 minutes timeout for license operations
			'redirection' => 5, // Follow up to 5 redirects
			'sslverify' => true,
		];

		if ($requires_auth) {
			$authHeader = $this->getAuthorizationHeader();
			if ($authHeader) {
				$args['headers']['Authorization'] = $authHeader;
			}
		}

		return $args;
	}

	/**
	 * Get the authorization header.
	 *
	 * @return string|null The authorization header or null if no token.
	 */
	private function getAuthorizationHeader(): ?string
	{
		$apiToken = $this->privateSettingsService->getSetting('api_token');

		if (!empty($apiToken)) {
			return 'Bearer ' . $apiToken;
		}

		return null;
	}

	/**
	 * Handle the API response.
	 *
	 * @param array|WP_Error $response The raw response from wp_remote_*.
	 *
	 * @return array|WP_Error The parsed response data or WP_Error.
	 */
	private function handleResponse($response)
	{
		if (is_wp_error($response)) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code($response);
		$response_body = wp_remote_retrieve_body($response);

		if ($response_code >= 400) {
			$error_message = sprintf(
				'API request failed with status code %d',
				$response_code
			);

			// Try to parse error message from response body
			if (!empty($response_body)) {
				$decoded = json_decode($response_body, true);
				if (isset($decoded['message'])) {
					$error_message = $decoded['message'];
				} elseif (isset($decoded['error'])) {
					$error_message = $decoded['error'];
				}
			}

			return new WP_Error(
				'api_error',
				'[WPC-NET-002] ' . $error_message,
				['status_code' => $response_code]
			);
		}

		// Parse JSON response
		if (!empty($response_body)) {
			$data = json_decode($response_body, true);

			if (json_last_error() !== JSON_ERROR_NONE) {
				return new WP_Error(
					'json_parse_error',
					__('[WPC-NET-002] Failed to parse API response', 'smashballoon-wpchat-livechat-customer-support'),
					['raw_response' => $response_body]
				);
			}

			return $data;
		}

		return [];
	}
}
