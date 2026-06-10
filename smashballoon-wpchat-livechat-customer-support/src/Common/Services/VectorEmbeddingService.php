<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SQLite3;
use Exception;
use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\ApiService;
use SmashBalloon\WPChat\Common\Services\PrivateSettingsService;
use SmashBalloon\WPChat\Common\Helpers\Logger;

class VectorEmbeddingService implements ServiceProviderInterface
{
	private ?SQLite3 $db = null;
	private string $vectorFilePath;
	private ApiService $apiService;
	private PrivateSettingsService $privateSettingsService;

	public function __construct(
		ApiService $apiService,
		PrivateSettingsService $privateSettingsService
	) {
		$this->apiService = $apiService;
		$this->privateSettingsService = $privateSettingsService;
		$this->vectorFilePath = WP_CONTENT_DIR . "/wpchat-faq-vectors.json";
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void
	{
		add_action("init", [$this, "init"]);
		add_action("wpchat_vector_generation_cron", [
			$this,
			"generateMissingVectors",
		]);
		add_action("wpchat_embedding_usage_stats_cron", [
			$this,
			"updateEmbeddingUsageStats",
		]);
		add_action(
			"update_option_wpchat_private_settings",
			[$this, "maybeScheduleVectorGeneration"],
			10,
			3
		);
		add_action("wpchat_api_token_updated", [$this, "onApiTokenUpdated"]);
		add_action("wpchat_plugin_deactivated", [
			$this,
			"unscheduleVectorGeneration",
		]);
	}

	/**
	 * Init sql lite
	 */
	public function init(): void
	{
		// Try to initialize SQLite if available
		if (class_exists("SQLite3")) {
			try {
				$this->db = new SQLite3(
					WP_CONTENT_DIR . "/wpchat-faq-vectors.db"
				);
				$this->initializeSQLiteTable();
			} catch (Exception $e) {
				Logger::error(
					"Failed to initialize SQLite: " . $e->getMessage()
				);
				$this->db = null;
			}
		}

		// Initialize vector file if using flat file storage
		if (!$this->db && !file_exists($this->vectorFilePath)) {
			$this->initializeVectorFile();
		}

		// Schedule recurring vector generation if we have an API token
		$apiToken = $this->privateSettingsService->getSetting("api_token");
		if (!empty($apiToken)) {
			$this->scheduleRecurringVectorGeneration();
			$this->scheduleUsageStatsUpdate();
		}
	}

	/**
	 * Initialize the vector storage file
	 */
	private function initializeVectorFile(): void
	{
		$initialData = [
			"vectors" => [],
			"metadata" => [
				"created_at" => current_time("mysql"),
				"updated_at" => current_time("mysql"),
				"storage_type" => "flat_file",
			],
		];

		file_put_contents(
			$this->vectorFilePath,
			json_encode($initialData, JSON_PRETTY_PRINT)
		);
	}

	/**
	 * Initialize the SQLite table for vector storage
	 */
	private function initializeSQLiteTable(): void
	{
		if (!$this->db) {
			return;
		}

		// Create the faq_vectors table if it doesn't exist
		$sql = "CREATE TABLE IF NOT EXISTS faq_vectors (
			faq_id INTEGER PRIMARY KEY,
			vector TEXT NOT NULL,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)";

		$this->db->exec($sql);
	}

	/**
	 * Generate vector embedding for FAQ text
	 */
	public function generateEmbedding(string $text): array
	{
		// Get the domain from WordPress site URL
		$domain = wp_parse_url(get_site_url(), PHP_URL_HOST);

		if (empty($domain) || !is_string($domain)) {
			throw new Exception(
				"Failed to generate embedding: Invalid site URL, could not determine domain."
			);
		}

		$response = $this->apiService->post(
			"embeddings",
			[
				"text" => [$text],
				"domain" => $domain,
			],
			true
		); // requires authentication

		if (is_wp_error($response)) {
			throw new Exception(
				"Failed to generate embedding: " .
					esc_html($response->get_error_message())
			);
		}

		if (!isset($response["success"]) || !$response["success"]) {
			throw new Exception(
				"Failed to generate embedding: API returned error"
			);
		}

		if (
			!isset($response["embeddings"][0]) ||
			!is_array($response["embeddings"][0])
		) {
			throw new Exception("Invalid response from embeddings API");
		}

		// Update token usage if provided in response
		if (isset($response["usage"])) {
			$this->updateTokenUsage($response["usage"]);
		}

		return $response["embeddings"][0];
	}

