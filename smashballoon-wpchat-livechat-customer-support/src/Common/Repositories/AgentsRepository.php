<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\DatabaseRepositoryInterface;
use wpdb;

/**
 * AgentsRepository
 *
 * This class is responsible for interacting with the database to perform CRUD operations on agents.
 * It implements the DatabaseRepositoryInterface.
 *
 * @package SmashBalloon\WPChat\Common\Repositories
 */
class AgentsRepository implements DatabaseRepositoryInterface
{
	/**
	 * The WordPress database object used for database operations.
	 *
	 * @var wpdb $db Database connection object.
	 */
	protected wpdb $db;

	/**
	 * The name of the database table associated with this repository.
	 *
	 * @var string $tableName The name of the table.
	 */
	protected $tableName;

	/**
	 * Constructor to inject database connection.
	 *
	 * @param wpdb $db The WordPress database object.
	 */
	public function __construct(wpdb $db)
	{
		$this->db = $db;
		$this->tableName = $this->db->prefix . 'wpchat_agents';
	}

	/**
	 * Retrieves an agent record by its ID.
	 *
	 * @param int $id The ID of the agent to retrieve.
	 * @return array|null An associative array containing the agent's data if found, or null if no record exists.
	 */
	public function findById(int $id): ?array
	{
		$query = $this->db->prepare("SELECT * FROM {$this->tableName} WHERE id = %d", $id);
		$result = $this->db->get_row($query, ARRAY_A);

		if ($result && isset($result['platforms'])) {
			$result['platforms'] = json_decode($result['platforms'], true) ?: [];
		}

		return $result;
	}

	/**
	 * Retrieves all agents from the database.
	 *
	 * @return array An array of associative arrays, where each associative array represents an agent.
	 */
	public function findAll(): array
	{
		$query = "SELECT * FROM {$this->tableName}";
		$results = $this->db->get_results($query, ARRAY_A);

		foreach ($results as &$result) {
			if (isset($result['platforms'])) {
				$result['platforms'] = json_decode($result['platforms'], true) ?: [];
			}
		}

		return $results;
	}

	/**
	 * Saves agent data by either creating a new record or updating an existing one.
	 *
	 * @param array $data The data to be saved. If 'id' is present in the array,
	 *                    the method will update the existing record; otherwise,
	 *                    it will create a new one.
	 * @return int|false Returns the agent ID on success, false on failure.
	 */
	public function save(array $data): int|false
	{
		if (isset($data['id'])) {
			$result = $this->update($data);
			return $result ? (int)$data['id'] : false; // Return agent ID on success
		} else {
			$result = $this->create($data);
			return $result ? (int)$this->db->insert_id : false; // Return new agent ID on success
		}
	}

	/**
	 * Updates an existing agent in the database.
	 *
	 * @param array $data An associative array containing the agent's data.
	 *
	 * @return bool Returns true if the update was successful, false otherwise.
	 */
	public function update(array $data): bool
	{
		$data['updated_at'] = current_time('mysql');

		$platforms = isset($data['platforms']) ? $data['platforms'] : [];
		if (is_array($platforms)) {
			$platforms = wp_json_encode($platforms);
		}

		return (bool)$this->db->update(
			$this->tableName,
			[
				'name' => $data['name'],
				'platforms' => $platforms,
				'avatar' => $data['avatar'],
				'status' => $data['status'],
				'updated_at' => $data['updated_at']
			],
			['id' => $data['id']],
			['%s', '%s', '%s', '%d', '%s'],
			['%d']
		);
	}

	/**
	 * Creates a new agent record in the database.
	 *
	 * @param array $data An associative array containing the agent's data.
	 * @return bool True on successful insertion, false otherwise.
	 */
	public function create(array $data): bool
	{
		$data['created_at'] = current_time('mysql');
		$data['updated_at'] = current_time('mysql');

		$platforms = isset($data['platforms']) ? $data['platforms'] : [];
		if (is_array($platforms)) {
			$platforms = wp_json_encode($platforms);
		}

		return (bool)$this->db->insert(
			$this->tableName,
			[
				'name' => $data['name'],
				'platforms' => $platforms,
				'avatar' => $data['avatar'],
				'status' => $data['status'],
				'created_at' => $data['created_at'],
				'updated_at' => $data['updated_at']
			],
			['%s', '%s', '%s', '%d', '%s', '%s']
		);
	}

	/**
	 * Deletes an agent record from the database by its ID.
	 *
	 * @param int $id The ID of the agent to delete.
	 * @return bool True if the deletion was successful, false otherwise.
	 */
	public function deleteById(int $id): bool
	{
		return (bool)$this->db->delete($this->tableName, ['id' => $id], ['%d']);
	}

	/**
	 * Get the ID of the last inserted record.
	 *
	 * @return int The ID of the last inserted record.
	 */
	public function getLastInsertId(): int
	{
		return (int) $this->db->insert_id;
	}
}
