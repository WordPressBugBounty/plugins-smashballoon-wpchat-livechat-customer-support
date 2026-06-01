<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * SearchServiceInterface
 *
 * Interface for FAQ search services (basic and advanced).
 * Defines the contract for search functionality across free and pro versions.
 *
 * @package SmashBalloon\WPChat\Common\Contracts
 */
interface SearchServiceInterface
{
	/**
	 * Search FAQs using the available search methods.
	 *
	 * @param string $query The search query.
	 * @param array  $options Additional search options (limit, offset, etc.).
	 * @return array Array of matching FAQs with relevance information.
	 */
	public function searchFaqs(string $query, array $options = []): array;

	/**
	 * Generate and store vector embedding for FAQ (Pro feature).
	 *
	 * @param int    $faqId The FAQ ID.
	 * @param string $question The FAQ question.
	 * @param string $answer The FAQ answer.
	 * @return bool Whether the operation was successful.
	 */
	public function generateAndStoreVector(int $faqId, string $question, string $answer): bool;

	/**
	 * Delete vector embeddings for FAQ(s) (Pro feature).
	 *
	 * @param array $faqIds Array of FAQ IDs to delete vectors for.
	 * @return bool Whether the operation was successful.
	 */
	public function deleteVectors(array $faqIds): bool;
}
