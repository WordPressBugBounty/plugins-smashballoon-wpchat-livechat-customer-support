<?php

namespace SmashBalloon\WPChat\Common\Helpers;

/**
 * Utility class for generating UTM-parameterized URLs to the marketing site.
 *
 * @since 1.0.0
 */
class UTMUrlGenerator
{
	/**
	 * Generate a URL with UTM parameters.
	 *
	 * @param string $path The path on the marketing site (e.g., '/pricing', '/features').
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @param string|null $baseUrl Custom base URL (defaults to WPCHAT_STORE_URL).
	 * @return string The full URL with UTM parameters.
	 */
	public static function generateUrl(string $path = '', array $utmParams = [], ?string $baseUrl = null): string
	{
		$baseUrl = $baseUrl ?? (defined('WPCHAT_STORE_URL') ? WPCHAT_STORE_URL : 'https://wpchat.com');
		
		// Default UTM parameters
		$defaults = self::getDefaultUtmParams();
		
		// Merge custom parameters with defaults
		$finalParams = array_merge($defaults, $utmParams);
		
		// Build the URL
		$url = rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
		
		// Add UTM parameters as query string
		if (!empty($finalParams)) {
			$queryString = http_build_query($finalParams);
			$url .= (strpos($url, '?') === false ? '?' : '&') . $queryString;
		}
		
		return $url;
	}
	
	/**
	 * Generate a pricing page URL with UTM parameters.
	 *
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @return string The pricing URL with UTM parameters.
	 */
	public static function pricingUrl(array $utmParams = []): string
	{
		$defaults = [
			'utm_campaign' => 'pricing',
			'utm_content' => 'pricing-page'
		];
		
		return self::generateUrl('/pricing', array_merge($defaults, $utmParams));
	}
	
	/**
	 * Generate a features page URL with UTM parameters.
	 *
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @return string The features URL with UTM parameters.
	 */
	public static function featuresUrl(array $utmParams = []): string
	{
		$defaults = [
			'utm_campaign' => 'features',
			'utm_content' => 'features-page'
		];
		
		return self::generateUrl('/features', array_merge($defaults, $utmParams));
	}
	
	/**
	 * Generate a support page URL with UTM parameters.
	 *
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @return string The support URL with UTM parameters.
	 */
	public static function supportUrl(array $utmParams = []): string
	{
		$defaults = [
			'utm_campaign' => 'support',
			'utm_content' => 'support-page'
		];
		
		return self::generateUrl('/support', array_merge($defaults, $utmParams));
	}
	
	/**
	 * Generate a documentation URL with UTM parameters.
	 *
	 * @param string $docPath Specific documentation path.
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @return string The documentation URL with UTM parameters.
	 */
	public static function docsUrl(string $docPath = '', array $utmParams = []): string
	{
		$defaults = [
			'utm_campaign' => 'documentation',
			'utm_content' => 'docs'
		];
		
		$path = '/docs' . ($docPath ? '/' . ltrim($docPath, '/') : '');
		
		return self::generateUrl($path, array_merge($defaults, $utmParams));
	}
	
	/**
	 * Generate an upgrade URL with UTM parameters.
	 *
	 * @param string $planType The plan type (e.g., 'pro', 'business', 'enterprise').
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @return string The upgrade URL with UTM parameters.
	 */
	public static function upgradeUrl(string $planType = 'pro', array $utmParams = []): string
	{
		$defaults = [
			'utm_campaign' => 'upgrade',
			'utm_content' => 'upgrade-' . $planType
		];
		
		return self::generateUrl('/pricing', array_merge($defaults, $utmParams));
	}
	
	/**
	 * Generate the "Powered by WPChat" branding logo URL with UTM parameters.
	 *
	 * @param array $utmParams Custom UTM parameters to override defaults.
	 * @return string The branding logo URL with UTM parameters.
	 */
	public static function brandingLogoUrl(array $utmParams = []): string
	{
		$defaults = [
			'utm_campaign' => 'wpchat-logo',
			'utm_source' => 'wpchat-plugin',
			'utm_medium' => 'wpchat-widget',
			'utm_content' => 'powered-by-wpchat'
		];
		
		return self::generateUrl('/', array_merge($defaults, $utmParams));
	}

