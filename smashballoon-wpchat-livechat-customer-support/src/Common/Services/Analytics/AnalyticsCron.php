<?php

namespace SmashBalloon\WPChat\Common\Services\Analytics;

use SmashBalloon\WPChat\Common\Helpers\Logger;

use Exception;
use DateTime;
use SmashBalloon\WPChat\Common\Helpers\AnalyticsTimezoneHelper;
use SmashBalloon\WPChat\Common\Contracts\AnalyticsAggregationServiceInterface;

/**
 * Comprehensive cron job system for analytics data processing.
 * Handles scheduled aggregation of raw analytics events into summary tables.
 */
class AnalyticsCron
{
	/**
	 * Option key for cron job settings.
	 *
	 * @var string
	 */
	private const CRON_SETTINGS_OPTION = 'wpchat_analytics_cron_settings';
	/**
	 * Option key for cron job status.
	 *
	 * @var string
	 */
	private const CRON_STATUS_OPTION = 'wpchat_analytics_cron_status';
	/**
	 * Option key for job queue.
	 *
	 * @var string
	 */
	private const JOB_QUEUE_OPTION = 'wpchat_analytics_job_queue';
	/**
	 * Maximum retry attempts for failed jobs.
	 *
	 * @var int
	 */
	private const MAX_RETRY_ATTEMPTS = 3;
	/**
	 * Aggregation service instance.
	 *
	 * @var AnalyticsAggregationServiceInterface
	 */
	private AnalyticsAggregationServiceInterface $aggregationService;
	/**
	 * Event logger instance.
	 *
	 * @var EventLogger
	 */
	private EventLogger $eventLogger;

	/**
	 * Constructor.
	 *
	 * @param AnalyticsAggregationServiceInterface $aggregationService Aggregation service instance.
	 * @param EventLogger                          $eventLogger Event logger instance.
	 */
	public function __construct(
		AnalyticsAggregationServiceInterface $aggregationService,
		EventLogger $eventLogger
	) {
		$this->aggregationService = $aggregationService;
		$this->eventLogger = $eventLogger;
	}

	/**
	 * Register the analytics cron service.
	 */
	public function register(): void
	{
		// Register cron hooks
		add_action('wpchat_analytics_process_aggregates', [$this, 'processAggregates']);
		add_action('wpchat_analytics_cleanup_old_data', [$this, 'cleanupOldData']);
		add_action('wpchat_analytics_quick_aggregation', [$this, 'quickAggregation']);

		// Register custom cron intervals
		add_filter('cron_schedules', [$this, 'addCustomCronIntervals']);

		// Hook into plugin activation/deactivation
		add_action('wpchat_plugin_activated', [$this, 'scheduleJobs']);
		add_action('wpchat_plugin_deactivated', [$this, 'unscheduleJobs']);

		// Schedule jobs if not already scheduled (but only if cron settings allow it)
		add_action('init', [$this, 'conditionalScheduleJobs'], 20);
	}

	/**
	 * Conditionally schedule analytics cron jobs.
	 * Only schedules if not already scheduled and if settings allow it.
	 */
	public function conditionalScheduleJobs(): void
	{
		$settings = $this->getCronSettings();

		// Only schedule if enabled in settings
		if (!$settings['enabled']) {
			return;
		}

		// Check if any jobs are missing and schedule them
		$this->scheduleJobs();
	}

	/**
	 * Get cron job settings.
	 *
	 * @return array Cron job settings.
	 */
	public function getCronSettings(): array
	{
		$defaults = [
			'main_interval' => 'wpchat_5min',
			'quick_interval' => 'wpchat_15min',
			'retention_days' => 365,
			'enabled' => true,
			'max_processing_time' => 300, // 5 minutes
		];

		return array_merge($defaults, get_option(self::CRON_SETTINGS_OPTION, []));
	}

