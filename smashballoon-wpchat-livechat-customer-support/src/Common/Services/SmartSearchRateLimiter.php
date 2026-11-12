<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Helpers\Logger;

/**
 * Caps how many FAQ searches by visitors can spend the site's WPChat API tokens (SMASH-2676).
 *
 * `faqs/search` is public, and each smart search sends the query to the WPChat API on the site's
 * token. Limits apply per visitor (by IP: searches a minute, searches a day, and estimated tokens a
 * day) and to the whole site (estimated tokens a day). Over any of them, the search still runs,
 * using the local keyword search only, so the visitor gets results and the site's token quota is
 * not spent. See docs/agdr/AgDR-0002.
 *
 * Each counter is read, checked and written back in separate steps, so parallel requests can get
 * past the limits. AgDR-0002 records this, and SMASH-2682 tracks reserving each cost atomically.
 */
class SmartSearchRateLimiter
{
	/**
	 * Prefix of the counter transients.
	 */
	public const TRANSIENT_PREFIX = 'wpchat_ss_rl_';

	/**
	 * Prefix of the site-wide daily budget transient; the UTC date (Ymd) is appended.
	 */
	public const SITE_BUDGET_PREFIX = 'wpchat_ss_site_';

	/**
	 * Lowest daily site budget, in estimated tokens; also used when the token limit is unknown.
	 */
	public const MIN_DAILY_TOKEN_BUDGET = 1000;

	/**
	 * Share of the token limit that visitors may spend per day, in percent.
	 */
	public const DAILY_BUDGET_PERCENT = 5;

	/**
	 * Share of the daily site budget that one visitor may spend per day, in percent. With searches
	 * made one at a time, it takes at least 100 / this many IPs to use up a day's budget.
	 */
	public const VISITOR_BUDGET_PERCENT = 10;

	/**
	 * Lowest daily token budget for one visitor, in estimated tokens.
	 */
	public const MIN_VISITOR_DAILY_TOKENS = 100;

	/**
	 * Key of the visitor's daily token spend in their counter transient. A window of the same name
	 * in `wpchat_smart_search_rate_limits` would not be enforced (SMASH-2682).
	 */
	private const VISITOR_TOKENS_KEY = '_tokens';

	/**
	 * Default limits per visitor. Filter: `wpchat_smart_search_rate_limits`.
	 *
	 * @var array<string, array{limit: int, window: int}>
	 */
	public const DEFAULT_LIMITS = array(
		'minute' => array('limit' => 10, 'window' => 60),
		'day' => array('limit' => 50, 'window' => 86400),
	);

	/**
	 * Cloudflare's published edge ranges, fetched 2026-11-06 from https://www.cloudflare.com/ips-v4
	 * and https://www.cloudflare.com/ips-v6. Same list as the WPChat API's rate limiter.
	 *
	 * @var string[]
	 */
	private const CLOUDFLARE_RANGES = array(
		'173.245.48.0/20',
		'103.21.244.0/22',
		'103.22.200.0/22',
		'103.31.4.0/22',
		'141.101.64.0/18',
		'108.162.192.0/18',
		'190.93.240.0/20',
		'188.114.96.0/20',
		'197.234.240.0/22',
		'198.41.128.0/17',
		'162.158.0.0/15',
		'104.16.0.0/13',
		'104.24.0.0/14',
		'172.64.0.0/13',
		'131.0.72.0/22',
		'2400:cb00::/32',
		'2606:4700::/32',
		'2803:f800::/32',
		'2405:b500::/32',
		'2405:8100::/32',
		'2a06:98c0::/29',
		'2c0f:f248::/32',
	);

	/**
	 * Private settings, for the site's token limit. Null in unit tests that do not need it.
	 *
	 * @var PrivateSettingsService|null
	 */
	private ?PrivateSettingsService $privateSettings;

	/**
	 * Constructor.
	 *
	 * @param PrivateSettingsService|null $privateSettings Private settings (token limit).
	 */
	public function __construct(?PrivateSettingsService $privateSettings = null)
	{
		$this->privateSettings = $privateSettings;
	}

