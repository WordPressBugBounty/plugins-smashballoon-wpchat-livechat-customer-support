<?php

namespace SmashBalloon\WPChat\Common\Services;

use SmashBalloon\WPChat\Common\Helpers\Logger;
use SmashBalloon\WPChat\Common\Helpers\Utility;

use SmashBalloon\WPChat\Common\Contracts\ServiceProviderInterface;
use SmashBalloon\WPChat\Common\Repositories\OptionsRepository;
use SmashBalloon\WPChat\Common\Services\Database\AgentsService;
use SmashBalloon\WPChat\Common\Services\SettingsMigrationService;

/**
 * Class SettingsService
 *
 * @package WPChat\Common\Services
 */
class SettingsService implements ServiceProviderInterface {

	/**
	 * The repository instance used for managing settings data.
	 *
	 * @var mixed $repository The repository instance used for managing settings data.
	 */
	private $repository;

	/**
	 * The agents service instance.
	 *
	 * @var AgentsService $agentsService The agents service instance.
	 */
	private $agentsService;

	/**
	 * The settings migration service instance.
	 *
	 * @var SettingsMigrationService $settingsMigration The settings migration service instance.
	 */
	private $settingsMigration;

	/**
	 * Constructor for the SettingsService class.
	 *
	 * @param OptionsRepository        $repository The repository instance used to manage options.
	 * @param AgentsService            $agentsService The agents service instance.
	 * @param SettingsMigrationService $settingsMigration The settings migration service instance.
	 */
	public function __construct(
		OptionsRepository $repository,
		AgentsService $agentsService,
		SettingsMigrationService $settingsMigration
	) {
		$this->repository = $repository;
		$this->agentsService = $agentsService;
		$this->settingsMigration = $settingsMigration;
	}

	/**
	 * @inheritDoc
	 */
	public function register(): void {
	}

	/**
	 * Retrieves all chat service settings, merging stored values with defaults.
	 *
	 * @return array Associative array of chat service settings.
	 */
	public function getAllSettings(): array {
		$isPro = Utility::isProBuild();
		$defaults = array(
			'onboardingStatus' => false,
			'proUpsellStatus' => false,
			'preserveSettings' => false,
			'smartSearchEnabled' => true,
			'claimOfferTokenAmount' => 5000,
			'notificationsEnabled' => $isPro,
			'dataSharingConsent' => $isPro,
			'dataSharingConsentDismissed' => false,
			'agentSettings' => array(
				'timings' => false,
				'platforms' => array(
					'whatsapp'  => array(
						'enabled' => true,
						'value'   => '',
					),
					'telegram'  => array(
						'enabled' => true,
						'value'   => '',
					),
					'instagram' => array(
						'enabled' => true,
						'value'   => '',
					),
					'messenger' => array(
						'enabled' => true,
						'value'   => '',
					),
					'sms'       => array(
						'enabled' => false,
						'value'   => '',
					),
					'phone'     => array(
						'enabled' => false,
						'value'   => '',
					),
				),
				'offHoursRule' => 'disable',
				'selectedOffHoursAgent' => '',
			),
			'visibilitySettings' => array(
				'mode' => 'include',
				'include' => array(
					'pages' => array(),
					'categories' => array(),
					'tags' => array(),
					'postTypes' => array()
				),
				'exclude' => array(
					'pages' => array(),
					'categories' => array(),
					'tags' => array(),
					'postTypes' => array()
				)
			),
			'customizerSettings' => array(
				'theme' => 'basic',
				'chatToggleIcon' => 'chatBubbleLogo',
				'headerHeading' => __( 'How can we help you?', 'smashballoon-wpchat-livechat-customer-support' ),
				'sendMessageHeading' => __( 'Send us a message', 'smashballoon-wpchat-livechat-customer-support' ),
				'sendMessageSubHeading' => __( 'on a platform of your choice', 'smashballoon-wpchat-livechat-customer-support' ),
				'faqHeading' => __( 'Frequently Asked Questions', 'smashballoon-wpchat-livechat-customer-support' ),
				'chatbotAvatar' => 'wpChat',
				'chatbotName' => 'WPChat',
				'chatbotCustomAvatar' => '',
				'chatbotCustomName' => '',
				'brandColor' => 22,
				'reorderableKeys' => array('sendMessage', 'frequentQuestions', 'wpChatBranding'),
				'visibleMap' => array(
					'sendMessage' => true,
					'frequentQuestions' => true,
					'wpChatBranding' => true,
				),
				'chatInputVariation' => 'primary',
				'iconType' => 'platform',
				'sendMessageIcon' => true,
				'iconShape' => 'circle',
				'iconPosition' => 'right',
				'iconPositionOffsetX' => 0,
				'iconPositionOffsetY' => 0,
				'iconAnimation' => 'none',
				'platformOrder' => null,
				'platformVisibility' => null,
			),
		);
		$stored_settings = $this->repository->getSettings();
		$merged_settings = wp_parse_args( $stored_settings, $defaults );

		$merged_settings = $this->settingsMigration->migrate( $merged_settings, $stored_settings );

		// Normalize platforms to new format - idempotent, runs on every read
		// TODO: Remove this migration code in version 3.0.0
		$merged_settings = $this->normalizePlatformsStructure( $merged_settings, $stored_settings );

		// Pro always opts into telemetry and in-plugin notifications. Override at
		// read time only - the stored option is left exactly as the user set it
		// (see updateSettings()/updateSetting(), which ignore writes to these keys
		// for Pro), so downgrading restores the previous choice.
		if ( $isPro ) {
			$merged_settings['dataSharingConsent']  = true;
			$merged_settings['notificationsEnabled'] = true;
		}

		return $merged_settings;
	}