	/**
	 * Schedule analytics cron jobs.
	 */
	public function scheduleJobs(): void
	{
		$settings = $this->getCronSettings();
		$scheduledJobs = [];
		$errors = [];

		try {
			// Schedule main aggregation job (every 5 minutes by default)
			if (!wp_next_scheduled('wpchat_analytics_process_aggregates')) {
				$result = wp_schedule_event(
					time(),
					$settings['main_interval'],
					'wpchat_analytics_process_aggregates'
				);

				if ($result === false) {
					$errors[] = "Failed to schedule main aggregation job with interval: {$settings['main_interval']}";
				} else {
					$scheduledJobs[] = 'process_aggregates';
				}
			}

			// Schedule quick aggregation job (every 15 minutes)
			if (!wp_next_scheduled('wpchat_analytics_quick_aggregation')) {
				$result = wp_schedule_event(
					time() + 60, // Offset by 1 minute
					$settings['quick_interval'],
					'wpchat_analytics_quick_aggregation'
				);

				if ($result === false) {
					$errors[] = "Failed to schedule quick aggregation job with interval: {$settings['quick_interval']}";
				} else {
					$scheduledJobs[] = 'quick_aggregation';
				}
			}

			// Schedule cleanup job (daily)
			if (!wp_next_scheduled('wpchat_analytics_cleanup_old_data')) {
				$result = wp_schedule_event(
					wp_next_scheduled('wp_scheduled_delete') ?: (time() + 3600), // Align with WP cleanup or 1 hour
					'daily',
					'wpchat_analytics_cleanup_old_data'
				);

				if ($result === false) {
					$errors[] = "Failed to schedule cleanup job with daily interval";
				} else {
					$scheduledJobs[] = 'cleanup_old_data';
				}
			}

			// Log the results
			if (!empty($scheduledJobs)) {
				$this->logCronEvent('Cron jobs scheduled', [
					'scheduled_jobs' => $scheduledJobs,
					'main_interval' => $settings['main_interval'],
					'quick_interval' => $settings['quick_interval'],
				]);
			}

			if (!empty($errors)) {
				$this->logCronEvent('Cron scheduling errors', [
					'errors' => $errors,
				]);
			}
		} catch (Exception $e) {
			$this->logCronEvent('Cron scheduling exception', [
				'error_message' => $e->getMessage(),
			]);
		}
	}

	/**
	 * Log cron event to WordPress error log instead of analytics table.
	 *
	 * @param string $message Event message.
	 * @param array  $metadata Event metadata.
	 */
	private function logCronEvent(string $message, array $metadata = []): void
	{
		$logEntry = 'WPChat Analytics Cron: ' . sanitize_text_field($message);

		if (!empty($metadata)) {
			// Handle circular references with JSON conversion.
			$circularSafeMetadata = json_decode(
				json_encode(
					$metadata,
					JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_UNESCAPED_UNICODE,
					10
				),
				true
			);

			if ($circularSafeMetadata === null) {
				$logEntry .= ' | [CIRCULAR_REFERENCE_DETECTED]';
			} else {
				$sanitizedMetadata = $this->sanitizeMetadata($circularSafeMetadata);

				$jsonMetadata = wp_json_encode($sanitizedMetadata);
				if ($jsonMetadata !== false) {
					$logEntry .= ' | ' . $jsonMetadata;
				} else {
					$logEntry .= ' | [JSON_ENCODE_ERROR]';
				}
			}
		}

		Logger::log($logEntry);
	}

	/**
	 * Sanitize metadata to avoid logging sensitive information.
	 *
	 * @param array $metadata
	 * @return array
	 */
	private function sanitizeMetadata(array $metadata): array
	{
		$sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'apikey', 'auth', 'authorization', 'email'];
		$sanitized = [];

		foreach ($metadata as $key => $value) {
			$sanitizedKey = sanitize_text_field($key);

			if (in_array(strtolower($sanitizedKey), $sensitiveKeys, true)) {
				$sanitized[$sanitizedKey] = '[REDACTED]';
			} elseif (is_array($value) || is_object($value)) {
				$value = is_object($value) ? (array)$value : $value;
				$sanitized[$sanitizedKey] = $this->sanitizeMetadata($value);
			} elseif (is_string($value)) {
				$value = strlen($value) > 1000 ? substr($value, 0, 1000) . '...' : $value;
				$sanitized[$sanitizedKey] = sanitize_text_field($value);
			} else {
				$sanitized[$sanitizedKey] = $value;
			}
		}