	/**
	 * Records one token-spending search for the current visitor.
	 *
	 * @param string $query The text that will be sent to the API.
	 * @return bool True when the search may use the WPChat API, false when a limit is reached.
	 */
	public function attempt(string $query = ''): bool
	{
		// Admins searching from wp-admin are not limited.
		if (current_user_can('manage_options') || current_user_can('wpchat_admin')) {
			return true;
		}

		$now = time();
		$clientKey = self::TRANSIENT_PREFIX . $this->clientKey($this->clientIp());
		$stored = get_transient($clientKey);
		$stored = is_array($stored) ? $stored : array();
		$windows = $this->clientWindows($stored, $now);
		if (null === $windows) {
			return false;
		}

		$cost = $this->estimateTokens($query);
		$visitorSpend = $this->visitorSpend($stored, $now);
		$visitorBudget = $this->visitorDailyTokenBudget();
		if ($visitorBudget >= 0 && $visitorSpend['spent'] + $cost > $visitorBudget) {
			return false;
		}

		$siteKey = self::SITE_BUDGET_PREFIX . gmdate('Ymd', $now);
		if (!$this->siteBudgetAllows($siteKey, $cost)) {
			return false;
		}

		$expires = $visitorSpend['expires'];
		foreach ($windows as $name => $counter) {
			$windows[$name]['count'] = (int) $counter['count'] + 1;
			$expires = max($expires, (int) $counter['expires']);
		}
		$visitorSpend['spent'] += $cost;
		$windows[self::VISITOR_TOKENS_KEY] = $visitorSpend;
		set_transient($clientKey, $windows, max(1, $expires - $now));

		$site = $this->siteSpend($siteKey);
		$site['spent'] = (int) $site['spent'] + $cost;
		set_transient($siteKey, $site, 2 * DAY_IN_SECONDS);

		return true;
	}

	/**
	 * The visitor's current windows (one transient holds them all), or null when one is full.
	 *
	 * @param array $stored The visitor's counter transient.
	 * @param int   $now    Current Unix time.
	 * @return array<string, array{count: int, expires: int}>|null
	 */
	private function clientWindows(array $stored, int $now): ?array
	{
		$windows = array();

		foreach ($this->limits() as $name => $rule) {
			$counter = isset($stored[$name]) && is_array($stored[$name]) ? $stored[$name] : array();
			if (!isset($counter['count'], $counter['expires']) || (int) $counter['expires'] <= $now) {
				$counter = array('count' => 0, 'expires' => $now + $rule['window']);
			}

			if ((int) $counter['count'] >= $rule['limit']) {
				return null;
			}

			$windows[$name] = $counter;
		}

		return $windows;
	}

	/**
	 * The visitor's estimated token spend in the current UTC day. It ends at 00:00 UTC with the site's
	 * budget, so a visitor can't straddle midnight for two shares of one day's budget.
	 *
	 * @param array $stored The visitor's counter transient.
	 * @param int   $now    Current Unix time.
	 * @return array{spent: int, expires: int}
	 */
	private function visitorSpend(array $stored, int $now): array
	{
		$spend = isset($stored[self::VISITOR_TOKENS_KEY]) && is_array($stored[self::VISITOR_TOKENS_KEY])
			? $stored[self::VISITOR_TOKENS_KEY]
			: array();

		if (!isset($spend['spent'], $spend['expires']) || (int) $spend['expires'] <= $now) {
			return array('spent' => 0, 'expires' => (intdiv($now, DAY_IN_SECONDS) + 1) * DAY_IN_SECONDS);
		}

		return array('spent' => (int) $spend['spent'], 'expires' => (int) $spend['expires']);
	}

	/**
	 * Whether today's site-wide visitor spend leaves room for this search. Logs once a day when not.
	 *
	 * @param string $siteKey Transient name for today's spend.
	 * @param int    $cost    Estimated tokens for this search.
	 * @return bool
	 */
	private function siteBudgetAllows(string $siteKey, int $cost): bool
	{
		$budget = $this->dailyTokenBudget();
		$site = $this->siteSpend($siteKey);

		if ($budget < 0 || (int) $site['spent'] + $cost <= $budget) {
			return true;
		}

		if (empty($site['logged'])) {
			Logger::warning(
				'Smart Search daily visitor budget reached; visitor searches use keyword search until 00:00 UTC.'
			);
			$site['logged'] = true;
			set_transient($siteKey, $site, 2 * DAY_IN_SECONDS);
		}

		return false;
	}

