<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface FaqsRepositoryInterface
 *
 * Defines the contract for FAQ data access operations.
 * This interface focuses purely on data persistence and retrieval.
 *
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface FaqsRepositoryInterface
{
	/**
	 * Find a FAQ by ID.
	 *
	 * @param int $id The FAQ ID.
	 * @return array|null The FAQ data or null if not found.
	 */
	public function findById(int $id): ?array;

	/**
	 * Find all FAQs with pagination.
	 *
	 * @param int $page The page number.
	 * @param int $per_page Number of items per page.
	 * @return array Array of FAQs.
	 */
	public function findAll(int $page = 1, int $per_page = 5): array;

	/**
	 * Get total number of FAQs.
	 *
	 * @return int Total number of FAQs.
	 */
	public function getTotalCount(): int;

	/**
	 * Save FAQ data (create or update).
	 *
	 * @param array $data The FAQ data.
	 * @return int|false The FAQ ID on success, false on failure.
	 */
	public function save(array $data): int|false;

	/**
	 * Delete a FAQ by ID.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 */
	public function deleteById(int $id): bool;

	/**
	 * Delete multiple FAQs by their IDs.
	 *
	 * @param array $ids Array of FAQ IDs to delete.
	 * @return int Number of FAQs successfully deleted.
	 */
	public function deleteByIds(array $ids): int;

	/**
	 * Find FAQs for a specific page.
	 *
	 * @param int $pageId The page ID.
	 * @return array Array of FAQs for the page.
	 */
	public function findByPage(int $pageId): array;

	/**
	 * Clone a FAQ.
	 *
	 * @param int $id The ID of the FAQ to clone.
	 * @return int|false The ID of the cloned FAQ on success, false on failure.
	 */
	public function cloneFaq(int $id): int|false;

	/**
	 * Search FAQs based on query and options.
	 *
	 * @param string $query The search query.
	 * @param array  $options Additional search options.
	 * @return array Array of matching FAQs.
	 */
	public function searchFaqs(string $query, array $options = []): array;

	/**
	 * Get popular FAQs based on click count.
	 *
	 * @param int $limit Maximum number of FAQs to return.
	 * @return array Array of popular FAQs.
	 */
	public function getPopularFaqs(int $limit = 5): array;

	/**
	 * Track a FAQ click.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 */
	public function trackFaqClick(int $id): bool;

	/**
	 * Get FAQ analytics.
	 *
	 * @return array Analytics data.
	 */
	public function getFaqAnalytics(): array;
}
