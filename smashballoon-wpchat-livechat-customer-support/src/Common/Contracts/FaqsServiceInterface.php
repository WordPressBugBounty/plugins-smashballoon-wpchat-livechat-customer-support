<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface FaqsServiceInterface
 *
 * Defines the contract for FAQs business operations.
 * This interface focuses on business logic and orchestration.
 *
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface FaqsServiceInterface
{
	/**
	 * Get paginated FAQs with metadata.
	 *
	 * @param int $page The page number.
	 * @param int $per_page Number of items per page.
	 * @return array Array containing FAQs and pagination metadata.
	 */
	public function getFaqs(int $page = 1, int $per_page = 5): array;

	/**
	 * Get a FAQ by ID with validation.
	 *
	 * @param int $id The FAQ ID.
	 * @return array|null The FAQ data or null if not found.
	 * @throws \InvalidArgumentException If the ID is invalid.
	 */
	public function getFaqById(int $id): ?array;

	/**
	 * Create a new FAQ with validation and sanitization.
	 *
	 * @param array $data The FAQ data.
	 * @return int The created FAQ ID.
	 * @throws \InvalidArgumentException If the data is invalid.
	 */
	public function createFaq(array $data): int;

	/**
	 * Update an existing FAQ with validation and sanitization.
	 *
	 * @param int   $id The FAQ ID.
	 * @param array $data The FAQ data.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist or data is invalid.
	 */
	public function updateFaq(int $id, array $data): bool;

	/**
	 * Delete a FAQ with validation.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist.
	 */
	public function deleteFaq(int $id): bool;

	/**
	 * Bulk delete FAQs with validation.
	 *
	 * @param array $ids Array of FAQ IDs to delete.
	 * @return int Number of FAQs successfully deleted.
	 * @throws \InvalidArgumentException If no valid IDs are provided.
	 */
	public function bulkDeleteFaqs(array $ids): int;

	/**
	 * Clone a FAQ with validation.
	 *
	 * @param int $id The ID of the FAQ to clone.
	 * @return int|false The ID of the cloned FAQ on success, false on failure.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist.
	 */
	public function cloneFaq(int $id): int|false;

	/**
	 * Get FAQs for a specific page with context validation.
	 *
	 * @param int $pageId The page ID.
	 * @return array Array of FAQs for the page.
	 * @throws \InvalidArgumentException If the page ID is invalid.
	 */
	public function getFaqsByPage(int $pageId): array;

	/**
	 * Search FAQs with query validation and relevance scoring.
	 *
	 * @param string $query The search query.
	 * @param array  $options Additional search options.
	 * @return array Array of matching FAQs with relevance scores.
	 * @throws \InvalidArgumentException If the query is empty.
	 */
	public function searchFaqs(string $query, array $options = []): array;

	/**
	 * Get popular FAQs based on click count and relevance.
	 *
	 * @param int $limit Maximum number of FAQs to return.
	 * @return array Array of popular FAQs with click counts.
	 * @throws \InvalidArgumentException If the limit is invalid.
	 */
	public function getPopularFaqs(int $limit = 5): array;

	/**
	 * Track a FAQ click with validation and analytics.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist.
	 */
	public function trackFaqClick(int $id): bool;

	/**
	 * Get FAQ analytics data.
	 *
	 * @return array Analytics data including click counts, popular FAQs, and usage statistics.
	 */
	public function getFaqAnalytics(): array;
}
