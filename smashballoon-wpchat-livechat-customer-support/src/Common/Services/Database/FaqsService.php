<?php

namespace SmashBalloon\WPChat\Common\Services\Database;

use SmashBalloon\WPChat\Common\Contracts\FaqsRepositoryInterface;
use SmashBalloon\WPChat\Common\Contracts\FaqsServiceInterface;

/**
 * Class FaqsService
 *
 * Handles business logic for FAQs.
 *
 * @package SmashBalloon\WPChat\Common\Services\Database
 */
class FaqsService implements FaqsServiceInterface
{
	/**
	 * The FAQs repository.
	 *
	 * @var FaqsRepositoryInterface
	 */
	private FaqsRepositoryInterface $repository;

	/**
	 * Constructor.
	 *
	 * @param FaqsRepositoryInterface $repository The FAQs repository.
	 */
	public function __construct(FaqsRepositoryInterface $repository)
	{
		$this->repository = $repository;
	}

	/**
	 * Get all FAQs with pagination.
	 *
	 * @param int $page The page number.
	 * @param int $per_page Number of items per page.
	 * @return array Array of FAQs with pagination metadata.
	 */
	public function getFaqs(int $page = 1, int $per_page = 5): array
	{
		$faqs = $this->repository->findAll($page, $per_page);
		$total = $this->repository->getTotalCount();
		$total_pages = ceil($total / $per_page);

		return [
			'faqs' => $faqs,
			'current_page' => $page,
			'total_pages' => $total_pages,
			'total_faqs' => $total
		];
	}

	/**
	 * Get a FAQ by ID.
	 *
	 * @param int $id The FAQ ID.
	 * @return array|null The FAQ data or null if not found.
	 */
	public function getFaqById(int $id): ?array
	{
		return $this->repository->findById($id);
	}

	/**
	 * Create a new FAQ.
	 *
	 * @param array $data The FAQ data.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the data is invalid.
	 */
	public function createFaq(array $data): int
	{
		$this->validateFaqData($data);
		$data = $this->sanitizeFaqData($data);
		$faqId = $this->repository->save($data);
		if (!$faqId) {
			throw new \RuntimeException('Failed to create FAQ');
		}
		return $faqId;
	}

