<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface AgentsServiceInterface
 *
 * Provides a contract for managing agents in the system.
 */
interface AgentsServiceInterface
{
	/**
	 * Retrieve all agents.
	 *
	 * @return array An array of agents.
	 */
	public function getAllAgents(): array;

	/**
	 * Find an agent by their unique identifier.
	 *
	 * @param int $id The unique identifier of the agent.
	 * @return array|null The agent data if found, or null if not found.
	 */
	public function findAgentById(int $id): ?array;

	/**
	 * Add a new agent to the system.
	 *
	 * @param array $agentData An associative array containing the agent's data.
	 * @return int|false The created agent ID on success, false on failure.
	 */
	public function addAgent(array $agentData): int|false;

	/**
	 * Remove an agent from the system by their unique identifier.
	 *
	 * @param int $id The unique identifier of the agent to be removed.
	 * @return bool True if the agent was successfully removed, false otherwise.
	 */
	public function removeAgent(int $id): bool;
}
