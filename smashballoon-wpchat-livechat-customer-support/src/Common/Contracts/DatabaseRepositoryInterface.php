<?php

namespace SmashBalloon\WPChat\Common\Contracts;

interface DatabaseRepositoryInterface
{
	/**
	 * Retrieve a record by its ID.
	 *
	 * @param int $id The ID of the record.
	 * @return array|null The record data or null if not found.
	 */
	public function findById(int $id): ?array;

	/**
	 * Retrieve all records.
	 *
	 * @return array An array of all records.
	 */
	public function findAll(): array;

	/**
	 * Save a new record or update an existing one.
	 *
	 * @param array $data The data to save.
	 * @return int|false The record ID on success, false on failure.
	 */
	public function save(array $data): int|false;

	/**
	 * Delete a record by its ID.
	 *
	 * @param int $id The ID of the record to delete.
	 * @return bool True on success, false on failure.
	 */
	public function deleteById(int $id): bool;
}