	/**
	 * Generate vector embeddings for multiple texts
	 */
	public function generateEmbeddings(array $texts): array
	{
		// Get the domain from WordPress site URL
		$domain = wp_parse_url(get_site_url(), PHP_URL_HOST);

		$response = $this->apiService->post(
			"embeddings",
			[
				"text" => $texts,
				"domain" => $domain,
			],
			true
		); // requires authentication

		if (is_wp_error($response)) {
			throw new Exception(
				"Failed to generate embeddings: " .
					esc_html($response->get_error_message())
			);
		}

		if (!isset($response["success"]) || !$response["success"]) {
			throw new Exception(
				"Failed to generate embeddings: API returned error"
			);
		}

		if (
			!isset($response["embeddings"]) ||
			!is_array($response["embeddings"])
		) {
			throw new Exception("Invalid response from embeddings API");
		}

		// Update token usage if provided in response
		if (isset($response["usage"])) {
			$this->updateTokenUsage($response["usage"]);
		}

		return $response["embeddings"];
	}

	/**
	 * Update token usage information from API response
	 */
	private function updateTokenUsage(array $usage): void
	{
		if (isset($usage["token_limit"])) {
			$this->privateSettingsService->updateSetting(
				"token_limit",
				(int) $usage["token_limit"]
			);
		}

		if (isset($usage["used_tokens"])) {
			$this->privateSettingsService->updateSetting(
				"used_tokens",
				(int) $usage["used_tokens"]
			);
		}
	}

	/**
	 * Fetch embedding usage stats from the API
	 *
	 * @return array|bool The usage stats array or false on failure
	 */
	public function fetchEmbeddingUsageStats()
	{
		try {
			// Get the domain from WordPress site URL
			$domain = wp_parse_url(get_site_url(), PHP_URL_HOST);

			if (empty($domain) || !is_string($domain)) {
				Logger::error(
					"VectorEmbedding: Failed to determine domain for fetching usage stats"
				);
				return false;
			}

			// Make GET request to the embeddings endpoint with domain parameter (requires auth)
			$response = $this->apiService->get(
				"embeddings",
				["domain" => $domain],
				true
			);

			if (is_wp_error($response)) {
				Logger::error(
					"VectorEmbedding: Failed to fetch usage stats - " .
						$response->get_error_message()
				);
				return false;
			}

			// Store the usage stats
			if (isset($response["usage"]) || isset($response["stats"])) {
				$stats = isset($response["usage"])
					? $response["usage"]
					: $response["stats"];

				// Update individual stat fields
				if (isset($stats["token_limit"])) {
					$this->privateSettingsService->updateSetting(
						"token_limit",
						(int) $stats["token_limit"]
					);
				}

				if (isset($stats["used_tokens"])) {
					$this->privateSettingsService->updateSetting(
						"used_tokens",
						(int) $stats["used_tokens"]
					);
				}

				// Store complete stats object
				$this->privateSettingsService->updateSetting(
					"embedding_usage_stats",
					$stats
				);
				$this->privateSettingsService->updateSetting(
					"embedding_stats_last_updated",
					current_time("timestamp")
				);

				return $stats;
			}

			return $response;
		} catch (Exception $e) {
			Logger::error(
				"VectorEmbedding: Exception fetching usage stats - " .
					$e->getMessage()
			);
			return false;
		}
	}

	/**
	 * Store vector for a FAQ
	 */
	public function storeVector(int $faqId, array $vector): bool
	{
		if ($this->db) {
			return $this->storeVectorSQLite($faqId, $vector);
		}
		return $this->storeVectorFile($faqId, $vector);
	}

