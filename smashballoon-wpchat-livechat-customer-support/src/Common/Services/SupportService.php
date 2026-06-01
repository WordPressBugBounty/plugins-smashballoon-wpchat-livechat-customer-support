<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\EntitlementProviderInterface;
use SmashBalloon\WPChat\Common\Contracts\KeyStoreInterface;

/**
 * Class SupportService
 *
 * @package WPChat\Common\Services
 */
class SupportService
{
	/**
	 * The settings service instance.
	 *
	 * @var SettingsService $settingsService The settings service instance.
	 */
	private $settingsService;

	/**
	 * The entitlement provider instance.
	 *
	 * @var EntitlementProviderInterface $entitlementProvider The entitlement provider instance.
	 */
	private $entitlementProvider;

	/**
	 * The keystore instance.
	 *
	 * @var KeyStoreInterface $keyStore The keystore instance.
	 */
	private $keyStore;

	/**
	 * Constructor for the SupportService class.
	 *
	 * @param SettingsService              $settingsService The settings service instance.
	 * @param EntitlementProviderInterface $entitlementProvider The entitlement provider instance.
	 * @param KeyStoreInterface            $keyStore The keystore instance.
	 */
	public function __construct(SettingsService $settingsService, EntitlementProviderInterface $entitlementProvider, KeyStoreInterface $keyStore)
	{
		$this->settingsService = $settingsService;
		$this->entitlementProvider = $entitlementProvider;
		$this->keyStore = $keyStore;
	}

	/**
	 * Generates a complete system information report by concatenating various sections.
	 *
	 * This function aggregates multiple pieces of system and configuration data
	 * into a single string report. It includes site/server info, active plugins,
	 * and global settings details.
	 *
	 * @return string A concatenated string containing all selected system information.
	 */
	public function getSystemInfo()
	{
		return implode('', [
			$this->getSiteAndServerInfo(),
			$this->getActivePluginsInfo(),
			$this->getGlobalSettingsInfo(),
			$this->getEntitlementInfo()
		]);
	}

	/*
	Generates a string containing a specified number of non-breaking space entities.
	 *
	 * This function is useful for generating HTML output where multiple spaces are
	 * required and should not be collapsed by the browser.
	 *
	 * @param int $times The number of &nbsp; entities to generate.
	 * @return string A string containing the repeated &nbsp; entities.
	 * @throws InvalidArgumentException If $times is negative or not an integer.
	 */
	public function get_whitespace($times)
	{
		return str_repeat('&nbsp;', $times);
	}

	/**
	 * Get site and server information for support purposes.
	 *
	 * Collects various system information including plugin version, site URLs,
	 * WordPress version, PHP version, server software, and PHP capabilities
	 * to help with troubleshooting and support.
	 *
	 * @return string Formatted HTML string containing site and server information
	 */
	public function getSiteAndServerInfo()
	{
		$whitespace = [11, 17, 17, 8, 14, 10, 6, 17, 21, 15, 18, 15];

		$lines = [
			'Plugin Version:' . $this->get_whitespace($whitespace[0]) . esc_html(WPCHAT_PLUGIN_NAME),
			'Site URL:' . $this->get_whitespace($whitespace[1]) . esc_html(site_url()),
			'Home URL:' . $this->get_whitespace($whitespace[2]) . esc_html(home_url()),
			'WordPress Version:' . $this->get_whitespace($whitespace[3]) . esc_html(get_bloginfo('version')),
			'PHP Version:' . $this->get_whitespace($whitespace[4]) . esc_html(PHP_VERSION),
			'Web Server Info:' . $this->get_whitespace($whitespace[5]) . esc_html(isset($_SERVER['SERVER_SOFTWARE']) ? sanitize_text_field(wp_unslash($_SERVER['SERVER_SOFTWARE'])) : 'Unknown'),
			'PHP allow_url_fopen:' . $this->get_whitespace($whitespace[6]) . esc_html(ini_get('allow_url_fopen') ? 'Yes' : 'No'),
			'PHP cURL:' . $this->get_whitespace($whitespace[7]) . esc_html(is_callable('curl_init') ? 'Yes' : 'No'),
			'JSON:' . $this->get_whitespace($whitespace[8]) . esc_html(function_exists('json_decode') ? 'Yes' : 'No'),
			'SSL Stream:' . $this->get_whitespace($whitespace[9]) . esc_html(in_array('https', stream_get_wrappers(), true) ? 'Yes' : 'No'),
		];

		return '## SITE/SERVER INFO: ##<br />' . implode('<br />', $lines) . '<br /><br />';
	}

