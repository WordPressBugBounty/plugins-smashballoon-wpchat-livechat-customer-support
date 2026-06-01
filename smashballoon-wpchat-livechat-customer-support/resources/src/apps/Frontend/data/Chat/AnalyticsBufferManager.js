import { buildRestUrl, makeFrontendRequest } from '@Utils/apiHelper';

/**
 * Analytics Buffer Manager - Handles batching and debouncing of analytics events
 */
class AnalyticsBufferManager {
	constructor(config = {}) {
		// Configuration
		this.config = {
			maxBufferSize: config.maxBufferSize || 25, // Increased for batch events
			flushInterval: config.flushInterval || 8000, // 8 seconds - less aggressive
			maxRetries: config.maxRetries || 3,
			retryDelay: config.retryDelay || 1000,
			batchSimilarEvents: config.batchSimilarEvents !== false, // Default true
			...config
		};

		// Buffer state
		this.buffer = [];
		this.flushTimer = null;
		this.isOnline = navigator.onLine;
		this.lastFlushTime = 0; // Track last flush to prevent too frequent calls

		// Critical events that trigger immediate flush
		this.criticalEvents = new Set([
			'BOT_CLOSE',
			'REDIRECT_TO_PLATFORM',
			'AGENT_ASSIGNMENT',
			'FUNNEL_COMPLETE',
			'FUNNEL_ABANDON'
		]);

		// Initialize event handlers
		this.initEventHandlers();
	}