	private function storeVectorSQLite(int $faqId, array $vector): bool
	{
		$stmt = $this->db->prepare('
            INSERT OR REPLACE INTO faq_vectors (faq_id, vector, updated_at)
            VALUES (:faq_id, :vector, CURRENT_TIMESTAMP)
        ');

		$stmt->bindValue(":faq_id", $faqId, SQLITE3_INTEGER);
		$stmt->bindValue(":vector", json_encode($vector), SQLITE3_TEXT);

		return $stmt->execute() !== false;
	}

	private function storeVectorFile(int $faqId, array $vector): bool
	{
		try {
			$data = json_decode(file_get_contents($this->vectorFilePath), true);
			if (!is_array($data)) {
				$this->initializeVectorFile();
				$data = json_decode(
					file_get_contents($this->vectorFilePath),
					true
				);
			}

			$data["vectors"][$faqId] = [
				"vector" => $vector,
				"updated_at" => current_time("mysql"),
			];
			$data["metadata"]["updated_at"] = current_time("mysql");

			return file_put_contents(
				$this->vectorFilePath,
				json_encode($data, JSON_PRETTY_PRINT)
			) !== false;
		} catch (Exception $e) {
			Logger::error(
				"Failed to store vector in file: " . $e->getMessage()
			);
			return false;
		}
	}

	/**
	 * Get vector for a FAQ
	 */
	public function getVector(int $faqId): ?array
	{
		if ($this->db) {
			return $this->getVectorSQLite($faqId);
		}
		return $this->getVectorFile($faqId);
	}

	private function getVectorSQLite(int $faqId): ?array
	{
		$stmt = $this->db->prepare(
			"SELECT vector FROM faq_vectors WHERE faq_id = :faq_id"
		);
		$stmt->bindValue(":faq_id", $faqId, SQLITE3_INTEGER);
		$result = $stmt->execute();

		if ($row = $result->fetchArray(SQLITE3_ASSOC)) {
			return json_decode($row["vector"], true);
		}

		return null;
	}

	private function getVectorFile(int $faqId): ?array
	{
		try {
			$data = json_decode(file_get_contents($this->vectorFilePath), true);
			return $data["vectors"][$faqId]["vector"] ?? null;
		} catch (Exception $e) {
			Logger::error(
				"Failed to get vector from file: " . $e->getMessage()
			);
			return null;
		}
	}

	/**
	 * Calculate cosine similarity between two vectors
	 */
	public function cosineSimilarity(array $vec1, array $vec2): float
	{
		if (count($vec1) !== count($vec2)) {
			throw new Exception("Vectors must have the same dimension");
		}

		$dotProduct = 0;
		$norm1 = 0;
		$norm2 = 0;

		for ($i = 0; $i < count($vec1); $i++) {
			$dotProduct += $vec1[$i] * $vec2[$i];
			$norm1 += $vec1[$i] * $vec1[$i];
			$norm2 += $vec2[$i] * $vec2[$i];
		}

		if ($norm1 == 0 || $norm2 == 0) {
			return 0.0;
		}

		$magnitude = sqrt($norm1) * sqrt($norm2);
		if ($magnitude == 0) {
			return 0.0;
		}

		return $dotProduct / $magnitude;
	}

	/**
	 * Calculate euclidean similarity between two vectors
	 */
	public function euclideanSimilarity(array $vec1, array $vec2): float
	{
		if (count($vec1) !== count($vec2)) {
			throw new Exception("Vectors must have the same dimension");
		}

		$distance = 0;
		for ($i = 0; $i < count($vec1); $i++) {
			$distance += pow($vec1[$i] - $vec2[$i], 2);
		}
		$distance = sqrt($distance);

		// Convert to similarity (0-1 range)
		return 1 / (1 + $distance);
	}

	/**
	 * Calculate hybrid similarity combining cosine and euclidean measures
	 */
	public function hybridSimilarity(array $vec1, array $vec2): float
	{
		$cosine = $this->cosineSimilarity($vec1, $vec2);
		$euclidean = $this->euclideanSimilarity($vec1, $vec2);

		// Weighted combination: 70% cosine + 30% euclidean
		return 0.7 * $cosine + 0.3 * $euclidean;
	}

	/**
	 * Search FAQs using vector similarity
	 */
	public function searchByVector(string $query, int $limit = 5): array
	{
		try {
			$queryVector = $this->generateEmbedding($query);

			// Get similar vectors with their scores
			$similarities = $this->db
				? $this->searchByVectorSQLite($queryVector, $limit)
				: $this->searchByVectorFile($queryVector, $limit);

			return $similarities;
		} catch (Exception $e) {
			Logger::error("Vector search failed: " . $e->getMessage());
			return [];
		}
	}

	private function searchByVectorSQLite(array $queryVector, int $limit): array
	{
		$stmt = $this->db->prepare("SELECT faq_id, vector FROM faq_vectors");
		$result = $stmt->execute();

		$similarities = [];
		while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
			$faqVector = json_decode($row["vector"], true);
			$similarity = $this->hybridSimilarity($queryVector, $faqVector);
			$similarities[$row["faq_id"]] = $similarity;
		}
		arsort($similarities);
		return array_slice($similarities, 0, $limit, true);
	}

