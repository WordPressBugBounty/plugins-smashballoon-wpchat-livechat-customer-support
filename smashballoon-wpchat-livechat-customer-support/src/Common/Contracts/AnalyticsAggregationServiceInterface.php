<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface for analytics aggregation service implementations.
 * Handles ETL (Extract, Transform, Load) processing of raw analytics data into aggregate tables.
 */
interface AnalyticsAggregationServiceInterface
{
	/**
	 * Process raw analytics events into daily summary aggregates.
	 *
	 * @param string|null $start_date Start date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @param string|null $end_date   End date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @return array Processing results with counts and errors.
	 */
	public function processDailySummaries(?string $start_date = null, ?string $end_date = null): array;

	/**
	 * Process raw analytics events into hourly summary aggregates.
	 *
	 * @param string|null $start_date Start date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @param string|null $end_date   End date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @return array Processing results with counts and errors.
	 */
	public function processHourlySummaries(?string $start_date = null, ?string $end_date = null): array;

	/**
	 * Process raw analytics events into FAQ daily summary aggregates.
	 *
	 * @param string|null $start_date Start date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @param string|null $end_date   End date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @return array Processing results with counts and errors.
	 */
	public function processFaqDailySummaries(?string $start_date = null, ?string $end_date = null): array;

	/**
	 * Process raw analytics events into agent daily summary aggregates.
	 *
	 * @param string|null $start_date Start date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @param string|null $end_date   End date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @return array Processing results with counts and errors.
	 */
	public function processAgentDailySummaries(?string $start_date = null, ?string $end_date = null): array;

	/**
	 * Process all aggregate types for a given date range.
	 *
	 * @param string|null $start_date Start date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @param string|null $end_date   End date in 'YYYY-MM-DD' format (null for all unprocessed).
	 * @return array Processing results with counts and errors for all aggregate types.
	 */
	public function processAllAggregates(?string $start_date = null, ?string $end_date = null): array;

	/**
	 * Get the last processed timestamp for a specific aggregate type.
	 *
	 * @param string $aggregate_type The aggregate type (e.g., 'daily', 'hourly', 'faq_daily', 'agent_daily').
	 * @return string|null The last processed timestamp or null if never processed.
	 */
	public function getLastProcessedTimestamp(string $aggregate_type): ?string;

	/**
	 * Update the last processed timestamp for a specific aggregate type.
	 *
	 * @param string $aggregate_type The aggregate type.
	 * @param string $timestamp      The timestamp to set.
	 * @return bool Whether the update was successful.
	 */
	public function updateLastProcessedTimestamp(string $aggregate_type, string $timestamp): bool;

	/**
	 * Clean up old aggregate data beyond the retention period.
	 *
	 * @param int $retention_days Number of days to retain data.
	 * @return array Cleanup results with counts of deleted records.
	 */
	public function cleanupOldAggregates(int $retention_days = 365): array;
}