	/**
	 * Update an existing FAQ.
	 *
	 * @param int   $id The FAQ ID.
	 * @param array $data The FAQ data.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the data is invalid.
	 */
	public function updateFaq(int $id, array $data): bool
	{
		if (!$this->repository->findById($id)) {
			throw new \InvalidArgumentException(esc_html(__('FAQ not found.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		$this->validateFaqData($data);
		$data = $this->sanitizeFaqData($data);
		$data['id'] = $id;
		return $this->repository->save($data);
	}

	/**
	 * Delete a FAQ.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist.
	 */
	public function deleteFaq(int $id): bool
	{
		if (!$this->repository->findById($id)) {
			throw new \InvalidArgumentException(esc_html(__('FAQ not found.', 'smashballoon-wpchat-livechat-customer-support')));
		}
		return $this->repository->deleteById($id);
	}

	/**
	 * Bulk delete FAQs.
	 *
	 * @param array $ids Array of FAQ IDs to delete.
	 * @return int Number of FAQs successfully deleted.
	 * @throws \InvalidArgumentException If no valid IDs are provided.
	 */
	public function bulkDeleteFaqs(array $ids): int
	{
		if (empty($ids)) {
			throw new \InvalidArgumentException(esc_html(__('No FAQ IDs provided.', 'smashballoon-wpchat-livechat-customer-support')));
		}
		return $this->repository->deleteByIds($ids);
	}

	/**
	 * Clone a FAQ.
	 *
	 * @param int $id The ID of the FAQ to clone.
	 * @return int|false The ID of the cloned FAQ on success, false on failure.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist.
	 */
	public function cloneFaq(int $id): int|false
	{
		if (!$this->repository->findById($id)) {
			throw new \InvalidArgumentException(esc_html(__('FAQ not found.', 'smashballoon-wpchat-livechat-customer-support')));
		}
		return $this->repository->cloneFaq($id);
	}

	/**
	 * Get FAQs for a specific page.
	 *
	 * @param int $pageId The page ID.
	 * @return array Array of FAQs for the page.
	 */
	public function getFaqsByPage(int $pageId): array
	{
		return $this->repository->findByPage($pageId);
	}

	/**
	 * Search FAQs based on query and options.
	 *
	 * @param string $query The search query.
	 * @param array  $options Additional search options.
	 * @return array Array of matching FAQs.
	 * @throws \InvalidArgumentException If the query is empty.
	 */
	public function searchFaqs(string $query, array $options = []): array
	{
		if (empty(trim($query))) {
			throw new \InvalidArgumentException(esc_html(__('Search query cannot be empty.', 'smashballoon-wpchat-livechat-customer-support')));
		}
		return $this->repository->searchFaqs($query, $options);
	}

	/**
	 * Get popular FAQs based on click count.
	 *
	 * @param int $limit Maximum number of FAQs to return.
	 * @return array Array of popular FAQs.
	 * @throws \InvalidArgumentException If the limit is invalid.
	 */
	public function getPopularFaqs(int $limit = 5): array
	{
		if ($limit < 1) {
			throw new \InvalidArgumentException(esc_html(__('Limit must be greater than 0.', 'smashballoon-wpchat-livechat-customer-support')));
		}
		$faqs = $this->repository->getPopularFaqs($limit);
		$total = $this->repository->getTotalCount();
		$total_pages = ceil($total / $limit);

		return [
			'faqs' => $faqs,
			'total_faqs' => $total,
			'total_pages' => $total_pages
		];
	}

	/**
	 * Track a FAQ click.
	 *
	 * @param int $id The FAQ ID.
	 * @return bool Whether the operation was successful.
	 * @throws \InvalidArgumentException If the FAQ doesn't exist.
	 */
	public function trackFaqClick(int $id): bool
	{
		if (!$this->repository->findById($id)) {
			throw new \InvalidArgumentException(esc_html(__('FAQ not found.', 'smashballoon-wpchat-livechat-customer-support')));
		}
		return $this->repository->trackFaqClick($id);
	}

	/**
	 * Get FAQ analytics.
	 *
	 * @return array Analytics data.
	 */
	public function getFaqAnalytics(): array
	{
		return $this->repository->getFaqAnalytics();
	}

	/**
	 * Validate FAQ data.
	 *
	 * @param array $data The FAQ data.
	 * @throws \InvalidArgumentException If the data is invalid.
	 */
	private function validateFaqData(array $data): void
	{
		if (empty($data['question'])) {
			throw new \InvalidArgumentException(esc_html(__('Question is required.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		if (empty($data['answer'])) {
			throw new \InvalidArgumentException(esc_html(__('Answer is required.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		if (isset($data['priority']) && !is_numeric($data['priority'])) {
			throw new \InvalidArgumentException(esc_html(__('Priority must be a number.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		if (isset($data['page_rules']) && !is_array($data['page_rules'])) {
			throw new \InvalidArgumentException(esc_html(__('Page rules must be an array.', 'smashballoon-wpchat-livechat-customer-support')));
		}

		if (isset($data['image']) && !empty($data['image']) && !filter_var($data['image'], FILTER_VALIDATE_URL)) {
			throw new \InvalidArgumentException(esc_html(__('Image must be a valid URL.', 'smashballoon-wpchat-livechat-customer-support')));
		}
	}

	/**
	 * Sanitize FAQ data.
	 *
	 * @param array $data The FAQ data.
	 * @return array The sanitized data.
	 */
	private function sanitizeFaqData(array $data): array
	{
		$page_rules = [];
		if (!empty($data['page_rules']) && is_array($data['page_rules'])) {
			foreach ($data['page_rules'] as $page_id) {
				$page_rules[] = (int)$page_id;
			}
		}

		return [
			'question' => sanitize_text_field($data['question'] ?? ''),
			'answer' => wp_kses_post($data['answer'] ?? ''),
			'priority' => (int)($data['priority'] ?? 0),
			'click_count' => (int)($data['click_count'] ?? 0),
			'page_rules' => $page_rules,
			'image' => esc_url_raw($data['image'] ?? ''),
		];
	}
}