	/**
	 * Today's site-wide visitor spend.
	 *
	 * @param string $siteKey Transient name for today's spend.
	 * @return array{spent: int, logged: bool}
	 */
	private function siteSpend(string $siteKey): array
	{
		$site = get_transient($siteKey);

		return is_array($site) && isset($site['spent'])
			? array('spent' => (int) $site['spent'], 'logged' => !empty($site['logged']))
			: array('spent' => 0, 'logged' => false);
	}

	/**
	 * Estimated API tokens for a query: one per 3 bytes of UTF-8, at least one.
	 *
	 * Over-counts English text (about 4 characters a token) and is close for CJK text (about one
	 * 3-byte character a token).
	 *
	 * @param string $query The text that will be sent to the API.
	 * @return int
	 */
	public function estimateTokens(string $query): int
	{
		$text = mb_substr($query, 0, VectorEmbeddingService::SEARCH_QUERY_MAX_CHARS);

		return max(1, (int) ceil(strlen($text) / 3));
	}

	/**
	 * Daily site budget in estimated tokens; -1 means no site budget.
	 *
	 * Default: DAILY_BUDGET_PERCENT of the token limit the API last reported, at least
	 * MIN_DAILY_TOKEN_BUDGET; none when the API reports an unlimited tier (-1).
	 *
	 * @return int
	 */
	public function dailyTokenBudget(): int
	{
		$limit = $this->privateSettings ? (int) $this->privateSettings->getSetting('token_limit', 0) : 0;

		if ($limit < 0) {
			$default = -1;
		} else {
			$default = max(self::MIN_DAILY_TOKEN_BUDGET, intdiv($limit * self::DAILY_BUDGET_PERCENT, 100));
		}

		/**
		 * Filters the daily budget, in estimated tokens, that visitor searches may spend site-wide.
		 *
		 * Return -1 for no site budget, or 0 to keep visitor searches on keyword search.
		 *
		 * @param int $default Budget derived from the site's token limit.
		 * @param int $limit   Token limit the WPChat API last reported (-1 unlimited, 0 unknown).
		 */
		$budget = apply_filters('wpchat_smart_search_daily_token_budget', $default, $limit);

		return is_numeric($budget) ? max(-1, (int) $budget) : $default;
	}

	/**
	 * Daily token budget for one visitor in estimated tokens; -1 means none.
	 *
	 * Default: VISITOR_BUDGET_PERCENT of the site budget, at least MIN_VISITOR_DAILY_TOKENS; none
	 * when the site has no budget.
	 *
	 * @return int
	 */
	public function visitorDailyTokenBudget(): int
	{
		$site = $this->dailyTokenBudget();
		$default = $site < 0
			? -1
			: max(self::MIN_VISITOR_DAILY_TOKENS, intdiv($site * self::VISITOR_BUDGET_PERCENT, 100));

		/**
		 * Filters the daily budget, in estimated tokens, that one visitor's searches may spend.
		 *
		 * Return -1 for no per-visitor token budget.
		 *
		 * @param int $default Budget derived from the site budget.
		 * @param int $site    The site's daily budget (-1 for none).
		 */
		$budget = apply_filters('wpchat_smart_search_visitor_daily_token_budget', $default, $site);

		return is_numeric($budget) ? max(-1, (int) $budget) : $default;
	}