		return $sanitized;
	}

	/**
	 * Update cron job settings.
	 *
	 * @param array $settings New settings.
	 * @return bool Whether the update was successful.
	 */
	public function updateCronSettings(array $settings): bool
	{
		$currentSettings = $this->getCronSettings();
		$newSettings = array_merge($currentSettings, $settings);

		// If intervals changed, reschedule jobs
		if (
			$currentSettings['main_interval'] !== $newSettings['main_interval'] ||
			$currentSettings['quick_interval'] !== $newSettings['quick_interval']
		) {
			$this->unscheduleJobs();
			$result = update_option(self::CRON_SETTINGS_OPTION, $newSettings);
			if ($result) {
				$this->scheduleJobs();
			}
			return $result;
		}

		return update_option(self::CRON_SETTINGS_OPTION, $newSettings);
	}

	/**
	 * Unschedule analytics cron jobs.
	 */
	public function unscheduleJobs(): void
	{
		wp_clear_scheduled_hook('wpchat_analytics_process_aggregates');
		wp_clear_scheduled_hook('wpchat_analytics_cleanup_old_data');
		wp_clear_scheduled_hook('wpchat_analytics_quick_aggregation');

		$this->logCronEvent('Cron jobs unscheduled');
	}

	/**
	 * Add custom cron intervals.
	 *
	 * @param array $schedules Existing cron schedules.
	 * @return array Updated cron schedules.
	 */
	public function addCustomCronIntervals(array $schedules): array
	{
		// Add WPChat-specific schedules
		$schedules['wpchat_5min'] = [
			'interval' => 300,
			'display' => __('Every 5 minutes', 'smashballoon-wpchat-livechat-customer-support'),
		];

		$schedules['wpchat_15min'] = [
			'interval' => 900,
			'display' => __('Every 15 minutes', 'smashballoon-wpchat-livechat-customer-support'),
		];

		return $schedules;
	}

	/**
	 * Get comprehensive cron diagnostics.
	 * Useful for debugging cron issues.
	 *
	 * @return array Comprehensive cron diagnostics.
	 */
	public function getCronDiagnostics(): array
	{
		$diagnostics = [
			'timestamp' => current_time('mysql'),
			'wp_cron_enabled' => !defined('DISABLE_WP_CRON') || !DISABLE_WP_CRON,
			'available_schedules' => [],
			'wpchat_jobs' => [],
			'all_scheduled_events' => [],
			'settings' => $this->getCronSettings(),
			'status' => $this->getCronStatus(),
			'health' => $this->healthCheck(),
		];

		// Get all available schedules
		$schedules = wp_get_schedules();
		foreach ($schedules as $schedule => $details) {
			$diagnostics['available_schedules'][$schedule] = [
				'interval' => $details['interval'],
				'display' => $details['display'],
				'seconds' => $details['interval'],
				'human_readable' => human_time_diff(0, $details['interval']),
			];
		}

		// Get WPChat specific scheduled events
		$wpChatHooks = [
			'wpchat_analytics_process_aggregates',
			'wpchat_analytics_quick_aggregation',
			'wpchat_analytics_cleanup_old_data',
		];

		foreach ($wpChatHooks as $hook) {
			$nextRun = wp_next_scheduled($hook);
			$diagnostics['wpchat_jobs'][$hook] = [
				'scheduled' => $nextRun !== false,
				'next_run' => $nextRun,
				'next_run_formatted' => $nextRun ? date('Y-m-d H:i:s', $nextRun) : null,
				'time_until_next' => $nextRun ? human_time_diff(time(), $nextRun) : null,
			];
		}

		// Note: Full event listing would require wp_get_scheduled_events() (WordPress 5.1.0+)
		$diagnostics['all_scheduled_events'] = ['info' => 'Use wp_get_scheduled_events() for full event listing'];

		return $diagnostics;
	}

	/**
	 * Check if cron jobs are running properly.
	 *
	 * @return array Health check results.
	 */
	public function healthCheck(): array
	{
		$status = $this->getCronStatus();
		$scheduled = $this->getNextScheduledRuns();
		$settings = $this->getCronSettings();

		$health = [
			'overall_status' => 'healthy',
			'issues' => [],
			'jobs' => [],
		];

		// Check each job
		foreach (['process_aggregates', 'quick_aggregation', 'cleanup_old_data'] as $job) {
			$jobStatus = $status[$job] ?? [];
			$lastRun = $jobStatus['last_run'] ?? null;
			$isScheduled = $scheduled[$job] !== false;

			$jobHealth = [
				'name' => $job,
				'status' => $jobStatus['status'] ?? 'unknown',
				'last_run' => $lastRun,
				'next_run' => $scheduled[$job] ? date('Y-m-d H:i:s', $scheduled[$job]) : null,
				'is_scheduled' => $isScheduled,
				'healthy' => true,
			];

			// Check if job is overdue
			if (!$isScheduled) {
				$jobHealth['healthy'] = false;
				$health['issues'][] = "Job {$job} is not scheduled";
			}

			// Check if job failed recently
			if (in_array($jobStatus['status'] ?? '', ['failed', 'error'])) {
				$jobHealth['healthy'] = false;
				$health['issues'][] = "Job {$job} failed on last run";
			}

			$health['jobs'][] = $jobHealth;
		}

		// Overall health
		if (!empty($health['issues'])) {
			$health['overall_status'] = 'unhealthy';
		}

		return $health;
	}

	/**
	 * Get next scheduled run times.
	 *
	 * @return array Next scheduled run times.
	 */
	public function getNextScheduledRuns(): array
	{
		return [
			'process_aggregates' => wp_next_scheduled('wpchat_analytics_process_aggregates'),
			'quick_aggregation' => wp_next_scheduled('wpchat_analytics_quick_aggregation'),
			'cleanup_old_data' => wp_next_scheduled('wpchat_analytics_cleanup_old_data'),
		];
	}

	/**
	 * Add job to queue with priority and retry logic.
	 *
	 * @param string $job_name Job name.
	 * @param array  $args Job arguments.
	 * @param int    $priority Job priority (1 = highest, 4 = lowest).
	 * @param int    $delay Delay in seconds before job should run.
	 * @return bool Whether the job was queued successfully.
	 */
	public function queueJob(string $job_name, array $args = [], int $priority = 2, int $delay = 0): bool
	{
		$queue = get_option(self::JOB_QUEUE_OPTION, []);

		$jobId = $job_name . '_' . time() . '_' . wp_rand(1000, 9999);

		$queue[$jobId] = [
			'job_name' => $job_name,
			'args' => $args,
			'priority' => $priority,
			'queued_at' => current_time('mysql'),
			'scheduled_for' => date('Y-m-d H:i:s', time() + $delay),
			'attempts' => 0,
			'status' => 'queued',
		];

		return update_option(self::JOB_QUEUE_OPTION, $queue);
	}

	/**
	 * Process job queue based on priority.
	 *
	 * @param int $max_jobs Maximum number of jobs to process.
	 * @return array Processing results.
	 */
	public function processJobQueue(int $max_jobs = 5): array
	{
		$queue = get_option(self::JOB_QUEUE_OPTION, []);
		$results = [
			'processed' => 0,
			'failed' => 0,
			'skipped' => 0,
			'jobs' => [],
		];

		if (empty($queue)) {
			return $results;
		}

		// Filter jobs that are ready to run
		$readyJobs = array_filter($queue, function ($job) {
			return $job['status'] === 'queued' &&
				strtotime($job['scheduled_for']) <= time() &&
				$job['attempts'] < self::MAX_RETRY_ATTEMPTS;
		});

		// Sort by priority (lower number = higher priority)
		uasort($readyJobs, function ($a, $b) {
			return $a['priority'] <=> $b['priority'];
		});

		// Process jobs
		$processedCount = 0;
		foreach ($readyJobs as $jobId => $job) {
			if ($processedCount >= $max_jobs) {
				break;
			}

			$result = $this->processQueuedJob($jobId, $job);
			$results['jobs'][$jobId] = $result;

			if ($result['success']) {
				$results['processed']++;
				unset($queue[$jobId]);
			} else {
				$results['failed']++;
				$queue[$jobId]['attempts']++;
				$queue[$jobId]['last_error'] = $result['error'];
				$queue[$jobId]['last_attempt'] = current_time('mysql');

				// If max attempts reached, mark as failed
				if ($queue[$jobId]['attempts'] >= self::MAX_RETRY_ATTEMPTS) {
					$queue[$jobId]['status'] = 'failed';
				}
			}

			$processedCount++;
		}

		update_option(self::JOB_QUEUE_OPTION, $queue);
		return $results;
	}

	/**
	 * Process a single queued job.
	 *
	 * @param string $job_id Job ID.
	 * @param array  $job Job data.
	 * @return array Processing result.
	 */
	private function processQueuedJob(string $job_id, array $job): array
	{
		$result = [
			'success' => false,
			'error' => null,
			'processing_time' => 0,
		];

		$startTime = microtime(true);

		try {
			// Check rate limiting
			if (!$this->checkRateLimit($job['job_name'])) {
				$result['error'] = 'Rate limit exceeded';
				return $result;
			}

			// Execute the job
			$success = $this->forceRunJob($job['job_name']);

			$result['success'] = $success;
			$result['processing_time'] = round((microtime(true) - $startTime) * 1000);

			if (!$success) {
				$result['error'] = 'Job execution failed';
			}
		} catch (Exception $e) {
			$result['error'] = $e->getMessage();
			$result['processing_time'] = round((microtime(true) - $startTime) * 1000);
		}

		return $result;
	}

	/**
	 * Check rate limit for job execution.
	 *
	 * @param string $job_name Job name.
	 * @return bool Whether job can run (not rate limited).
	 */
	private function checkRateLimit(string $job_name): bool
	{
		$status = $this->getCronStatus($job_name);

		// Don't run if job is currently running
		if (($status['status'] ?? '') === 'running') {
			return false;
		}

		// Rate limiting based on job type
		$rateLimits = [
			'quick_aggregation' => 60,    // 1 minute
			'process_aggregates' => 180,  // 3 minutes
			'cleanup_old_data' => 1800,   // 30 minutes
		];

		$limit = $rateLimits[$job_name] ?? 300; // Default 5 minutes
		$lastRun = $status['updated_at'] ?? null;

		if ($lastRun) {
			$timeSinceLastRun = time() - strtotime($lastRun);
			return $timeSinceLastRun >= $limit;
		}

		return true;
	}

	/**
	 * Force run a specific cron job.
	 *
	 * @param string $job_name Job name to run.
	 * @return bool Whether the job was run successfully.
	 */
	public function forceRunJob(string $job_name): bool
	{
		switch ($job_name) {
			case 'process_aggregates':
				$this->processAggregates();
				return true;
			case 'quick_aggregation':
				$this->quickAggregation();
				return true;
			case 'cleanup_old_data':
				$this->cleanupOldData();
				return true;
			default:
				return false;
		}
	}

	/**
	 * Process analytics aggregates.
	 * This is the main cron job that processes raw data into aggregate tables.
	 */
	public function processAggregates(): void
	{
		$startTime = microtime(true);
		$this->updateCronStatus('processing_aggregates', 'running');

		try {
			// Process all aggregate types
			$results = $this->aggregationService->processAllAggregates();

			$processingTime = round((microtime(true) - $startTime) * 1000); // Convert to milliseconds
			$totalProcessed = $this->getTotalProcessedRecords($results);

			if ($results['success']) {
				$this->updateCronStatus('processing_aggregates', 'completed', [
					'processing_time_ms' => $processingTime,
					'total_processed' => $totalProcessed,
					'last_run' => current_time('mysql'),
				]);

				// Only log success if there are performance issues or periodically
				$should_log = $this->shouldLogSuccess('processing_aggregates', $processingTime, $totalProcessed);
				if ($should_log) {
					$this->logCronEvent('Aggregates processed successfully', [
						'processing_time_ms' => $processingTime,
						'total_processed' => $totalProcessed,
						'reason' => $should_log,
					]);
				}
			} else {
				$this->updateCronStatus('processing_aggregates', 'failed', [
					'errors' => $results['errors'],
					'processing_time_ms' => $processingTime,
					'last_run' => current_time('mysql'),
				]);

				$this->logCronEvent('Aggregates processing failed', [
					'errors' => $results['errors'],
					'processing_time_ms' => $processingTime,
				]);
			}
		} catch (Exception $e) {
			$processingTime = round((microtime(true) - $startTime) * 1000);

			$this->updateCronStatus('processing_aggregates', 'error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
				'last_run' => current_time('mysql'),
			]);

			$this->logCronEvent('Aggregates processing error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
			]);
		}
	}

	/**
	 * Update cron job status.
	 *
	 * @param string $job_name Job name.
	 * @param string $status Status (running, completed, failed, error).
	 * @param array  $extra_data Additional status data.
	 * @return bool Whether the update was successful.
	 */
	private function updateCronStatus(string $job_name, string $status, array $extra_data = []): bool
	{
		$currentStatus = $this->getCronStatus();
		$currentStatus[$job_name] = array_merge([
			'status' => $status,
			'updated_at' => current_time('mysql'),
		], $extra_data);

		return update_option(self::CRON_STATUS_OPTION, $currentStatus);
	}

	/**
	 * Get cron job status.
	 *
	 * @param string|null $job_name Specific job name or null for all jobs.
	 * @return array Cron job status.
	 */
	public function getCronStatus(?string $job_name = null): array
	{
		$status = get_option(self::CRON_STATUS_OPTION, []);

		if ($job_name) {
			return $status[$job_name] ?? [];
		}

		return $status;
	}

	/**
	 * Get total processed records from results.
	 *
	 * @param array $results Processing results.
	 * @return int Total processed records.
	 */
	private function getTotalProcessedRecords(array $results): int
	{
		$total = 0;

		foreach (['daily_results', 'hourly_results', 'faq_results', 'agent_results'] as $key) {
			if (isset($results[$key]['processed_records'])) {
				$total += $results[$key]['processed_records'];
			}
		}

		return $total;
	}

	/**
	 * Quick aggregation for recent data.
	 * Processes only the last day's data for quick updates.
	 */
	public function quickAggregation(): void
	{
		$startTime = microtime(true);
		$this->updateCronStatus('quick_aggregation', 'running');

		try {
			// Use WordPress timezone dates instead of UTC dates
			$wpTimezone = AnalyticsTimezoneHelper::getWordPressTimezoneObject();
			$now = new DateTime('now', $wpTimezone);
			$yesterday = (clone $now)->modify('-1 day')->format('Y-m-d');
			$today = $now->format('Y-m-d');

			// Process only recent data
			$results = $this->aggregationService->processAllAggregates($yesterday, $today);

			$processingTime = round((microtime(true) - $startTime) * 1000);
			$totalProcessed = $this->getTotalProcessedRecords($results);

			if ($results['success']) {
				$this->updateCronStatus('quick_aggregation', 'completed', [
					'processing_time_ms' => $processingTime,
					'total_processed' => $totalProcessed,
					'last_run' => current_time('mysql'),
				]);

				// Only log success if there are performance issues or periodically
				$should_log = $this->shouldLogSuccess('quick_aggregation', $processingTime, $totalProcessed);
				if ($should_log) {
					$this->logCronEvent('Quick aggregation completed', [
						'processing_time_ms' => $processingTime,
						'total_processed' => $totalProcessed,
						'reason' => $should_log,
					]);
				}
			} else {
				$this->updateCronStatus('quick_aggregation', 'failed', [
					'errors' => $results['errors'],
					'processing_time_ms' => $processingTime,
					'last_run' => current_time('mysql'),
				]);

				$this->logCronEvent('Quick aggregation failed', [
					'errors' => $results['errors'],
					'processing_time_ms' => $processingTime,
				]);
			}
		} catch (Exception $e) {
			$processingTime = round((microtime(true) - $startTime) * 1000);

			$this->updateCronStatus('quick_aggregation', 'error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
				'last_run' => current_time('mysql'),
			]);

			$this->logCronEvent('Quick aggregation error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
			]);
		}
	}

	/**
	 * Clean up old analytics data.
	 * Removes old aggregate data beyond the retention period.
	 */
	public function cleanupOldData(): void
	{
		$startTime = microtime(true);
		$this->updateCronStatus('cleanup', 'running');

		try {
			$settings = $this->getCronSettings();
			$results = $this->aggregationService->cleanupOldAggregates($settings['retention_days']);

			$processingTime = round((microtime(true) - $startTime) * 1000);
			$totalDeleted = array_sum($results['deleted_records']);

			if ($results['success']) {
				$this->updateCronStatus('cleanup', 'completed', [
					'processing_time_ms' => $processingTime,
					'total_deleted' => $totalDeleted,
					'deleted_records' => $results['deleted_records'],
					'last_run' => current_time('mysql'),
				]);

				// Only log success if there are performance issues or periodically
				$should_log = $this->shouldLogSuccess('cleanup', $processingTime, $totalDeleted);
				if ($should_log) {
					$this->logCronEvent('Old data cleanup completed', [
						'processing_time_ms' => $processingTime,
						'total_deleted' => $totalDeleted,
						'deleted_records' => $results['deleted_records'],
						'reason' => $should_log,
					]);
				}

				// Also clean up raw analytics data
				$this->eventLogger->cleanupOldData($settings['retention_days']);
			} else {
				$this->updateCronStatus('cleanup', 'failed', [
					'errors' => $results['errors'],
					'processing_time_ms' => $processingTime,
					'last_run' => current_time('mysql'),
				]);

				$this->logCronEvent('Old data cleanup failed', [
					'errors' => $results['errors'],
					'processing_time_ms' => $processingTime,
				]);
			}
		} catch (Exception $e) {
			$processingTime = round((microtime(true) - $startTime) * 1000);

			$this->updateCronStatus('cleanup', 'error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
				'last_run' => current_time('mysql'),
			]);

			$this->logCronEvent('Old data cleanup error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
			]);
		}
	}

	/**
	 * Process data in batches to avoid memory issues.
	 *
	 * @param string $job_name Job name.
	 * @param int    $batch_size Batch size.
	 * @return array Processing results.
	 */
	public function processBatchedJob(string $job_name, int $batch_size = 1000): array
	{
		$results = [
			'success' => false,
			'batches_processed' => 0,
			'total_processed' => 0,
			'errors' => [],
		];

		$startTime = microtime(true);
		$this->updateCronStatus($job_name, 'running');

		try {
			switch ($job_name) {
				case 'process_aggregates':
					$results = $this->processBatchedAggregates($batch_size);
					break;
				case 'quick_aggregation':
					$results = $this->processBatchedQuickAggregation($batch_size);
					break;
				default:
					$results['errors'][] = "Batched processing not supported for job: {$job_name}";
					return $results;
			}

			$processingTime = round((microtime(true) - $startTime) * 1000);

			if ($results['success']) {
				$this->updateCronStatus($job_name, 'completed', [
					'processing_time_ms' => $processingTime,
					'batches_processed' => $results['batches_processed'],
					'total_processed' => $results['total_processed'],
					'last_run' => current_time('mysql'),
				]);
			} else {
				$this->updateCronStatus($job_name, 'failed', [
					'processing_time_ms' => $processingTime,
					'errors' => $results['errors'],
					'last_run' => current_time('mysql'),
				]);
			}
		} catch (Exception $e) {
			$processingTime = round((microtime(true) - $startTime) * 1000);
			$this->updateCronStatus($job_name, 'error', [
				'error_message' => $e->getMessage(),
				'processing_time_ms' => $processingTime,
				'last_run' => current_time('mysql'),
			]);
			$results['errors'][] = $e->getMessage();
		}

		return $results;
	}

	/**
	 * Process aggregates in batches.
	 *
	 * @param int $batch_size Batch size.
	 * @return array Processing results.
	 */
	private function processBatchedAggregates(int $batch_size): array
	{
		$results = [
			'success' => true,
			'batches_processed' => 0,
			'total_processed' => 0,
			'errors' => [],
		];

		// Process in smaller time chunks to avoid timeouts
		$startTime = time();
		$maxExecutionTime = $this->getCronSettings()['max_processing_time'] ?? 300;

		while ((time() - $startTime) < ($maxExecutionTime - 30)) { // Leave 30 seconds buffer
			$batchResults = $this->aggregationService->processAllAggregates(
				null, // start_date
				null, // end_date
				$batch_size
			);

			if (!$batchResults['success']) {
				$results['errors'] = array_merge($results['errors'], $batchResults['errors']);
				$results['success'] = false;
				break;
			}

			$batchProcessed = $this->getTotalProcessedRecords($batchResults);
			$results['total_processed'] += $batchProcessed;
			$results['batches_processed']++;

			// If no records were processed, we're done
			if ($batchProcessed === 0) {
				break;
			}

			// Brief pause to prevent overwhelming the database
			usleep(100000); // 100ms
		}

		return $results;
	}

	/**
	 * Process quick aggregation in batches.
	 *
	 * @param int $batch_size Batch size.
	 * @return array Processing results.
	 */
	private function processBatchedQuickAggregation(int $batch_size): array
	{
		$results = [
			'success' => true,
			'batches_processed' => 0,
			'total_processed' => 0,
			'errors' => [],
		];

		$yesterday = date('Y-m-d', strtotime('-1 day'));
		$today = date('Y-m-d');

		$batchResults = $this->aggregationService->processAllAggregates(
			$yesterday,
			$today,
			$batch_size
		);

		if ($batchResults['success']) {
			$results['total_processed'] = $this->getTotalProcessedRecords($batchResults);
			$results['batches_processed'] = 1;
		} else {
			$results['errors'] = $batchResults['errors'];
			$results['success'] = false;
		}

		return $results;
	}

	/**
	 * Clear job queue.
	 *
	 * @param string|null $status Clear only jobs with specific status.
	 * @return bool Whether the queue was cleared.
	 */
	public function clearJobQueue(?string $status = null): bool
	{
		if ($status === null) {
			return delete_option(self::JOB_QUEUE_OPTION);
		}

		$queue = get_option(self::JOB_QUEUE_OPTION, []);
		$filteredQueue = array_filter($queue, function ($job) use ($status) {
			return $job['status'] !== $status;
		});

		return update_option(self::JOB_QUEUE_OPTION, $filteredQueue);
	}

	/**
	 * Get performance metrics for analytics cron system.
	 *
	 * @return array Performance metrics.
	 */
	public function getPerformanceMetrics(): array
	{
		$status = $this->getCronStatus();
		$metrics = [
			'job_performance' => [],
			'system_health' => $this->healthCheck(),
			'queue_stats' => $this->getJobQueueStats(),
			'average_processing_times' => [],
			'success_rates' => [],
		];

		// Calculate performance metrics for each job
		foreach ($status as $jobName => $jobStatus) {
			$metrics['job_performance'][$jobName] = [
				'last_run' => $jobStatus['last_run'] ?? null,
				'status' => $jobStatus['status'] ?? 'unknown',
				'processing_time_ms' => $jobStatus['processing_time_ms'] ?? 0,
				'total_processed' => $jobStatus['total_processed'] ?? 0,
			];

			// Calculate success rate (simplified - in production, you'd track this over time)
			$metrics['success_rates'][$jobName] = in_array($jobStatus['status'] ?? '', ['completed']) ? 100 : 0;
		}

		return $metrics;
	}

	/**
	 * Get job queue statistics.
	 *
	 * @return array Queue statistics.
	 */
	public function getJobQueueStats(): array
	{
		$queue = get_option(self::JOB_QUEUE_OPTION, []);

		$stats = [
			'total_jobs' => count($queue),
			'queued' => 0,
			'failed' => 0,
			'by_priority' => [1 => 0, 2 => 0, 3 => 0, 4 => 0],
			'by_job_type' => [],
		];

		foreach ($queue as $job) {
			$stats[$job['status']]++;
			$stats['by_priority'][$job['priority']]++;
			$stats['by_job_type'][$job['job_name']] = ($stats['by_job_type'][$job['job_name']] ?? 0) + 1;
		}

		return $stats;
	}

	/**
	 * Determine if a success should be logged based on performance and timing.
	 *
	 * @param string $job_type Job type (processing_aggregates, quick_aggregation, cleanup).
	 * @param int    $processing_time_ms Processing time in milliseconds.
	 * @param int    $total_processed Total records processed.
	 * @return string|false Reason to log or false if should not log.
	 */
	private function shouldLogSuccess(string $job_type, int $processing_time_ms, int $total_processed): string|false
	{
		// Performance thresholds
		$performance_thresholds = [
			'processing_aggregates' => [
				'slow_time' => 5000,    // 5 seconds
				'high_volume' => 1000,  // 1000+ records
			],
			'quick_aggregation' => [
				'slow_time' => 3000,    // 3 seconds
				'high_volume' => 500,   // 500+ records
			],
			'cleanup' => [
				'slow_time' => 10000,   // 10 seconds
				'high_volume' => 10000, // 10000+ records
			],
		];

		$thresholds = $performance_thresholds[$job_type] ?? $performance_thresholds['processing_aggregates'];

		// Log if processing is slow
		if ($processing_time_ms > $thresholds['slow_time']) {
			return 'slow_processing';
		}

		// Log if high volume processed
		if ($total_processed > $thresholds['high_volume']) {
			return 'high_volume';
		}

		// Log periodically (once per hour) for normal operations
		$current_status = $this->getCronStatus();
		$job_status = $current_status[$job_type] ?? [];
		$last_success_log = $job_status['last_success_log'] ?? 0;
		$current_time = time();

		if ($current_time - $last_success_log > 3600) { // 1 hour
			// Update the last success log time using existing method
			$this->updateCronStatus($job_type, 'completed', array_merge($job_status, [
				'last_success_log' => $current_time,
			]));
			return 'periodic_log';
		}

		return false;
	}
}