	/**
	 * Get information about active plugins.
	 *
	 * Retrieves details about all installed plugins and their versions,
	 * filtering to only show active plugins.
	 *
	 * @return string Formatted HTML string containing active plugin information
	 */
	public function getActivePluginsInfo()
	{
		$plugins = get_plugins();
		$active = get_option('active_plugins');
		$output = '## ACTIVE PLUGINS: ##<br />';

		foreach ($plugins as $path => $plugin) {
			if (in_array($path, $active, true)) {
				$output .= esc_html($plugin['Name']) . ': ' . esc_html($plugin['Version']) . '<br />';
			}
		}

		return $output . '<br />';
	}

	/**
	 * Get information about global settings.
	 *
	 * Retrieves details about the license key, license status, and
	 * whether to preserve settings if the plugin is removed.
	 *
	 * @return string Formatted HTML string containing global settings information
	 */
	public function getGlobalSettingsInfo()
	{
		$settings = $this->settingsService->getAllSettings();

		$output = '## GLOBAL SETTINGS: ##<br />';

		$output .= 'License key: ' . esc_html(get_option('wpchat_license_key') ?? 'Not added') . '<br />';
		$output .= 'License status: ' . esc_html(get_option('wpchat_license_status') ?? 'Inactive') . '<br />';
		$output .= 'Preserve settings if plugin is removed: ' . (!empty($settings['preserveSettings']) ? 'Yes' : 'No') . '<br />';

		return $output;
	}

	/**
	 * Get information about entitlements and licensing.
	 *
	 * Retrieves details about the current plan, features, limits,
	 * and licensing status to help with support troubleshooting.
	 *
	 * @return string Formatted HTML string containing entitlement information
	 */
	public function getEntitlementInfo()
	{
		$output = '## ENTITLEMENT INFO: ##<br />';

		$plan = $this->entitlementProvider->getPlan();
		$entitlement = $this->entitlementProvider->getEntitlement();
		$isInGracePeriod = $this->entitlementProvider->isInGracePeriod();

		$output .= 'Current Plan: ' . esc_html($plan) . '<br />';
		$output .= 'License Status: ' . esc_html($entitlement['license_status'] ?? 'Unknown') . '<br />';
		$output .= 'In Grace Period: ' . ($isInGracePeriod ? 'Yes' : 'No') . '<br />';

		if (isset($entitlement['features']) && is_array($entitlement['features'])) {
			$enabledFeatures = array_filter($entitlement['features'], function ($value) {
				return $value === true;
			});
			$output .= 'Enabled Features: ' . (empty($enabledFeatures) ? 'None' : implode(', ', array_keys($enabledFeatures))) . '<br />';
		} else {
			$output .= 'Enabled Features: None<br />';
		}

		if (isset($entitlement['limits']) && is_array($entitlement['limits'])) {
			$output .= 'Limits:<br />';
			foreach ($entitlement['limits'] as $limitKey => $limitValue) {
				$friendlyKey = str_replace(['wpchat.limits.', '_'], ['', ' '], $limitKey);
				$friendlyKey = ucwords($friendlyKey);
				$output .= $this->get_whitespace(4) . $friendlyKey . ': ' . esc_html($limitValue) . '<br />';
			}
		}

		$output .= '<br />## KEYSTORE INFO: ##<br />';

		$allKeys = $this->keyStore->getAllKeys();
		$output .= 'Total Keys Available: ' . count($allKeys) . '<br />';
		$output .= 'Keys Need Refresh: ' . ($this->keyStore->needsRefresh() ? 'Yes' : 'No') . '<br />';

		$lastRefresh = get_option('wpchat_keys_last_refresh', 0);
		if ($lastRefresh > 0) {
			$output .= 'Last Key Refresh: ' . esc_html(gmdate('Y-m-d H:i:s', $lastRefresh)) . ' UTC<br />';
		} else {
			$output .= 'Last Key Refresh: Never<br />';
		}

		$cachedKeys = get_transient('wpchat_public_keys_cache');
		if ($cachedKeys !== false && is_array($cachedKeys)) {
			$output .= 'Cached Keys Count: ' . count($cachedKeys) . '<br />';
			$keyIds = array_keys($cachedKeys);
			if (!empty($keyIds)) {
				$output .= 'Cached Key IDs: ' . esc_html(implode(', ', $keyIds)) . '<br />';
			}
		} else {
			$output .= 'Cached Keys Count: 0<br />';
		}

		return $output . '<br />';
	}
}