	/**
	 * The visitor's IP: CF-Connecting-IP when the connection comes from Cloudflare, else REMOTE_ADDR.
	 *
	 * The header is ignored from any other peer, where the caller controls it.
	 *
	 * @return string A valid IP address, or '' when none is known.
	 */
	public function clientIp(): string
	{
		$remote = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
		if (false === filter_var($remote, FILTER_VALIDATE_IP)) {
			$remote = '';
		}

		$ip = $remote;

		if ('' !== $remote && isset($_SERVER['HTTP_CF_CONNECTING_IP']) && $this->isCloudflare($remote)) {
			$header = trim(sanitize_text_field(wp_unslash($_SERVER['HTTP_CF_CONNECTING_IP'])));
			if (false !== filter_var($header, FILTER_VALIDATE_IP)) {
				$ip = $header;
			}
		}

		/**
		 * Filters the visitor IP used for the smart search limits.
		 *
		 * Sites behind a proxy other than Cloudflare can return the real visitor IP here. Without
		 * it, visitors behind one proxy share one limit and fall back to keyword search sooner.
		 *
		 * @param string $ip The detected IP address, or '' when none is known.
		 */
		$ip = (string) apply_filters('wpchat_smart_search_client_ip', $ip);

		return false === filter_var($ip, FILTER_VALIDATE_IP) ? '' : $ip;
	}

	/**
	 * Counter key for an IP. An IPv6 client is keyed by its /64, which one host can rotate within.
	 *
	 * @param string $ip A valid IP address, or ''.
	 * @return string
	 */
	public function clientKey(string $ip): string
	{
		if ('' === $ip) {
			return 'unknown';
		}

		$binary = inet_pton($ip);
		if (false === $binary) {
			return 'unknown';
		}

		if (16 === strlen($binary)) {
			$binary = (substr($binary, 0, 12) === str_repeat("\0", 10) . "\xff\xff")
				? substr($binary, 12) // IPv4-mapped address: key by the IPv4 address.
				: substr($binary, 0, 8);
		}

		return md5($binary);
	}

	/**
	 * Limits after the `wpchat_smart_search_rate_limits` filter, with invalid entries dropped.
	 *
	 * @return array<string, array{limit: int, window: int}>
	 */
	private function limits(): array
	{
		/**
		 * Filters the per-visitor limits on searches that use the WPChat API.
		 *
		 * @param array<string, array{limit: int, window: int}> $limits Window name => max searches
		 *                                                               and window length in seconds.
		 */
		$limits = apply_filters('wpchat_smart_search_rate_limits', self::DEFAULT_LIMITS);
		if (!is_array($limits)) {
			return self::DEFAULT_LIMITS;
		}

		$valid = array();
		foreach ($limits as $name => $rule) {
			$invalid = !is_array($rule) || !isset($rule['limit'], $rule['window'])
				|| (int) $rule['window'] < 1 || (int) $rule['limit'] < 0;
			if ($invalid) {
				continue;
			}
			$valid[sanitize_key((string) $name)] = array(
				'limit' => (int) $rule['limit'],
				'window' => (int) $rule['window'],
			);
		}

		return $valid;
	}

	/**
	 * Whether an IP is in Cloudflare's edge ranges.
	 *
	 * @param string $ip A valid IP address.
	 * @return bool
	 */
	private function isCloudflare(string $ip): bool
	{
		foreach (self::CLOUDFLARE_RANGES as $range) {
			if ($this->inRange($ip, $range)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether an IP is inside a CIDR range of the same family.
	 *
	 * @param string $ip   A valid IP address.
	 * @param string $cidr A range such as 192.0.2.0/24.
	 * @return bool
	 */
	private function inRange(string $ip, string $cidr): bool
	{
		list($subnet, $bits) = explode('/', $cidr, 2);
		$ipBinary = inet_pton($ip);
		$subnetBinary = inet_pton($subnet);

		if (false === $ipBinary || false === $subnetBinary || strlen($ipBinary) !== strlen($subnetBinary)) {
			return false;
		}

		$bits = (int) $bits;
		$bytes = intdiv($bits, 8);
		$remainder = $bits % 8;

		if (substr($ipBinary, 0, $bytes) !== substr($subnetBinary, 0, $bytes)) {
			return false;
		}

		if (0 === $remainder) {
			return true;
		}

		$mask = (0xFF << (8 - $remainder)) & 0xFF;

		return (ord($ipBinary[$bytes]) & $mask) === (ord($subnetBinary[$bytes]) & $mask);
	}
}