	private function searchByVectorFile(array $queryVector, int $limit): array
	{
		try {
			$data = json_decode(file_get_contents($this->vectorFilePath), true);
			if (!is_array($data) || !isset($data["vectors"])) {
				return [];
			}

			$similarities = [];
			foreach ($data["vectors"] as $faqId => $vectorData) {
				$similarity = $this->hybridSimilarity(
					$queryVector,
					$vectorData["vector"]
				);
				$similarities[$faqId] = $similarity;
			}

			arsort($similarities);
			return array_slice($similarities, 0, $limit, true);
		} catch (Exception $e) {
			Logger::error(
				"Failed to search vectors in file: " . $e->getMessage()
			);
			return [];
		}
	}

	/**
	 * Delete vector for a FAQ
	 */
	public function deleteVector(int $faqId): bool
	{
		return $this->deleteVectors([$faqId]);
	}

	/**
	 * Delete multiple vectors for FAQs
	 */
	public function deleteVectors(array $faqIds): bool
	{
		if (empty($faqIds)) {
			return true;
		}

		if ($this->db) {
			return $this->deleteVectorsSQLite($faqIds);
		}
		return $this->deleteVectorsFile($faqIds);
	}

	private function deleteVectorsSQLite(array $faqIds): bool
	{
		$placeholders = implode(",", array_fill(0, count($faqIds), "?"));
		$stmt = $this->db->prepare(
			"DELETE FROM faq_vectors WHERE faq_id IN (" . $placeholders . ")",
		);

		foreach ($faqIds as $index => $faqId) {
			$stmt->bindValue($index + 1, $faqId, SQLITE3_INTEGER);
		}

		return $stmt->execute() !== false;
	}

	private function deleteVectorsFile(array $faqIds): bool
	{
		try {
			$data = json_decode(file_get_contents($this->vectorFilePath), true);
			if (!is_array($data) || !isset($data["vectors"])) {
				return true; // Nothing to delete
			}

			$deleted = false;
			foreach ($faqIds as $faqId) {
				if (isset($data["vectors"][$faqId])) {
					unset($data["vectors"][$faqId]);
					$deleted = true;
				}
			}

			if ($deleted) {
				$data["metadata"]["updated_at"] = current_time("mysql");
				return file_put_contents(
					$this->vectorFilePath,
					json_encode($data, JSON_PRETTY_PRINT)
				) !== false;
			}

			return true; // No vectors to delete
		} catch (Exception $e) {
			Logger::error(
				"Failed to delete vectors from file: " . $e->getMessage()
			);
			return false;
		}
	}

	/**
	 * Clean up all vector data (used during plugin uninstall)
	 */
	public function cleanupAllVectorData(): bool
	{
		$success = true;

		// Clean up SQLite database if it exists
		if ($this->db) {
			try {
				$this->db->exec("DELETE FROM faq_vectors");
				$this->db->close();
				$this->db = null;

				// Remove the SQLite database file
				$dbPath = WP_CONTENT_DIR . "/wpchat-faq-vectors.db";
				if (file_exists($dbPath)) {
					$success = wp_delete_file($dbPath) && $success;
				}
			} catch (Exception $e) {
				Logger::error(
					"Failed to clean up SQLite vector database: " .
						$e->getMessage()
				);
				$success = false;
			}
		}

		// Clean up flat file storage if it exists
		if (file_exists($this->vectorFilePath)) {
			$success = wp_delete_file($this->vectorFilePath) && $success;
		}

		return $success;
	}