	/**
	 * Initialize event handlers for online/offline and page unload
	 */
	initEventHandlers() {
		// Online/offline status
		window.addEventListener('online', () => {
			this.isOnline = true;
			this.retryFailedEvents();
		});

		window.addEventListener('offline', () => {
			this.isOnline = false;
		});

		// Page unload - flush buffer using sendBeacon
		window.addEventListener('beforeunload', () => {
			this.flushBeacon();
		});

		// Page visibility change - flush when page becomes hidden
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.flush();
			}
		});
	}

	/**
	 * Add an event to the buffer
	 */
	addEvent(eventType, eventData = {}, context = {}) {
		const event = {
			event_type: eventType,
			event_data: {
				...eventData,
				timestamp: new Date().toISOString()
			},
			context: context
		};

		this.buffer.push(event);

		// Check if we should flush immediately
		if (this.shouldFlushImmediately(eventType)) {
			this.flush();
		} else if (this.buffer.length >= this.config.maxBufferSize) {
			this.flush();
		} else {
			this.scheduleFlush();
		}
	}

	/**
	 * Add multiple events for batch processing (like FAQ search appearances)
	 */
	addBatchEvents(events) {
		// Check if any events require immediate flush
		const hasCriticalEvent = events.some(({ eventType }) => 
			this.shouldFlushImmediately(eventType)
		);

		// Add all events to buffer
		events.forEach(({ eventType, eventData, context }) => {
			const event = {
				event_type: eventType,
				event_data: {
					...eventData,
					timestamp: new Date().toISOString()
				},
				context: context || {}
			};
			this.buffer.push(event);
		});

		// Decide flush strategy
		if (hasCriticalEvent || this.buffer.length >= this.config.maxBufferSize) {
			this.flush();
		} else {
			// Only schedule if not already scheduled to prevent timer conflicts
			this.scheduleFlush();
		}
	}

	/**
	 * Check if event should trigger immediate flush
	 */
	shouldFlushImmediately(eventType) {
		return this.criticalEvents.has(eventType);
	}

	/**
	 * Schedule a flush operation
	 */
	scheduleFlush() {
		if (this.flushTimer) {
			return; // Already scheduled
		}

		this.flushTimer = setTimeout(() => {
			this.flush();
		}, this.config.flushInterval);
	}

	/**
	 * Flush the buffer to the server
	 */
	async flush() {
		if (this.buffer.length === 0) {
			return;
		}

		// Prevent too frequent flushes (minimum 2 seconds between flushes)
		const now = Date.now();
		const minFlushInterval = 2000; // 2 seconds
		if (now - this.lastFlushTime < minFlushInterval) {
			// Schedule a delayed flush instead
			if (!this.flushTimer) {
				this.flushTimer = setTimeout(() => {
					this.flush();
				}, minFlushInterval - (now - this.lastFlushTime));
			}
			return;
		}

		// Clear the flush timer
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		// Copy and clear buffer
		const eventsToSend = [...this.buffer];
		this.buffer = [];
		this.lastFlushTime = now;

		if (!this.isOnline) {
			this.storeOfflineEvents(eventsToSend);
			return;
		}

		try {
			await this.sendEvents(eventsToSend);
		} catch (error) {
			console.error('Failed to send analytics events:', error);
			this.handleFailedEvents(eventsToSend);
		}
	}

	/**
	 * Flush using sendBeacon for page unload
	 */
	flushBeacon() {
		if (this.buffer.length === 0) {
			return;
		}

		const payload = JSON.stringify({
			events: this.buffer,
			context: {},
		});

		const url = `${window.location.origin}${buildRestUrl('analytics/batch', {}, 'frontend')}`;
		
		try {
			navigator.sendBeacon(url, new Blob([payload], {
				type: 'application/json'
			}));
		} catch (error) {
			console.error('Failed to send beacon:', error);
		}

		this.buffer = [];
	}

	/**
	 * Send events to the server
	 */
	async sendEvents(events, retryCount = 0) {
		try {
			const response = await makeFrontendRequest('analytics/batch', {
				method: 'POST',
				data: {
					events: events,
					context: {}
				}
			});

			if (response.success) {
				this.removeFromOfflineStorage(events);
			} else {
				throw new Error(response.message || 'Failed to send events');
			}

		} catch (error) {
			if (retryCount < this.config.maxRetries) {
				await this.delay(this.config.retryDelay * (retryCount + 1));
				return this.sendEvents(events, retryCount + 1);
			}
			throw error;
		}
	}

	/**
	 * Handle failed events by storing them for retry
	 */
	handleFailedEvents(events) {
		this.storeOfflineEvents(events);
	}

	/**
	 * Store events in localStorage for offline/retry
	 */
	storeOfflineEvents(events) {
		try {
			const stored = JSON.parse(localStorage.getItem('wpchat_offline_events') || '[]');
			const updated = [...stored, ...events];
			
			// Limit stored events to prevent localStorage bloat
			if (updated.length > 100) {
				updated.splice(0, updated.length - 100);
			}
			
			localStorage.setItem('wpchat_offline_events', JSON.stringify(updated));
		} catch (error) {
			console.error('Failed to store offline events:', error);
		}
	}

	/**
	 * Retry failed/offline events
	 */
	async retryFailedEvents() {
		try {
			const storedEvents = JSON.parse(localStorage.getItem('wpchat_offline_events') || '[]');
			
			if (storedEvents.length > 0) {
				await this.sendEvents(storedEvents);
			}
		} catch (error) {
			console.error('Failed to retry offline events:', error);
		}
	}

	/**
	 * Remove successfully sent events from offline storage
	 */
	removeFromOfflineStorage(sentEvents) {
		try {
			const stored = JSON.parse(localStorage.getItem('wpchat_offline_events') || '[]');
			const remaining = stored.filter(storedEvent => 
				!sentEvents.some(sentEvent => 
					sentEvent.event_type === storedEvent.event_type &&
					sentEvent.event_data.timestamp === storedEvent.event_data.timestamp
				)
			);
			
			if (remaining.length === 0) {
				localStorage.removeItem('wpchat_offline_events');
			} else {
				localStorage.setItem('wpchat_offline_events', JSON.stringify(remaining));
			}
		} catch (error) {
			console.error('Failed to update offline storage:', error);
		}
	}

	/**
	 * Utility delay function
	 */
	delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Get buffer status for debugging
	 */
	getStatus() {
		return {
			bufferSize: this.buffer.length,
			isOnline: this.isOnline,
			hasFlushTimer: !!this.flushTimer,
			lastFlushTime: this.lastFlushTime,
			timeSinceLastFlush: Date.now() - this.lastFlushTime,
			config: this.config,
			offlineEvents: JSON.parse(localStorage.getItem('wpchat_offline_events') || '[]').length
		};
	}

	/**
	 * Clear all buffers and storage (for testing/reset)
	 */
	clear() {
		this.buffer = [];
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
		localStorage.removeItem('wpchat_offline_events');
	}
}

// Create singleton instance
const bufferManager = new AnalyticsBufferManager();

export default bufferManager;