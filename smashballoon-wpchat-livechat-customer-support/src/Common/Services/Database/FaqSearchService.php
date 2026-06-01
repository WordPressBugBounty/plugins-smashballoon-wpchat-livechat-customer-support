<?php

namespace SmashBalloon\WPChat\Common\Services\Database;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\SearchServiceInterface;
use SmashBalloon\WPChat\Common\Services\VectorEmbeddingService;
use SmashBalloon\WPChat\Common\Services\SettingsService;
use Exception;
use wpdb;

/**
 * FaqSearchService
 *
 * Provides search functionality including vector/semantic search alongside FULLTEXT and LIKE fallback capabilities.
 * Vector search is available when VectorEmbeddingService is provided.
 *
 * @package SmashBalloon\WPChat\Common\Services\Database
 */
class FaqSearchService implements SearchServiceInterface
{
	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	protected wpdb $db;

	/**
	 * The FAQs table name.
	 *
	 * @var string
	 */
	protected string $tableName;

	/**
	 * The vector embedding service (optional).
	 *
	 * @var VectorEmbeddingService|null
	 */
	protected ?VectorEmbeddingService $vectorService;

	/**
	 * The settings service.
	 *
	 * @var SettingsService
	 */
	protected SettingsService $settingsService;

	/**
	 * Constructor.
	 *
	 * @param wpdb $db The WordPress database object.
	 * @param SettingsService $settingsService The settings service.
	 * @param VectorEmbeddingService|null $vectorService The vector embedding service (optional).
	 */
	public function __construct(wpdb $db, SettingsService $settingsService, ?VectorEmbeddingService $vectorService = null)
	{
		$this->db = $db;
		$this->tableName = $db->prefix . 'wpchat_faqs';
		$this->settingsService = $settingsService;
		$this->vectorService = $vectorService;
	}

	/**
	 * Search FAQs using advanced search methods (vector, FULLTEXT, and LIKE).
	 *
	 * @param string $query The search query.
	 * @param array  $options Additional search options.
	 * @return array Array of matching FAQs with relevance information.
	 */
	public function searchFaqs(string $query, array $options = []): array
	{
		$query = trim($query);
		if (empty($query)) {
			return [];
		}

		$minResultsForVectorOnly = 3;
		$vectorSimilarityThreshold = 0.4;

		// Check if smart search is enabled
		$settings = $this->settingsService->getAllSettings();
		$smartSearchEnabled = $settings['smartSearchEnabled'] ?? true;

		// Try vector search first if available and enabled
		if ($this->vectorService && $smartSearchEnabled) {
			try {
				$vectorResults = $this->vectorService->searchByVector($query, $options['limit'] ?? 10);

				if (!empty($vectorResults)) {
					$results = $this->findByIdsWithRelevance($vectorResults);

					// Add relevance metadata
					foreach ($results as &$result) {
						$result['relevance'] = [
							'score' => $result['relevance_score'] ?? 0,
							'type' => 'vector'
						];
						unset($result['relevance_score']);
					}

					// If we have enough high-quality results, return them
					if (count($results) >= $minResultsForVectorOnly) {
						$highQualityResults = array_filter($results, function ($result) use ($vectorSimilarityThreshold) {
							return $result['relevance']['score'] >= $vectorSimilarityThreshold;
						});

						if (count($highQualityResults) >= $minResultsForVectorOnly) {
							return $highQualityResults;
						}
					}

					return $results;
				}
			} catch (Exception $e) {
				Logger::error('Vector search failed: ' . $e->getMessage());
			}
		}

		// Fallback to FULLTEXT search
		try {
			$results = $this->searchWithFulltext($query, $options);

			if (!empty($results)) {
				// Add relevance metadata
				foreach ($results as &$result) {
					$result['relevance'] = [
						'score' => $result['relevance_score'] ?? 0,
						'type' => 'fulltext'
					];
					unset($result['relevance_score']);
				}

				return $results;
			}
		} catch (Exception $e) {
			Logger::error('FULLTEXT search failed: ' . $e->getMessage());
		}

		// Fallback to LIKE search
		try {
			$results = $this->searchWithLike($query, $options);

			// Add relevance metadata
			foreach ($results as &$result) {
				$result['relevance'] = [
					'score' => 0.1, // Low score for LIKE matches
					'type' => 'fallback'
				];
			}

			return $results;
		} catch (Exception $e) {
			Logger::error('Fallback search failed: ' . $e->getMessage());
			return [];
		}
	}

