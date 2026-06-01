<?php

namespace SmashBalloon\WPChat\Common\Services\Database;

use SmashBalloon\WPChat\Common\Repositories\AgentsRepository;
use SmashBalloon\WPChat\Common\Contracts\AgentsServiceInterface;

/**
 * Service class for managing agents and their schedules.
 *
 * This class provides methods to interact with agent data and their associated schedules,
 * including retrieving, adding, and removing agents, as well as fetching schedules for specific agents.
 */
class AgentsService implements AgentsServiceInterface
{
	/**
	 * Repository for managing agent data.
	 *
	 * @var AgentsRepository
	 */
	protected AgentsRepository $agentsRepository;

	/**
	 * Constructor to initialize repositories.
	 *
	 * @param AgentsRepository $agentsRepository Repository for agent data.
	 */
	public function __construct(AgentsRepository $agentsRepository)
	{
		$this->agentsRepository = $agentsRepository;
	}

	/**
	 * Retrieve all agents from the repository.
	 *
	 * @return array List of all agents.
	 */
	public function getAllAgents(): array
	{
		return $this->agentsRepository->findAll();
	}

	/**
	 * Find an agent by their unique ID.
	 *
	 * @param int $id The ID of the agent.
	 * @return array|null The agent data or null if not found.
	 */
	public function findAgentById(int $id): ?array
	{
		return $this->agentsRepository->findById($id);
	}

	/**
	 * Add a new agent to the repository.
	 *
	 * @param array $agentData The data of the agent to add.
	 * @return int|false The created agent ID on success, false on failure.
	 */
	public function addAgent(array $agentData): int|false
	{
		$agentId = $this->agentsRepository->save($agentData);

		if ($agentId) {
			// Trigger generic agent changed hook.
			do_action('wpchat_agent_updated', 'added');
		}

		return $agentId;
	}

	/**
	 * Remove an agent from the repository by their ID.
	 *
	 * @param int $id The ID of the agent to remove.
	 * @return bool True if the agent was removed successfully, false otherwise.
	 */
	public function removeAgent(int $id): bool
	{
		$deleted = $this->agentsRepository->deleteById($id);

		if ($deleted) {
			// Trigger generic agent changed hook.
			do_action('wpchat_agent_updated', 'removed');
		}

		return $deleted;
	}
}
