<?php

namespace SmashBalloon\WPChat\Common\Services\Database;

use SmashBalloon\WPChat\Common\Repositories\AgentsRepository;

class AgentRoutingService
{
	/**
	 * Repository for managing agents.
	 *
	 * @var AgentsRepository
	 */
	protected AgentsRepository $agentsRepository;

	/**
	 * Request-level cache for agent data to prevent redundant queries.
	 *
	 * @var array|null
	 */
	private static ?array $agentCache = null;

	/**
	 * Constructor.
	 *
	 * @param AgentsRepository $agentsRepository    Repository for agent data.
	 */
	public function __construct(AgentsRepository $agentsRepository)
	{
		$this->agentsRepository = $agentsRepository;
	}

	/**
	 * Register WordPress hooks.
	 */
	public function register(): void
	{
		// Clear cache when agents are updated (added, removed, or modified)
		add_action('wpchat_agent_updated', [$this, 'clearAvailablePlatformsCache']);
		add_action('wpchat_agent_updated', [$this, 'clearRequestCache']);
	}

	// =========================================================================
	// PUBLIC METHODS
	// =========================================================================

	/**
	 * Check agent availability with detailed status.
	 * Primary method for checking agent availability - optimized for single database query.
	 *
	 * @param string|null $platform Optional platform to check.
	 * @return array Detailed availability status with keys:
	 *               - status: 'available'|'no_agents'|'no_platform_agents'
	 *               - has_active_agents: bool
	 *               - has_platform_agents: bool|null
	 *               - agent_id: int|null
	 */
	public function checkAgentAvailability(?string $platform = null): array
	{
		// Single database query to get all agents (using cache)
		$agents = $this->getAllAgentsCached();

		$activeAgents = [];
		$platformAgents = [];

		foreach ($agents as $agent) {
			// Check if agent is active
			if ((int)$agent['status'] === 1) {
				$activeAgents[] = $agent;

				// If platform specified, check if agent has it
				if ($platform && !empty($agent['platforms'][$platform])) {
					$platformAgents[] = $agent;
				}
			}
		}

		// Determine availability status
		if (empty($activeAgents)) {
			return [
				'status' => 'no_agents',
				'has_active_agents' => false,
				'has_platform_agents' => false,
				'agent_id' => null
			];
		}

		if ($platform) {
			if (empty($platformAgents)) {
				// Active agents exist but none have the platform
				return [
					'status' => 'no_platform_agents',
					'has_active_agents' => true,
					'has_platform_agents' => false,
					'agent_id' => null,
					'any_agent_id' => (int)$activeAgents[0]['id'] // For comparison
				];
			}

			// Platform agent available
			return [
				'status' => 'available',
				'has_active_agents' => true,
				'has_platform_agents' => true,
				'agent_id' => (int)$platformAgents[0]['id']
			];
		}

		// No platform specified, return first active agent
		return [
			'status' => 'available',
			'has_active_agents' => true,
			'has_platform_agents' => null,
			'agent_id' => (int)$activeAgents[0]['id']
		];
	}

	/**
	 * Get agent details by ID
	 *
	 * @param int $agentId The agent ID.
	 * @return array|null Agent data or null if not found.
	 */
	public function getAgentById(int $agentId): ?array
	{
		return $this->agentsRepository->findById($agentId);
	}

	/**
	 * Get platforms that have at least one available agent.
	 * Results are cached for performance.
	 *
	 * @return array List of available platform slugs.
	 */
	public function getAvailablePlatforms(): array
	{
		$cacheKey = 'wpchat_available_platforms';

		// Try to get from cache first
		$cached = get_transient($cacheKey);
		if ($cached !== false) {
			return $cached;
		}

		// In free version, check the single agent's platforms (using cache)
		$agents = $this->getAllAgentsCached();

		if (empty($agents)) {
			// Cache empty result for 5 minutes
			set_transient($cacheKey, [], 5 * MINUTE_IN_SECONDS);
			return [];
		}

		$availablePlatforms = [];

		// Check which platforms are configured on active agents
		foreach ($agents as $agent) {
			if ($agent['status'] == 1 && !empty($agent['platforms'])) {
				foreach ($agent['platforms'] as $platform => $value) {
					if (!empty($value) && !in_array($platform, $availablePlatforms)) {
						$availablePlatforms[] = $platform;
					}
				}
			}
		}

		// Cache for 1 hour
		set_transient($cacheKey, $availablePlatforms, HOUR_IN_SECONDS);

		return $availablePlatforms;
	}

	/**
	 * Clear the available platforms cache.
	 * Should be called when agents or settings are updated.
	 */
	public function clearAvailablePlatformsCache(): void
	{
		delete_transient('wpchat_available_platforms');
	}

	/**
	 * Clear the request-level agent cache.
	 * Should be called when agents are updated.
	 */
	public function clearRequestCache(): void
	{
		self::$agentCache = null;
	}

	// =========================================================================
	// PROTECTED METHODS
	// =========================================================================

	/**
	 * Get all agents with request-level caching.
	 * Prevents multiple database queries for the same data within a single request.
	 *
	 * @return array All agents from cache or database.
	 */
	protected function getAllAgentsCached(): array
	{
		if (self::$agentCache === null) {
			self::$agentCache = $this->agentsRepository->findAll();
		}
		return self::$agentCache;
	}
}