	/**
	 * Get FAQs that don't have vectors yet
	 */
	public function getFaqsWithoutVectors(int $limit = 50): array
	{
		global $wpdb;
		$faqsTable = $wpdb->prefix . "wpchat_faqs";

		if ($this->db) {
			// SQLite storage - need to check the SQLite database.
			$vectorIds = [];
			$stmt = $this->db->prepare(
				"SELECT DISTINCT faq_id FROM faq_vectors"
			);
			$result = $stmt->execute();

			while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
				$vectorIds[] = $row["faq_id"];
			}

			// Get FAQs not in the vector list.
			if (empty($vectorIds)) {
				// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
				$sql = $wpdb->prepare(
					"SELECT id, question, answer FROM {$faqsTable} LIMIT %d",
					$limit
				);
				// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
			} else {
				$placeholders = implode(
					",",
					array_fill(0, count($vectorIds), "%d")
				);
				// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
				$sql = $wpdb->prepare(
					"SELECT id, question, answer FROM {$faqsTable} WHERE id NOT IN ({$placeholders}) LIMIT %d",
					array_merge($vectorIds, [$limit])
				);
				// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
			}
		} else {
			// Flat file storage - get all FAQs and check against stored vectors.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- Table name is safe, constructed from $wpdb->prefix
			$sql = $wpdb->prepare(
				"SELECT id, question, answer FROM {$faqsTable} LIMIT %d",
				$limit * 2 // Get more since we'll filter out existing ones.
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
		}

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Table name is safe, constructed from $wpdb->prefix
		$faqs = $wpdb->get_results($sql, ARRAY_A);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		// For flat file storage, filter out FAQs that already have vectors.
		if (!$this->db && !empty($faqs)) {
			try {
				$data = json_decode(
					file_get_contents($this->vectorFilePath),
					true
				);
				$existingVectors = isset($data["vectors"])
					? array_keys($data["vectors"])
					: [];

				$faqs = array_filter($faqs, function ($faq) use (
					$existingVectors
				) {
					return !in_array($faq["id"], $existingVectors);
				});

				// Limit results.
				$faqs = array_slice($faqs, 0, $limit);
			} catch (Exception $e) {
				// If file doesn't exist or is invalid, return all FAQs.
				$faqs = array_slice($faqs, 0, $limit);
			}
		}

		return $faqs;
	}

	/**
	 * Generate vectors for FAQs that don't have them yet
	 */
	public function generateMissingVectors(): void
	{
		// Check if we have an API token.
		$apiToken = $this->privateSettingsService->getSetting("api_token");
		if (empty($apiToken)) {
			return;
		}

		try {
			// Get FAQs without vectors.
			$faqs = $this->getFaqsWithoutVectors(100); // Process 100 at a time.

			if (empty($faqs)) {
				return;
			}

			// Prepare texts for batch processing.
			$texts = [];
			$faqIds = [];

			foreach ($faqs as $faq) {
				$texts[] = trim($faq["question"]) . " " . trim($faq["answer"]);
				$faqIds[] = $faq["id"];
			}

			// Generate embeddings in batch.
			$embeddings = $this->generateEmbeddings($texts);

			// Store vectors.
			$stored = 0;
			foreach ($embeddings as $index => $vector) {
				if (isset($faqIds[$index])) {
					$success = $this->storeVector($faqIds[$index], $vector);
					if ($success) {
						$stored++;
					}
				}
			}

			// After processing vectors, update usage stats.
			$this->fetchEmbeddingUsageStats();
		} catch (Exception $e) {
			Logger::error(
				"VectorEmbedding: Failed to generate vectors - " .
					$e->getMessage()
			);
		}
	}

