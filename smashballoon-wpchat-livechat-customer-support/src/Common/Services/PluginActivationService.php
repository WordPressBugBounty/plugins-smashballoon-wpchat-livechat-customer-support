<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Services\Database\MigratorService;


/**
 * PluginActivationService
 *
 * This class is used to define and register the plugin activation hook.
 */
class PluginActivationService implements ServiceProviderInterface
{
	/**
	 * The migrator service instance (free or Pro).
	 *
	 * @var MigratorService
	 */
	private MigratorService $migrator;

	/**
	 * Constructor.
	 *
	 * @param MigratorService $migrator The migrator service instance (free or Pro).
	 */
	public function __construct(MigratorService $migrator)
	{
		$this->migrator = $migrator;
	}

	/**
	 * Register the plugin activation hook.
	 *
	 * @inheritDoc
	 */
	public function register(): void
	{
		register_activation_hook(WPCHAT_PLUGIN_FILE, [$this, 'activate']);
		add_action('admin_init', [$this, 'redirectAfterActivation']);
		add_action('activated_plugin', [$this, 'deactivateOtherInstances']);
		add_action('pre_current_active_plugins', [$this, 'pluginDeactivatedNotice']);
	}

	/**
	 * This method is called when the plugin is activated.
	 *
	 * @return void
	 */
	public function activate(): void
	{
		// Clear the migrations verified transient to force a check
		// This ensures migrations run when switching from Free to Pro or on fresh activation
		delete_transient('wpchat_pro_migrations_verified');

		$this->migrator->migrate();
		$this->registerCapabilities();

		// Trigger plugin activation hook for other services.
		do_action('wpchat_plugin_activated');

		// Set redirect flag.
		set_transient('wpchat_activation_redirect', true, 30);
	}

	/**
	 * Register the wpchat_admin capability for the administrator role.
	 *
	 * @return void
	 */
	private function registerCapabilities(): void
	{
		$admin_role = get_role('administrator');
		if ($admin_role && !$admin_role->has_cap('wpchat_admin')) {
			$admin_role->add_cap('wpchat_admin');
		}
	}

	/**
	 * Redirect to WPChat admin page after activation.
	 *
	 * @return void
	 */
	public function redirectAfterActivation(): void
	{
		if (get_transient('wpchat_activation_redirect')) {
			delete_transient('wpchat_activation_redirect');
			wp_safe_redirect(admin_url('admin.php?page=wp-chat'));
			exit;
		}
	}

	/**
	 * Checks if another version of WPChat (Free/Pro) is active and deactivates it.
	 * To be hooked on `activated_plugin` so other plugin is deactivated when current plugin is activated.
	 *
	 * @param string $plugin The plugin being activated.
	 * @return void
	 */
	public function deactivateOtherInstances($plugin): void
	{
		// Only process if it's one of our plugins being activated
		if (!in_array(basename($plugin), array('wp-chat-pro.php', 'wp-chat.php'))) {
			return;
		}

		$plugin_to_deactivate = 'wp-chat.php';
		$deactivated_notice_id = '1';
		
		// If free version is being activated, deactivate pro version
		if (basename($plugin) == 'wp-chat.php') {
			$plugin_to_deactivate = 'wp-chat-pro.php';
			$deactivated_notice_id = '2';
		}

		// Get active plugins
		if (is_multisite()) {
			$active_plugins = (array) get_site_option('active_sitewide_plugins', array());
			$active_plugins = array_keys($active_plugins);
		} else {
			$active_plugins = (array) get_option('active_plugins', array());
		}

		// Find and deactivate the conflicting plugin
		foreach ($active_plugins as $basename) {
			if (false !== strpos($basename, $plugin_to_deactivate)) {
				// Set transient for admin notice
				set_transient('wpchat_deactivated_notice_id', $deactivated_notice_id, 1 * HOUR_IN_SECONDS);
				
				// Deactivate the conflicting plugin
				deactivate_plugins($basename);
				
				return;
			}
		}
	}

	/**
	 * Display a notice when either WPChat Free or WPChat Pro is automatically deactivated.
	 *
	 * @return void
	 */
	public function pluginDeactivatedNotice(): void
	{
		$deactivated_notice_id = get_transient('wpchat_deactivated_notice_id');
		
		if (false !== $deactivated_notice_id) {
			if ('1' === $deactivated_notice_id) {
				$message = __("WPChat Free and WPChat Pro cannot both be active. We've automatically deactivated WPChat Free.", 'smashballoon-wpchat-livechat-customer-support');
			} else {
				$message = __("WPChat Free and WPChat Pro cannot both be active. We've automatically deactivated WPChat Pro.", 'smashballoon-wpchat-livechat-customer-support');
			}
			?>
			<div class="notice notice-warning is-dismissible" style="border-left: 4px solid #ffba00;">
				<p><?php echo esc_html($message); ?></p>
			</div>
			<?php

			delete_transient('wpchat_deactivated_notice_id');
		}
	}
}
