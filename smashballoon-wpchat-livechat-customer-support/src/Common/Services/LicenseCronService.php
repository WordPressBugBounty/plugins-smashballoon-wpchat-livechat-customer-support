<?php

namespace SmashBalloon\WPChat\Common\Services;

if (!defined('ABSPATH')) {
	exit;
}

use SmashBalloon\WPChat\Common\Helpers\Logger;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;

/**
 * Class LicenseCronService
 *
 * Service for managing scheduled license status checks via WordPress cron.
 * Runs daily to verify license status and update cache.
 *
 * @package SmashBalloon\WPChat\Common\Services
 */
class LicenseCronService implements ServiceProviderInterface
{
    /**
     * The license service instance.
     *
     * @var LicenseService
     */
    private LicenseService $licenseService;

    /**
     * Cron hook name for daily license checks.
     */
    private const CRON_HOOK = 'wpchat_daily_license_check';

    /**
     * Option name for storing last cron run time.
     */
    private const LAST_RUN_OPTION = 'wpchat_license_last_check';

    /**
     * Constructor.
     *
     * @param LicenseService $licenseService The license service.
     */
    public function __construct(LicenseService $licenseService)
    {
        $this->licenseService = $licenseService;
    }

    /**
     * @inheritDoc
     */
    public function register(): void
	{
		// Disabfle the cron for the free version.

		if(!defined('WPCHAT_PRO')) {
			return;
		}

        // Hook the cron action
        add_action(self::CRON_HOOK, [$this, 'performDailyLicenseCheck']);

        // Schedule the cron if not already scheduled
        add_action('wp_loaded', [$this, 'scheduleDailyCheck']);

        // Clean up cron on plugin deactivation
        add_action('wpchat_plugin_deactivated', [$this, 'unscheduleCron']);
    }