	/**
	 * Update embedding usage stats
	 */
	public function updateEmbeddingUsageStats(): void
	{
		// Check if we have an API token.
		$apiToken = $this->privateSettingsService->getSetting("api_token");
		if (empty($apiToken)) {
			return;
		}

		$stats = $this->fetchEmbeddingUsageStats();

		if ($stats && is_array($stats)) {
			// Check if we're approaching token limits.
			if (isset($stats["used_tokens"]) && isset($stats["token_limit"])) {
				$usagePercentage =
					($stats["used_tokens"] / $stats["token_limit"]) * 100;

				if ($usagePercentage > 90) {
					Logger::warning(
						"WPChat VectorEmbedding: WARNING - Token usage above 90% (" .
							$stats["used_tokens"] .
							"/" .
							$stats["token_limit"] .
							")"
					);
					// Trigger action for other services to handle high usage.
					do_action(
						"wpchat_embedding_high_usage",
						$stats,
						$usagePercentage
					);
				}
			}

			// Trigger action for other services.
			do_action("wpchat_embedding_stats_updated", $stats);
		}
	}

	/**
	 * Handle API token update via custom action
	 */
	public function onApiTokenUpdated($token): void
	{
		// Clear any existing scheduled events first.
		wp_clear_scheduled_hook("wpchat_vector_generation_cron");
		wp_clear_scheduled_hook("wpchat_embedding_usage_stats_cron");

		// Schedule immediate vector generation.
		wp_schedule_single_event(time() + 5, "wpchat_vector_generation_cron");

		// Also ensure recurring schedules are set.
		$this->scheduleRecurringVectorGeneration();
		$this->scheduleUsageStatsUpdate();

		// Fetch usage stats for the new/updated token immediately
		$this->fetchEmbeddingUsageStats();
	}

	/**
	 * Maybe schedule vector generation when settings are updated
	 */
	public function maybeScheduleVectorGeneration(
		$old_value,
		$value,
		$option
	): void {
		// Ensure we have arrays to work with
		$oldValue = is_array($old_value) ? $old_value : [];
		$newValue = is_array($value) ? $value : [];

		// Check if api_token was added or updated
		$oldToken = $oldValue["api_token"] ?? "";
		$newToken = $newValue["api_token"] ?? "";

		if (!empty($newToken) && $oldToken !== $newToken) {
			// Token was added or changed - schedule immediate vector generation
			// Clear any existing scheduled events first
			wp_clear_scheduled_hook("wpchat_vector_generation_cron");

			// Schedule new event
			wp_schedule_single_event(
				time() + 10,
				"wpchat_vector_generation_cron"
			);

			// Also ensure recurring schedule is set
			$this->scheduleRecurringVectorGeneration();
		}
	}

	/**
	 * Schedule recurring vector generation
	 */
	public function scheduleRecurringVectorGeneration(): void
	{
		if (!wp_next_scheduled("wpchat_vector_generation_cron")) {
			wp_schedule_event(
				time() + 60,
				"twicedaily",
				"wpchat_vector_generation_cron"
			);
		}
	}

	/**
	 * Schedule daily usage stats update
	 */
	public function scheduleUsageStatsUpdate(): void
	{
		if (!wp_next_scheduled("wpchat_embedding_usage_stats_cron")) {
			wp_schedule_event(
				time() + 3600,
				"daily",
				"wpchat_embedding_usage_stats_cron"
			);
		}
	}

	/**
	 * Unschedule vector generation cron job
	 */
	public function unscheduleVectorGeneration(): void
	{
		$timestamp = wp_next_scheduled("wpchat_vector_generation_cron");
		if ($timestamp) {
			wp_unschedule_event($timestamp, "wpchat_vector_generation_cron");
		}

		// Clear all scheduled events for this hook
		wp_clear_scheduled_hook("wpchat_vector_generation_cron");

		// Also clear usage stats cron
		$timestamp = wp_next_scheduled("wpchat_embedding_usage_stats_cron");
		if ($timestamp) {
			wp_unschedule_event(
				$timestamp,
				"wpchat_embedding_usage_stats_cron"
			);
		}
		wp_clear_scheduled_hook("wpchat_embedding_usage_stats_cron");
	}

	public function __destruct()
	{
		if ($this->db) {
			$this->db->close();
		}
	}
}