	/**
	 * Normalizes platforms to new format if needed.
	 *
	 * Handles migration from:
	 * - Old format: { whatsapp: true } + whatsAppPhoneNumber field
	 * - New format: { whatsapp: { enabled: true, value: '+123' } }
	 *
	 * TODO: Remove in v3.0.0 after all users have migrated.
	 *
	 * @param array $settings The merged settings array.
	 * @param array $stored   The raw stored settings (to check for legacy whatsAppPhoneNumber).
	 * @return array Normalized settings.
	 */
	private function normalizePlatformsStructure(array $settings, array $stored): array {
		if ( ! isset( $settings['agentSettings']['platforms'] ) ) {
			return $settings;
		}

		$legacyWhatsApp = isset( $stored['whatsAppPhoneNumber'] ) ? $stored['whatsAppPhoneNumber'] : '';
		$platforms = $settings['agentSettings']['platforms'];

		// Quick check: skip if already normalized and no legacy data
		if ( ! $legacyWhatsApp && $this->isPlatformsNormalized( $platforms ) ) {
			return $settings;
		}

		// Normalize each platform
		$normalized = array();
		foreach ( $platforms as $id => $platform ) {
			if ( is_array( $platform ) && isset( $platform['enabled'] ) ) {
				$normalized[ $id ] = $platform;
			} elseif ( is_bool( $platform ) ) {
				$normalized[ $id ] = array(
					'enabled' => $platform,
					'value' => ($id === 'whatsapp' && $legacyWhatsApp) ? $legacyWhatsApp : ''
				);
			} else {
				$normalized[ $id ] = array(
'enabled' => false,
'value' => ''
);
			}
		}

		$settings['agentSettings']['platforms'] = $normalized;
		return $settings;
	}

