<?php

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Template Name: Connect Smart Search token
 *
 * Shown after the WPChat API sends the admin back from the verification email. The token itself is
 * never in this page: AdminPagesService parks it for the current admin, and only the POST of this
 * form, with its nonce, saves it (SMASH-2676).
 *
 * @var string $connectState 'confirm' when a token is waiting, 'none' otherwise.
 * @var string $connectId    One-time id of the waiting token; the POST must carry it.
 *
 * @package WPChat
 */

$wpchatAdminUrl = admin_url('admin.php?page=wp-chat');

?>
<div class="wrap">
	<h1><?php esc_html_e('Connect Smart Search', 'smashballoon-wpchat-livechat-customer-support'); ?></h1>
	<?php if ('confirm' === $connectState) : ?>
		<p>
			<?php
			esc_html_e(
				'Connect this site to the WPChat account from your verification email.',
				'smashballoon-wpchat-livechat-customer-support'
			);
			?>
		</p>
		<p>
			<?php
			esc_html_e(
				'Only connect if you just clicked the link in a WPChat email. Otherwise, choose Cancel.',
				'smashballoon-wpchat-livechat-customer-support'
			);
			?>
		</p>
		<form method="post" action="<?php echo esc_url($wpchatAdminUrl); ?>">
			<?php
			wp_nonce_field(
				\SmashBalloon\WPChat\Common\Services\AdminPagesService::CONNECT_TOKEN_NONCE_ACTION,
				'wpchat_connect_nonce'
			);
			?>
			<input type="hidden" name="wpchat_connect_confirm" value="1" />
			<input type="hidden" name="wpchat_connect_id" value="<?php echo esc_attr($connectId); ?>" />
			<p class="submit">
				<button type="submit" class="button button-primary">
					<?php esc_html_e('Connect', 'smashballoon-wpchat-livechat-customer-support'); ?>
				</button>
				<a class="button button-secondary" href="<?php echo esc_url($wpchatAdminUrl); ?>">
					<?php esc_html_e('Cancel', 'smashballoon-wpchat-livechat-customer-support'); ?>
				</a>
			</p>
		</form>
	<?php else : ?>
		<p>
			<?php
			esc_html_e(
				'No Smart Search connection is waiting for this site.',
				'smashballoon-wpchat-livechat-customer-support'
			);
			?>
		</p>
		<p>
			<?php
			esc_html_e(
				'Claim Smart Search in WPChat > Frequent Questions, then open the emailed link within 24 hours.',
				'smashballoon-wpchat-livechat-customer-support'
			);
			?>
		</p>
		<p>
			<a class="button button-primary" href="<?php echo esc_url($wpchatAdminUrl); ?>">
				<?php esc_html_e('Go to WPChat', 'smashballoon-wpchat-livechat-customer-support'); ?>
			</a>
		</p>
	<?php endif; ?>
</div>
