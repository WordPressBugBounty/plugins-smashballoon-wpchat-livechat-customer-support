<?php

namespace SmashBalloon\WPChat\Common\Repositories;

use SmashBalloon\WPChat\Common\Contracts\FaqsRepositoryInterface;
use SmashBalloon\WPChat\Common\Contracts\SearchServiceInterface;
use wpdb;

/**
 * FaqsRepository
 *
 * This class is responsible for interacting with the database to perform CRUD operations on FAQs.
 *
 * @package SmashBalloon\WPChat\Common\Repositories
 */
class FaqsRepository implements FaqsRepositoryInterface
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
	protected string $tableName;

	/**
	 * The search service.
	 *
	 * @var SearchServiceInterface
	 */
	protected SearchServiceInterface $searchService;

	/**
	 * Constructor to inject database connection.
	 *
	 * @param wpdb                   $db Database connection object.
	 * @param SearchServiceInterface $searchService The search service.
	 */
	public function __construct(wpdb $db, SearchServiceInterface $searchService)
	{
		$this->db = $db;
		$this->tableName = $this->db->prefix . 'wpchat_faqs';
		$this->searchService = $searchService;
	}

	/**
	 * Process FAQ data before saving.
	 *
	 * @param array $data The FAQ data to process.
	 * @return array The processed data.
	 */
	protected function processFaqData(array $data): array
	{
		$data['updated_at'] = current_time('mysql');

		if (isset($data['page_rules']) && is_array($data['page_rules'])) {
			$data['page_rules'] = wp_json_encode($data['page_rules']);
		}

		return $data;
	}

	/**
	 * Process FAQ data after retrieval.
	 *
	 * @param array $data The FAQ data to process.
	 * @return array The processed data.
	 */
	protected function processRetrievedData(array $data): array
	{
		if (isset($data['page_rules'])) {
			$data['page_rules'] = json_decode($data['page_rules'], true) ?: [];
		}

		return $data;
	}

	/**
	 * Process multiple FAQ records after retrieval.
	 *
	 * @param array $results Array of FAQ records to process.
	 * @return array The processed records.
	 */
	protected function processRetrievedResults(array $results): array
	{
		return array_map([$this, 'processRetrievedData'], $results);
	}

	/**
	 * Retrieves a FAQ record by its ID.
	 *
	 * @param int $id The ID of the FAQ to retrieve.
	 * @return array|null An associative array containing the FAQ's data if found, or null if no record exists.
	 */
	public function findById(int $id): ?array
	{
		$query = $this->db->prepare("SELECT * FROM {$this->tableName} WHERE id = %d", $id);
		$result = $this->db->get_row($query, ARRAY_A);
		return $result ? $this->processRetrievedData($result) : null;
	}

	/**
	 * Retrieves all FAQs from the database with pagination.
	 *
	 * @param int $page The page number.
	 * @param int $per_page Number of items per page.
	 * @return array An array of FAQs for the current page.
	 */
	public function findAll(int $page = 1, int $per_page = 5): array
	{
		$offset = ($page - 1) * $per_page;
		$query = $this->db->prepare(
			"SELECT * FROM {$this->tableName} ORDER BY priority DESC LIMIT %d OFFSET %d",
			$per_page,
			$offset
		);
		$results = $this->db->get_results($query, ARRAY_A);
		return $this->processRetrievedResults($results);
	}

	/**
	 * Get total number of FAQs.
	 *
	 * @return int Total number of FAQs.
	 */
	public function getTotalCount(): int
	{
		$query = "SELECT COUNT(*) as total FROM {$this->tableName}";
		$result = $this->db->get_row($query, ARRAY_A);
		return (int) ($result['total'] ?? 0);
	}

	/**
	 * Saves FAQ data by either creating a new record or updating an existing one.
	 *
	 * @param array $data The data to be saved. If 'id' is present in the array,
	 *                    the method will update the existing record; otherwise,
	 *                    it will create a new one.
	 * @return int|false Returns the FAQ ID on success, false on failure.
	 */
	public function save(array $data): int|false
	{
		$data = $this->processFaqData($data);
		$result = isset($data['id']) ? $this->update($data) : $this->create($data);

		if ($result) {
			$faqId = $data['id'] ?? $this->db->insert_id;
			// Vector generation is handled by the search service.
			$this->searchService->generateAndStoreVector(
				(int)$faqId,
				$data['question'],
				$data['answer']
			);
			return (int)$faqId;
		}

		return false;
	}

	/**
	 * Updates an existing FAQ in the database.
	 *
	 * @param array $data An associative array containing the FAQ's data.
	 * @return bool Returns true if the update was successful, false otherwise.
	 */
	protected function update(array $data): bool
	{
		return (bool)$this->db->update(
			$this->tableName,
			[
				'question' => $data['question'],
				'answer' => $data['answer'],
				'priority' => $data['priority'],
				'page_rules' => $data['page_rules'],
				'image' => $data['image'] ?? null,
				'updated_at' => $data['updated_at']
			],
			['id' => $data['id']],
			['%s', '%s', '%d', '%s', '%s', '%s'],
			['%d']
		);
	}

	/**
	 * Creates a new FAQ record in the database.
	 *
	 * @param array $data An associative array containing the FAQ's data.
	 * @return bool True on successful insertion, false otherwise.
	 */
	protected function create(array $data): bool
	{
		$data['created_at'] = current_time('mysql');
		return (bool)$this->db->insert(
			$this->tableName,
			[
				'question' => $data['question'],
				'answer' => $data['answer'],
				'priority' => $data['priority'] ?? 0,
				'click_count' => $data['click_count'] ?? 0,
				'page_rules' => $data['page_rules'],
				'image' => $data['image'] ?? null,
				'created_at' => $data['created_at'],
				'updated_at' => $data['updated_at']
			],
			['%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s']
		);
	}

	/**
	 * Deletes a FAQ record from the database by its ID.
	 *
	 * @param int $id The ID of the FAQ to delete.
	 * @return bool True if the deletion was successful, false otherwise.
	 */
	public function deleteById(int $id): bool
	{
		$result = (bool)$this->db->delete($this->tableName, ['id' => $id], ['%d']);

		// Vector cleanup is handled by the search service.
		if ($result) {
			$this->searchService->deleteVectors([$id]);
		}

		return $result;
	}

	/**
	 * Find FAQs for a specific page.
	 *
	 * @param int $pageId The ID of the page.
	 * @return array Array of FAQs for the specified page.
	 */
	public function findByPage(int $pageId): array
	{
		$results = $this->findAll();
		return array_filter($results, function ($faq) use ($pageId) {
			return empty($faq['page_rules']) || in_array($pageId, $faq['page_rules']);
		});
	}

	/**
	 * Delete multiple FAQs by their IDs.
	 *
	 * @param array $ids Array of FAQ IDs to delete.
	 * @return int Number of FAQs successfully deleted.
	 */
	public function deleteByIds(array $ids): int
	{
		if (empty($ids)) {
			return 0;
		}

		$ids = array_map('intval', $ids);
		$id_list = implode(',', $ids);
		$query = "DELETE FROM {$this->tableName} WHERE id IN ({$id_list})";
		$deletedCount = $this->db->query($query);

		// Vector cleanup is handled by the search service.
		if ($deletedCount > 0) {
			$this->searchService->deleteVectors($ids);
		}

		return $deletedCount;
	}

	/**
	 * Clone a FAQ by its ID.
	 *
	 * @param int $id The ID of the FAQ to clone.
	 * @return int|false The ID of the cloned FAQ on success, false on failure.
	 */
	public function cloneFaq(int $id): int|false
	{
		$original = $this->findById($id);
		if (!$original) {
			return false;
		}

		unset($original['id']);
		/* translators: %s: Original FAQ question */
		$original['question'] = sprintf(__('%s (Copy)', 'smashballoon-wpchat-livechat-customer-support'), $original['question']);
		$original['click_count'] = 0;

		return $this->save($original);
	}

	/**
	 * Search FAQs using the configured search service.
	 *
	 * @param string $query The search query.
	 * @param array  $options Additional search options.
	 * @return array Array of matching FAQs with relevance information.
	 */
	public function searchFaqs(string $query, array $options = []): array
	{
		return $this->searchService->searchFaqs($query, $options);
	}

	/**
	 * Get popular FAQs based on click count.
	 *
	 * @param int $limit Maximum number of FAQs to return.
	 * @return array Array of popular FAQs.
	 */
	public function getPopularFaqs(int $limit = 5): array
	{
		$query = $this->db->prepare(
			"SELECT * FROM {$this->tableName}
			ORDER BY click_count DESC, priority DESC
			LIMIT %d",
			$limit
		);

		$results = $this->db->get_results($query, ARRAY_A);
		return $this->processRetrievedResults($results);
	}

	/**
	 * Track a FAQ click.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 */
	public function trackFaqClick(int $id): bool
	{
		return (bool)$this->db->query(
			$this->db->prepare(
				"UPDATE {$this->tableName}
				SET click_count = click_count + 1
				WHERE id = %d",
				$id
			)
		);
	}

	/**
	 * Get FAQ analytics.
	 *
	 * @return array Analytics data.
	 */
	public function getFaqAnalytics(): array
	{
		$query = "SELECT
			COUNT(*) as total_faqs,
			SUM(click_count) as total_clicks,
			AVG(click_count) as avg_clicks,
			MAX(click_count) as max_clicks
			FROM {$this->tableName}";

		$result = $this->db->get_row($query, ARRAY_A);

		return [
			'total_faqs' => (int)($result['total_faqs'] ?? 0),
			'total_clicks' => (int)($result['total_clicks'] ?? 0),
			'avg_clicks' => (float)($result['avg_clicks'] ?? 0),
			'max_clicks' => (int)($result['max_clicks'] ?? 0),
		];
	}
}