	/**
	 * Checks if all platforms are already in normalized format.
	 *
	 * @param array $platforms The platforms array to check.
	 * @return bool True if all platforms are normalized.
	 */
	private function isPlatformsNormalized(array $platforms): bool {
		foreach ( $platforms as $platform ) {
			if ( ! is_array( $platform ) || ! isset( $platform['enabled'] ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Updates a specific setting with the given key and value.
	 *
	 * This method retrieves the current settings, updates the specified key
	 * with the provided value, and saves the updated settings back to the repository.
	 *
	 * @param string $key The key of the setting to update.
	 * @param mixed  $value The new value to assign to the setting.
	 * @return bool Returns true if the settings were successfully updated, false otherwise.
	 */
	public function updateSetting(string $key, $value): bool {
		// Pro forces these on at read time, so persisting UI changes to them would
		// only desync the stored value from what is actually in effect. No-op.
		if ( Utility::isProBuild() && in_array( $key, array( 'dataSharingConsent', 'notificationsEnabled' ), true ) ) {
			return true;
		}

		$settings = $this->repository->getSettings();
		$settings[ $key ] = $value;

		// Mirror the coupling in updateSettings(): enabling data sharing consent
		// forces in-plugin notifications on, so the single-key endpoint can't
		// leave the two in an inconsistent state.
		if ( 'dataSharingConsent' === $key && true === $value ) {
			$settings['notificationsEnabled'] = true;
		}

		$result = $this->repository->updateSettings( $settings );
		if ( $result ) {
			do_action( 'wpchat_settings_updated', $settings );
		}
		return $result;
	}

	/**
	 * Updates the settings with the provided array of settings.
	 *
	 * @param array $settings An associative array of settings to be updated.
	 *
	 * @return bool Returns true if the settings were successfully updated, false otherwise.
	 */
	public function updateSettings(array $settings): bool {
		$currentSettings = $this->repository->getSettings();

		// Pro forces telemetry + in-plugin notifications on at read time, so never
		// persist UI changes to these keys - the stored value stays exactly as the
		// user left it before upgrading.
		if ( Utility::isProBuild() ) {
			unset( $settings['dataSharingConsent'], $settings['notificationsEnabled'] );
		}

		// If data sharing consent is being enabled, force notifications on.
		if ( isset( $settings['dataSharingConsent'] ) && $settings['dataSharingConsent'] === true ) {
			$settings['notificationsEnabled'] = true;
		}

		// Check if this is the onboarding completion (status changing from false to true).
		if (
			isset( $settings['onboardingStatus'] ) && $settings['onboardingStatus'] === true &&
			( ! isset( $currentSettings['onboardingStatus'] ) || $currentSettings['onboardingStatus'] === false)
		) {
			$this->createDefaultAgent( $settings );
		}

		// Merge with existing settings so partial updates don't overwrite unrelated keys.
		$mergedSettings = array_merge( $currentSettings, $settings );

		$result = $this->repository->updateSettings( $mergedSettings );
		if ( $result ) {
			do_action( 'wpchat_settings_updated', $mergedSettings );
		}
		return $result;
	}

	/**
	 * Deletes all plugin settings from the WordPress options table.
	 *
	 * @return bool Returns true if the settings were successfully deleted, false otherwise.
	 */
	public function deleteSettings(): bool {
		return $this->repository->deleteSettings();
	}

	/**
	 * Creates a default agent if none exists.
	 *
	 * @param array $settings The current settings array.
	 * @return void
	 */
	private function createDefaultAgent(array $settings): void {
		$existingAgents = $this->agentsService->getAllAgents();
		if ( empty( $existingAgents ) ) {
			$siteName = get_bloginfo( 'name' );

			// Build platforms array from agentSettings.platforms.
			$platforms = array();

			if ( isset( $settings['agentSettings']['platforms'] ) && is_array( $settings['agentSettings']['platforms'] ) ) {
				foreach ( $settings['agentSettings']['platforms'] as $platformId => $platform ) {
					// Assume new format: ['enabled' => true, 'value' => '+123']
					if ( isset( $platform['enabled'] ) && $platform['enabled'] && ! empty( $platform['value'] ) ) {
						$platforms[ $platformId ] = $platform['value'];
					}
				}
			}

			// Only create agent if we have at least one platform
			if ( ! empty( $platforms ) ) {
				$defaultAgent = array(
					'name' => $siteName,
					'platforms' => wp_json_encode( $platforms ),
					'status' => 1,
					'avatar' => '',
				);

				$agentId = $this->agentsService->addAgent( $defaultAgent );
				if ( ! $agentId ) {
					// Log the error but don't fail the settings save operation
					Logger::error( 'Failed to create default agent during settings save' );
				}
			}
		}
	}
}