	/**
	 * Generate and store vector embedding for FAQ.
	 *
	 * @param int    $faqId The FAQ ID.
	 * @param string $question The FAQ question.
	 * @param string $answer The FAQ answer.
	 * @return bool Whether the operation was successful.
	 */
	public function generateAndStoreVector(int $faqId, string $question, string $answer): bool
	{
		if (!$this->vectorService) {
			return true; // No vector service available, return true to indicate no error
		}

		// Check if smart search is enabled
		$settings = $this->settingsService->getAllSettings();
		$smartSearchEnabled = $settings['smartSearchEnabled'] ?? true;

		if (!$smartSearchEnabled) {
			return true; // Smart search disabled, skip vector generation
		}

		try {
			$text = trim($question) . ' ' . trim($answer);
			$vector = $this->vectorService->generateEmbedding($text);
			return $this->vectorService->storeVector($faqId, $vector);
		} catch (Exception $e) {
			Logger::error('Failed to generate vector embedding: ' . $e->getMessage());
			return false;
		}
	}

	/**
	 * Find FAQs by their IDs with preserved order.
	 *
	 * @param array $faqIds Array of FAQ IDs with scores.
	 * @return array Array of FAQs with relevance scores.
	 */
	protected function findByIdsWithRelevance(array $faqIds): array
	{
		if (empty($faqIds)) {
			return [];
		}

		$idList = implode(',', array_keys($faqIds));
		$query = "SELECT * FROM {$this->tableName} WHERE id IN ({$idList})";
		$results = $this->db->get_results($query, ARRAY_A);

		if (empty($results)) {
			return [];
		}

		// Add relevance scores
		foreach ($results as &$result) {
			$faqId = (int)$result['id'];
			$result['relevance_score'] = $faqIds[$faqId] ?? 0;
		}

		// Sort results by relevance score in descending order
		usort($results, function ($a, $b) {
			return $b['relevance_score'] <=> $a['relevance_score'];
		});

		return $results;
	}

	/**
	 * Perform FULLTEXT search on FAQ content.
	 *
	 * @param string $query The search query.
	 * @param array  $options Search options (limit, offset).
	 * @return array Array of matching FAQs with relevance scores.
	 */
	protected function searchWithFulltext(string $query, array $options = []): array
	{
		$limit = $options['limit'] ?? 5;
		$offset = $options['offset'] ?? 0;

		$searchQuery = $this->db->prepare(
			"SELECT *,
            MATCH(question, answer) AGAINST(%s IN NATURAL LANGUAGE MODE) as relevance_score
            FROM {$this->tableName}
            WHERE MATCH(question, answer) AGAINST(%s IN NATURAL LANGUAGE MODE) > 0
            ORDER BY relevance_score DESC, priority DESC, click_count DESC
            LIMIT %d OFFSET %d",
			$query,
			$query,
			$limit,
			$offset
		);

		$results = $this->db->get_results($searchQuery, ARRAY_A);
		return $results ?: [];
	}

	/**
	 * Perform basic LIKE search as fallback.
	 *
	 * @param string $query The search query.
	 * @param array  $options Search options (limit, offset).
	 * @return array Array of matching FAQs.
	 */
	protected function searchWithLike(string $query, array $options = []): array
	{
		$limit = $options['limit'] ?? 5;
		$offset = $options['offset'] ?? 0;
		$searchTerm = '%' . $this->db->esc_like($query) . '%';

		$fallbackQuery = $this->db->prepare(
			"SELECT * FROM {$this->tableName}
            WHERE question LIKE %s OR answer LIKE %s
            ORDER BY priority DESC, click_count DESC
            LIMIT %d OFFSET %d",
			$searchTerm,
			$searchTerm,
			$limit,
			$offset
		);

		$results = $this->db->get_results($fallbackQuery, ARRAY_A);
		return $results ?: [];
	}

	/**
	 * Delete vector embeddings for FAQ(s).
	 *
	 * @param array $faqIds Array of FAQ IDs to delete vectors for.
	 * @return bool Whether the operation was successful.
	 */
	public function deleteVectors(array $faqIds): bool
	{
		if (!$this->vectorService) {
			return true; // No vector service available, return true to indicate no error
		}

		try {
			return $this->vectorService->deleteVectors($faqIds);
		} catch (Exception $e) {
			Logger::error('Failed to delete vector embeddings: ' . $e->getMessage());
			return false;
		}
	}
}