    /**
     * Schedule the daily license check if not already scheduled.
     */
    public function scheduleDailyCheck(): void
    {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            $scheduled = wp_schedule_event(time(), 'daily', self::CRON_HOOK);

            if ($scheduled !== false) {
                $this->logCronAction('scheduled', 'Daily license check scheduled successfully');
            } else {
                $this->logCronAction('schedule_failed', 'Failed to schedule daily license check');
            }
        }
    }

    /**
     * Perform the daily license check.
     * This method is called by WordPress cron.
     */
    public function performDailyLicenseCheck(): void
    {
        $this->logCronAction('started', 'Daily license check started');

        // Get the stored license key
        $license_key = $this->licenseService->getStoredLicenseKey();

        if (!$license_key) {
            $this->logCronAction('no_license', 'No license key found, skipping check');
            $this->updateLastRunTime();
            return;
        }

        try {
            // Perform license status check with forced refresh
            $site_url = untrailingslashit(home_url());
            $result = $this->licenseService->checkLicenseStatus($license_key, $site_url, true);

            if ($result['success']) {
                $status = $result['license_data']['status'] ?? 'unknown';
                $this->logCronAction('success', "License check completed successfully. Status: {$status}");

                // Handle specific license statuses
                $this->handleLicenseStatus($status, $result['license_data']);
            } else {
                $error_message = $result['message'] ?? 'Unknown error';
                $this->logCronAction('failed', "License check failed: {$error_message}");

                // Don't clear license on temporary failures, but log the issue
                $this->handleLicenseCheckFailure($result);
            }
        } catch (\Exception $e) {
            $this->logCronAction('exception', "License check exception: " . $e->getMessage());
        }

        $this->updateLastRunTime();
    }

    /**
     * Handle different license statuses after cron check.
     *
     * @param string $status The license status.
     * @param array $license_data The full license data.
     */
    private function handleLicenseStatus(string $status, array $license_data): void
    {
        switch ($status) {
            case 'expired':
                $this->handleExpiredLicense($license_data);
                break;

            case 'invalid':
            case 'inactive':
                $this->handleInvalidLicense($license_data);
                break;

            case 'valid':
            case 'active':
                $this->handleValidLicense($license_data);
                break;

            default:
                $this->logCronAction('unknown_status', "Unknown license status: {$status}");
                break;
        }
    }

    /**
     * Handle expired license.
     *
     * @param array $license_data The license data.
     */
    private function handleExpiredLicense(array $license_data): void
    {
        $this->logCronAction('expired', 'License has expired');

        // Optionally send admin notification
        $this->maybeNotifyAdmin('expired', $license_data);

        // Set option to show expired notice in admin
        update_option('wpchat_license_expired_notice', time());
    }

    /**
     * Handle invalid/inactive license.
     *
     * @param array $license_data The license data.
     */
    private function handleInvalidLicense(array $license_data): void
    {
        $this->logCronAction('invalid', 'License is invalid or inactive');

        // Optionally send admin notification
        $this->maybeNotifyAdmin('invalid', $license_data);

        // Set option to show invalid notice in admin
        update_option('wpchat_license_invalid_notice', time());
    }

    /**
     * Handle valid license.
     *
     * @param array $license_data The license data.
     */
    private function handleValidLicense(array $license_data): void
    {
        // Clear any existing notices
        delete_option('wpchat_license_expired_notice');
        delete_option('wpchat_license_invalid_notice');

        // Check if license is close to expiration (30 days)
        $expires = $license_data['expires'] ?? '';
        if ($expires && $expires !== 'lifetime') {
            $expires_timestamp = strtotime($expires);
            $thirty_days = 30 * 24 * 60 * 60;

            if ($expires_timestamp && ($expires_timestamp - time()) < $thirty_days) {
                $this->logCronAction('expiring_soon', 'License expires within 30 days');
                $this->maybeNotifyAdmin('expiring_soon', $license_data);
                update_option('wpchat_license_expiring_notice', time());
            } else {
                delete_option('wpchat_license_expiring_notice');
            }
        }
    }

    /**
     * Handle license check failure.
     *
     * @param array $result The failed result.
     */
    private function handleLicenseCheckFailure(array $result): void
    {
        $error_code = $result['error_code'] ?? 'unknown';

        // Count consecutive failures
        $failure_count = get_option('wpchat_license_failure_count', 0) + 1;
        update_option('wpchat_license_failure_count', $failure_count);
        update_option('wpchat_license_last_failure', time());

        // If too many consecutive failures, notify admin
        if ($failure_count >= 3) {
            $this->maybeNotifyAdmin('check_failed', [
                'failure_count' => $failure_count,
                'error_message' => $result['message'] ?? 'Unknown error',
                'error_code' => $error_code
            ]);
        }
    }

    /**
     * Maybe send admin notification for license issues.
     *
     * @param string $type The notification type.
     * @param array $data Additional data for the notification.
     */
    private function maybeNotifyAdmin(string $type, array $data): void
    {
        // Skip if notifications are disabled or in development
        if (defined('WP_DEBUG') && WP_DEBUG) {
            return;
        }

        // Check if we should send notifications (don't spam)
        $last_notification = get_option("wpchat_license_notification_{$type}", 0);
        $notification_interval = 7 * 24 * 60 * 60; // 7 days

        if (time() - $last_notification < $notification_interval) {
            return;
        }

        $admin_email = get_option('admin_email');
        if (!$admin_email) {
            return;
        }

        $subject = $this->getNotificationSubject($type);
        $message = $this->getNotificationMessage($type, $data);

        $sent = wp_mail($admin_email, $subject, $message);

        if ($sent) {
            update_option("wpchat_license_notification_{$type}", time());
            $this->logCronAction('notification_sent', "Admin notification sent for: {$type}");
        } else {
            $this->logCronAction('notification_failed', "Failed to send admin notification for: {$type}");
        }
    }

    /**
     * Get notification subject based on type.
     *
     * @param string $type The notification type.
     * @return string The email subject.
     */
    private function getNotificationSubject(string $type): string
    {
        $site_name = get_bloginfo('name');

        switch ($type) {
            case 'expired':
                /* translators: %s: Site name */
                return sprintf(__('[%s] WPChat Pro License Expired', 'smashballoon-wpchat-livechat-customer-support'), $site_name);
            case 'invalid':
                /* translators: %s: Site name */
                return sprintf(__('[%s] WPChat Pro License Invalid', 'smashballoon-wpchat-livechat-customer-support'), $site_name);
            case 'expiring_soon':
                /* translators: %s: Site name */
                return sprintf(__('[%s] WPChat Pro License Expiring Soon', 'smashballoon-wpchat-livechat-customer-support'), $site_name);
            case 'check_failed':
                /* translators: %s: Site name */
                return sprintf(__('[%s] WPChat Pro License Check Failed', 'smashballoon-wpchat-livechat-customer-support'), $site_name);
            default:
                /* translators: %s: Site name */
                return sprintf(__('[%s] WPChat Pro License Notice', 'smashballoon-wpchat-livechat-customer-support'), $site_name);
        }
    }

    /**
     * Get notification message based on type.
     *
     * @param string $type The notification type.
     * @param array $data Additional data for the message.
     * @return string The email message.
     */
    private function getNotificationMessage(string $type, array $data): string
    {
        $site_url = home_url();
        $admin_url = admin_url('admin.php?page=wpchat-settings');

        switch ($type) {
            case 'expired':
                /* translators: 1: Site URL, 2: Expiration date, 3: Admin URL */
                return sprintf(
                    __("Your WPChat Pro license has expired.\n\nSite: %1\$s\nExpired on: %2\$s\n\nPlease renew your license to continue receiving updates and support.\n\nManage your license: %3\$s", 'smashballoon-wpchat-livechat-customer-support'),
                    $site_url,
                    isset($data['expires']) ? date_i18n(get_option('date_format'), strtotime($data['expires'])) : 'Unknown',
                    $admin_url
                );

            case 'invalid':
                /* translators: 1: Site URL, 2: Admin URL */
                return sprintf(
                    __("Your WPChat Pro license is invalid or inactive for this site.\n\nSite: %1\$s\n\nPlease check your license key or contact support if you believe this is an error.\n\nManage your license: %2\$s", 'smashballoon-wpchat-livechat-customer-support'),
                    $site_url,
                    $admin_url
                );

            case 'expiring_soon':
                /* translators: 1: Site URL, 2: Expiration date, 3: Admin URL */
                return sprintf(
                    __("Your WPChat Pro license will expire soon.\n\nSite: %1\$s\nExpires on: %2\$s\n\nPlease renew your license before it expires to avoid service interruption.\n\nManage your license: %3\$s", 'smashballoon-wpchat-livechat-customer-support'),
                    $site_url,
                    isset($data['expires']) ? date_i18n(get_option('date_format'), strtotime($data['expires'])) : 'Unknown',
                    $admin_url
                );

            case 'check_failed':
                /* translators: 1: Site URL, 2: Failure count, 3: Error message, 4: Admin URL */
                return sprintf(
                    __("WPChat Pro license check has failed multiple times.\n\nSite: %1\$s\nFailure count: %2\$d\nLast error: %3\$s\n\nThis may indicate a connectivity issue or problem with the licensing server.\n\nManage your license: %4\$s", 'smashballoon-wpchat-livechat-customer-support'),
                    $site_url,
                    $data['failure_count'] ?? 0,
                    $data['error_message'] ?? 'Unknown error',
                    $admin_url
                );

            default:
                /* translators: 1: Site URL, 2: Admin URL */
                return sprintf(
                    __("There is an issue with your WPChat Pro license.\n\nSite: %1\$s\n\nPlease check your license status in the admin panel.\n\nManage your license: %2\$s", 'smashballoon-wpchat-livechat-customer-support'),
                    $site_url,
                    $admin_url
                );
        }
    }

    /**
     * Update the last run time option.
     */
    private function updateLastRunTime(): void
    {
        update_option(self::LAST_RUN_OPTION, time());
    }

    /**
     * Get the last run time.
     *
     * @return int The timestamp of the last run, or 0 if never run.
     */
    public function getLastRunTime(): int
    {
        return (int) get_option(self::LAST_RUN_OPTION, 0);
    }

    /**
     * Manually trigger a license check (for testing or immediate updates).
     *
     * @return array The result of the license check.
     */
    public function manualLicenseCheck(): array
    {
        $this->logCronAction('manual_check', 'Manual license check triggered');

        // Reset failure count for manual checks
        delete_option('wpchat_license_failure_count');
        delete_option('wpchat_license_last_failure');

        $this->performDailyLicenseCheck();

        return [
            'success' => true,
            'message' => __('Manual license check completed.', 'smashballoon-wpchat-livechat-customer-support'),
            'last_run' => $this->getLastRunTime()
        ];
    }


    /**
     * Unschedule the cron event.
     */
    public function unscheduleCron(): void
    {
        $timestamp = wp_next_scheduled(self::CRON_HOOK);
        if ($timestamp) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
            $this->logCronAction('unscheduled', 'Daily license check unscheduled');
        }
    }

    /**
     * Log cron actions for debugging.
     *
     * @param string $action The action performed.
     * @param string $message Additional message.
     */
    private function logCronAction(string $action, string $message): void
    {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $log_message = sprintf(
            '[WPChat License Cron] Action: %s | Message: %s | Time: %s',
            $action,
            $message,
            current_time('Y-m-d H:i:s')
        );

        Logger::error($log_message);
    }
}