	/**
	 * Generate a campaign-specific URL with UTM parameters.
	 *
	 * @param string $path The path on the marketing site.
	 * @param string $campaign The campaign name.
	 * @param string $content The content identifier.
	 * @param array $additionalParams Additional UTM parameters.
	 * @return string The campaign URL with UTM parameters.
	 */
	public static function campaignUrl(string $path, string $campaign, string $content = '', array $additionalParams = []): string
	{
		$params = [
			'utm_campaign' => $campaign,
			'utm_content' => $content ?: $campaign
		];

		return self::generateUrl($path, array_merge($params, $additionalParams));
	}
	
	/**
	 * Get default UTM parameters.
	 *
	 * @return array Default UTM parameters.
	 */
	private static function getDefaultUtmParams(): array
	{
		return [
			'utm_source' => 'wordpress-plugin',
			'utm_medium' => 'admin',
			'utm_campaign' => 'general'
		];
	}
	
	/**
	 * Build a URL with custom UTM parameters using a fluent interface.
	 *
	 * @param string|null $baseUrl Custom base URL (defaults to WPCHAT_STORE_URL).
	 * @return UTMUrlBuilder
	 */
	public static function builder(?string $baseUrl = null): UTMUrlBuilder
	{
		return new UTMUrlBuilder($baseUrl);
	}
}

/**
 * Fluent interface for building UTM URLs.
 *
 * @since 1.0.0
 */
class UTMUrlBuilder
{
	private string $baseUrl;
	private string $path = '';
	private array $utmParams = [];
	
	/**
	 * Constructor.
	 *
	 * @param string|null $baseUrl Custom base URL (defaults to WPCHAT_STORE_URL).
	 */
	public function __construct(?string $baseUrl = null)
	{
		$this->baseUrl = $baseUrl ?? (defined('WPCHAT_STORE_URL') ? WPCHAT_STORE_URL : 'https://wpchat.com');
		$this->utmParams = UTMUrlGenerator::getDefaultUtmParams();
	}
	
	/**
	 * Set the path.
	 *
	 * @param string $path The path on the marketing site.
	 * @return self
	 */
	public function path(string $path): self
	{
		$this->path = $path;
		return $this;
	}
	
	/**
	 * Set the UTM source.
	 *
	 * @param string $source The UTM source.
	 * @return self
	 */
	public function source(string $source): self
	{
		$this->utmParams['utm_source'] = $source;
		return $this;
	}
	
	/**
	 * Set the UTM medium.
	 *
	 * @param string $medium The UTM medium.
	 * @return self
	 */
	public function medium(string $medium): self
	{
		$this->utmParams['utm_medium'] = $medium;
		return $this;
	}
	
	/**
	 * Set the UTM campaign.
	 *
	 * @param string $campaign The UTM campaign.
	 * @return self
	 */
	public function campaign(string $campaign): self
	{
		$this->utmParams['utm_campaign'] = $campaign;
		return $this;
	}
	
	/**
	 * Set the UTM content.
	 *
	 * @param string $content The UTM content.
	 * @return self
	 */
	public function content(string $content): self
	{
		$this->utmParams['utm_content'] = $content;
		return $this;
	}
	
	/**
	 * Set the UTM term.
	 *
	 * @param string $term The UTM term.
	 * @return self
	 */
	public function term(string $term): self
	{
		$this->utmParams['utm_term'] = $term;
		return $this;
	}
	
	/**
	 * Set custom UTM parameters.
	 *
	 * @param array $params Custom UTM parameters.
	 * @return self
	 */
	public function withParams(array $params): self
	{
		$this->utmParams = array_merge($this->utmParams, $params);
		return $this;
	}
	
	/**
	 * Build the final URL.
	 *
	 * @return string The complete URL with UTM parameters.
	 */
	public function build(): string
	{
		return UTMUrlGenerator::generateUrl($this->path, $this->utmParams, $this->baseUrl);
	}
	
	/**
	 * Allow the builder to be cast to string.
	 *
	 * @return string
	 */
	public function __toString(): string
	{
		return $this->build();
	}
}