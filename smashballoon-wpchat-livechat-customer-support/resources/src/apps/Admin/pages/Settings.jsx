import React, { useEffect, useState, Suspense, lazy } from 'react';
import Card from '@AC/Card';
import Separator from '@AC/Separator';
import { Button } from '@AC/ui/Button';
import { Switch } from '@AC/ui/Switch';
import { TextField } from '@AC/ui/TextField';
import { Toast } from '@AC/ui/Toast';
import { HideOnDesktop, HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';
import useSettingsStore from '@DataStore/settings/settingsStore';
import useNotificationsStore from '@DataStore/notifications/notificationsStore';
import useLicenseStore from '@DataStore/license/licenseStore';
import SettingsSkeleton from '@AC/Settings/SettingsSkeleton';
import UpgradeProgress from '../components/UpgradeProgress';
import { cn } from '@Utils/cn';
import { isPro } from '@Utils/isPro';
import { __ } from '@wordpress/i18n';

const PageLayout = lazy(() => import('@AC/PageLayout'));

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const statusConfig = {
  [STATUS.IDLE]: {
    icon: 'networkSensors',
    text: __('Test connection', 'smashballoon-wpchat-livechat-customer-support'),
    color: 'wpchat:[&_svg]:fill-gray-500',
  },
  [STATUS.LOADING]: {
    icon: 'networkSensors',
    text: __('Testing...', 'smashballoon-wpchat-livechat-customer-support'),
    color: 'wpchat:[&_svg]:fill-gray-500',
  },
  [STATUS.SUCCESS]: {
    icon: 'checkCircleSolid',
    text: __('Connection Successful', 'smashballoon-wpchat-livechat-customer-support'),
    color: 'wpchat:[&_svg]:fill-green-600',
  },
  [STATUS.ERROR]: {
    icon: 'warningSolid',
    text: __('Connection Failed', 'smashballoon-wpchat-livechat-customer-support'),
    color: 'wpchat:[&_svg]:fill-red-600',
  },
};

export default function Support() {
  const { settings, fetchSettings, saveSettings } = useSettingsStore();
  const {
    licenseKey,
    status: licenseStatus,
    isActive,
    isLoading,
    error: licenseError,
    isActivating,
    isDeactivating,
    isRefreshing,
    isUpgrading,
    upgradeProgress,
    setLicenseKey,
    activateLicense,
    deactivateLicense,
    checkLicenseStatus,
    clearError,
    getStatusDisplay,
    getExpirationInfo,
    getManageLicenseUrl,
    initializeLicense
  } = useLicenseStore();

  const [status, setStatus] = useState(STATUS.IDLE);
  const [preserveSettings, setPreserveSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dataSharingConsent, setDataSharingConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  // Initialize license store on component mount
  useEffect(() => {
    initializeLicense();
    fetchSettings();
  }, [initializeLicense, fetchSettings]);

  // Helper function to mask license key with stars
  const getMaskedLicenseKey = (key) => {
    if (!key || key.length <= 8) {
      return key;
    }
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  };

  // Get the display value for the license key field
  const getLicenseKeyDisplayValue = () => {
    if (isActive && licenseKey) {
      return getMaskedLicenseKey(licenseKey);
    }
    return licenseKey;
  };

  useEffect(() => {
    if (settings) {
      setPreserveSettings(settings.preserveSettings);
      setNotificationsEnabled(settings.notificationsEnabled ?? false);
      setDataSharingConsent(settings.dataSharingConsent ?? false);
    }
  }, [settings]);

  // Get badge data based on license status
  const getBadgeData = () => {
    if (!isPro) {
      return { badgeType: 'default', badgeText: __('Lite', 'smashballoon-wpchat-livechat-customer-support') };
    }

    const statusDisplay = getStatusDisplay();
    const badgeTypeMap = {
      'success': 'success',
      'warning': 'warning',
      'danger': 'danger',
      'default': 'default'
    };

    return {
      badgeType: badgeTypeMap[statusDisplay.type] || 'default',
      badgeText: __(statusDisplay.text, 'smashballoon-wpchat-livechat-customer-support')
    };
  };

  const handleConnectionTest = async () => {
    setStatus(STATUS.LOADING);

    try {
      // Try to check license status - any response (even error) means connection works
      const response = await checkLicenseStatus(true); // Force refresh to test actual connection

      // If we get any response back, the connection is working
      setStatus(STATUS.SUCCESS);
    } catch (error) {
      // Check if it's a network/500 error vs other API errors
      const isNetworkError = error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('500') ||
        error.message?.includes('server') ||
        !error.message; // Empty message often indicates network failure

      if (isNetworkError) {
        setStatus(STATUS.ERROR);
      } else {
        // API responded with an error, but connection is working
        setStatus(STATUS.SUCCESS);
      }
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...settings,
        preserveSettings: preserveSettings,
        dataSharingConsent: dataSharingConsent,
        notificationsEnabled: dataSharingConsent ? true : notificationsEnabled,
      };

      await saveSettings(payload);

      window.wpChatAdmin.notificationsEnabled = payload.notificationsEnabled;
      window.wpChatAdmin.dataSharingConsent = dataSharingConsent;
      window.dispatchEvent(new Event('wpchat:settings-updated'));

      if (payload.notificationsEnabled) {
        useNotificationsStore.getState().refetch();
      }

      setToast({
        show: true,
        message: __('Settings saved successfully', 'smashballoon-wpchat-livechat-customer-support'),
      });
    } catch (error) {
      setToast({
        show: true,
        message: __('[WPC-SET-001] Failed to save settings', 'smashballoon-wpchat-livechat-customer-support'),
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    // Clear any previous errors
    clearError();

    // If license is currently active, deactivate it
    if (isActive) {
      try {
        await deactivateLicense();
        setToast({
          show: true,
          message: __('License deactivated successfully', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'success'
        });
      } catch (error) {
        setToast({
          show: true,
          message: error.message || __('[WPC-LIC-003] Failed to deactivate license', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'error'
        });
      }
      return;
    }

    // Validate license key
    const trimmedKey = licenseKey.trim();
    if (!trimmedKey) {
      setToast({
        show: true,
        message: __('Please enter a license key', 'smashballoon-wpchat-livechat-customer-support')
      });
      return;
    }

    // Activate license
    try {
      const result = await activateLicense(trimmedKey);

      // Check if upgrade is happening
      if (result.data?.download_url && window.wpchatLicense?.is_lite) {
        setToast({
          show: true,
          message: __('Upgrading to WPChat Pro...', 'smashballoon-wpchat-livechat-customer-support')
        });
      } else {
        setToast({
          show: true,
          message: __('License activated successfully', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'success'
        });
      }
    } catch (error) {
      setToast({
        show: true,
        message: error.message || __('[WPC-LIC-002] Failed to activate license', 'smashballoon-wpchat-livechat-customer-support'),
        type: 'error'
      });
    }
  };

  const getLicenseButtonLabel = () => {
    const isLiteVersion = window.wpchatLicense?.is_lite;

    if (isUpgrading) {
      return __('Upgrading to Pro...', 'smashballoon-wpchat-livechat-customer-support');
    }
    if (isActivating) {
      return isLiteVersion
        ? __('Upgrading to Pro...', 'smashballoon-wpchat-livechat-customer-support')
        : __('Activating...', 'smashballoon-wpchat-livechat-customer-support');
    }
    if (isDeactivating) {
      return __('Deactivating...', 'smashballoon-wpchat-livechat-customer-support');
    }
    if (isActive) {
      return __('Deactivate', 'smashballoon-wpchat-livechat-customer-support');
    }
    return isLiteVersion
      ? __('Upgrade', 'smashballoon-wpchat-livechat-customer-support')
      : __('Activate', 'smashballoon-wpchat-livechat-customer-support');
  };

  const handleManageLicense = async () => {
    // For active licenses, get secure URL with license key
    if (isActive) {
      try {
        const manageLicenseUrl = await getManageLicenseUrl();
        window.open(manageLicenseUrl, '_blank');
        return;
      } catch (error) {
        console.error('Failed to get manage license URL:', error);
      }
    }

    // For inactive licenses or API failures, use basic manage license page
    const fallbackUrl = window.wpChatAdmin?.urls?.manageLicense || window.wpChatAdmin?.storeUrl || 'https://wpchat.com';
    window.open(fallbackUrl, '_blank');
  };

  const handleRefreshLicense = async () => {
    try {
      await checkLicenseStatus(true); // Force refresh
      setToast({
        show: true,
        message: __('License status refreshed', 'smashballoon-wpchat-livechat-customer-support'),
        type: 'success'
      });
    } catch (error) {
      setToast({
        show: true,
        message: error.message || __('[WPC-LIC-004] Failed to refresh license status', 'smashballoon-wpchat-livechat-customer-support'),
        type: 'error'
      });
    }
  };

  const HeaderButtons = () => (
    <div className='wpchat:flex wpchat:gap-3'>
      <Button onPress={handleSaveChanges} isLoading={isSaving}>
        <HideOnMobile>{__('Save Changes', 'smashballoon-wpchat-livechat-customer-support')}</HideOnMobile>
        <HideOnDesktop>{__('Save', 'smashballoon-wpchat-livechat-customer-support')}</HideOnDesktop>
      </Button>
    </div>
  );

  const { icon, text, color } = statusConfig[status];
  const badgeData = getBadgeData();

  return (
     <Suspense fallback={<SettingsSkeleton />}>
    <PageLayout
      className='wpchat:max-w-[752px]'
      breadcrumb={[{ label: __('Settings', 'smashballoon-wpchat-livechat-customer-support') }]}
      HeaderButtons={HeaderButtons}
    >
      <Card>
        <TitleDescription
          title={__('License Key', 'smashballoon-wpchat-livechat-customer-support')}
          badgeType={badgeData.badgeType}
          badgeText={badgeData.badgeText}
          description={
            !isPro ? (
              <>
                <p>
                  {__(
                    'You are using the Lite version of the plugin – no license needed. Enjoy!',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}
                </p>
                <p>
                  {__(
                    'To unlock more features, consider',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}{' '}
                  <a
                    href={window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing'}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='wpchat:text-wp-blue-500 wpchat:font-semibold wpchat:underline'
                  >
                    {__('Upgrading to Pro', 'smashballoon-wpchat-livechat-customer-support')}
                  </a>{' '}
                  {__(
                    ' . As a valued user of our Lite plugin, you receive a 50% OFF, automatically applied at checkout!',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}
                </p>
                <Separator style='dashed' className='wpchat:mt-5 wpchat:mb-5' />
                <p>
                  {__(
                    'Already purchased? Enter your license key to upgrade to WPChat Pro.',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}
                </p>
              </>
            ) : (
              __(
                'Your license key provides access to updates and support',
                'smashballoon-wpchat-livechat-customer-support',
              )
            )
          }
        />

        <div className='wpchat:flex wpchat:flex-wrap wpchat:items-start wpchat:gap-1.5 wpchat:pb-8'>
          <div className='wpchat:min-w-[200px] wpchat:flex-1'>
            <TextField
              name='license-key'
              type='text'
              placeholder={__('Enter license key', 'smashballoon-wpchat-livechat-customer-support')}
              onChange={(value) => {
                setLicenseKey(value);
                clearError();
              }}
              value={getLicenseKeyDisplayValue()}
              variant={
                isActive ? 'success' : licenseError ? 'error' : ''
              }
              inputClassName='wpchat:w-full'
              isRequired
              isDisabled={isActive}
              errorMessage={licenseError}
              isInvalid={!!licenseError}
              icon={
                isActivating || isDeactivating
                  ? 'cloud'
                  : isActive
                    ? 'check'
                    : licenseError
                      ? 'warning'
                      : ''
              }
            />
          </div>

          <div className='wpchat:w-[100%] wpchat:flex-shrink-0 wpchat:md:w-auto'>
            <Button
              className='wpchat:w-[100%] wpchat:justify-center wpchat:md:w-auto'
              onPress={handleActivate}
              variant={
                isActive
                  ? 'error'
                  : (isActivating || isDeactivating || isUpgrading)
                    ? 'secondary'
                    : 'primary'
              }
              isDisabled={isActivating || isDeactivating || isUpgrading || isLoading}
              icon={(isActivating || isDeactivating || isUpgrading) ? 'cloudSync' : ''}
            >
              {getLicenseButtonLabel()}
            </Button>
          </div>

          <div className='wpchat:w-[100%] wpchat:flex-shrink-0 wpchat:md:w-auto'>
            <Button
              onPress={handleManageLicense}
              variant='secondary'
              className='wpchat:w-[100%] wpchat:justify-center wpchat:md:w-auto'
            >
              {__('Manage License', 'smashballoon-wpchat-livechat-customer-support')}
              <SvgLoader name='topRightArrow' className='wpchat:h-[1.5em] wpchat:w-[1.5em]' />
            </Button>
          </div>
        </div>

        {/* Upgrade Progress */}
        {isUpgrading && (
          <div className="wpchat:mt-4 wpchat:mb-6">
            <UpgradeProgress
              isActive={isUpgrading}
              realProgress={upgradeProgress}
            />
          </div>
        )}

        <div className='wpchat:-mx-8 wpchat:-mb-6 wpchat:flex wpchat:border-t wpchat:border-gray-200'>
          <Button
            onPress={handleConnectionTest}
            variant='secondary'
            className={cn(
              'wpchat:justify-center wpchat:border-0 wpchat:shadow-none wpchat:flex-1',
              // Make full width when upgrade button is hidden, otherwise 50%
              (!window.wpChatAdmin?.productName?.includes('Elite') || !isActive) ? 'wpchat:w-[50%]' : 'wpchat:w-full',
              color,
              (status === STATUS.SUCCESS || status === STATUS.ERROR) && 'wpchat:cursor-default',
            )}
          >
            <SvgLoader name={icon} className='wpchat:h-[1.15em] wpchat:w-[1.15em]' />
            {text}
            {(status === STATUS.SUCCESS || status === STATUS.ERROR) && (
              <span onClick={handleConnectionTest} className='wpchat:p-.5 wpchat:cursor-pointer'>
                <SvgLoader
                  name='rotate'
                  className='wpchat:!fill-wp-blue-500 wpchat:bg-wp-blue-50 wpchat:h-[1.15em] wpchat:w-[1.15em] wpchat:rounded-sm'
                />
              </span>
            )}
          </Button>
          {(!window.wpChatAdmin?.productName?.includes('Elite') || !isActive) && (
            <Button
              onPress={() => {
                const pricingUrl = window.wpChatAdmin?.urls?.pricing || 'https://wpchat.com/pricing';
                window.open(pricingUrl, '_blank');
              }}
              variant='secondary'
              className='wpchat:text-admin-1 wpchat:[&_svg]:fill-admin-1 wpchat:w-[50%] wpchat:justify-center wpchat:border-0 wpchat:shadow-none'
            >
              <SvgLoader name='arrowUpLoading' className='wpchat:h-[1.5em] wpchat:w-[1.5em]' />
              {__('Upgrade', 'smashballoon-wpchat-livechat-customer-support')}
            </Button>
          )}
        </div>
      </Card>

      <Card className='wpchat:pt-6 wpchat:pb-7'>
        <div className='wpchat:flex wpchat:justify-between wpchat:gap-5 wpchat:items-start'>
          <TitleDescription
            className='wpchat:mb-0'
            title={__(
              'Preserve settings if plugin is removed',
              'smashballoon-wpchat-livechat-customer-support',
            )}
            titleClassName='wpchat:text-base wpchat:leading-[1.6]'
            description={__(
              'This will make sure that all of your chatbot data and settings are still saved even if the plugin is uninstalled',
              'smashballoon-wpchat-livechat-customer-support',
            )}
            descriptionClassName='wpchat:text-gray-700 wpchat:max-w-[395px] wpchat:leading-[1.6] wpchat:mb-0'
          />
          <Switch
            isSelected={preserveSettings}
            onChange={setPreserveSettings}
          />
        </div>
      </Card>

      {/*
        Lite users choose whether to share data / receive in-plugin notifications.
        Pro always opts in (enforced on the backend, see SettingsService), so the
        toggles are replaced with a read-only notice explaining what is collected.
      */}
      {!isPro ? (
        <>
          <Card className='wpchat:pt-6 wpchat:pb-7'>
            <div className='wpchat:flex wpchat:justify-between wpchat:gap-5 wpchat:items-start'>
              <div className='wpchat:flex wpchat:flex-col wpchat:gap-3.5'>
                <TitleDescription
                  className='wpchat:mb-0'
                  title={__(
                    'Data sharing consent',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}
                  titleClassName='wpchat:text-base wpchat:leading-[1.6]'
                  description={__(
                    'Share anonymised usage data with WPChat and Smash Balloon to help improve our products.',
                    'smashballoon-wpchat-livechat-customer-support',
                  )}
                  descriptionClassName='wpchat:text-gray-700 wpchat:max-w-[395px] wpchat:leading-[1.6] wpchat:mb-0'
                />
                <div className='wpchat:flex wpchat:flex-col wpchat:gap-1 wpchat:md:flex-row wpchat:md:gap-4 wpchat:text-xs wpchat:text-wp-blue-500'>
                  <a href={window.wpChatAdmin?.urls?.legalLinks?.permissions} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                    {__('What permissions are being granted?', 'smashballoon-wpchat-livechat-customer-support')}
                  </a>
                  <a href={window.wpChatAdmin?.urls?.legalLinks?.terms} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                    {__('Terms & Conditions', 'smashballoon-wpchat-livechat-customer-support')}
                  </a>
                  <a href={window.wpChatAdmin?.urls?.legalLinks?.privacy} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                    {__('Privacy', 'smashballoon-wpchat-livechat-customer-support')}
                  </a>
                </div>
              </div>
              <Switch
                isSelected={dataSharingConsent}
                onChange={(val) => {
                  setDataSharingConsent(val);
                  if (val) {
                    setNotificationsEnabled(true);
                  }
                }}
              />
            </div>
          </Card>

          <Card className='wpchat:pt-6 wpchat:pb-7'>
            <div className='wpchat:flex wpchat:justify-between wpchat:gap-5 wpchat:items-start'>
              <TitleDescription
                className='wpchat:mb-0'
                title={__(
                  'In-plugin notifications',
                  'smashballoon-wpchat-livechat-customer-support',
                )}
                titleClassName='wpchat:text-base wpchat:leading-[1.6]'
                description={
                  dataSharingConsent
                    ? __(
                        'Receive notifications about WPChat updates, fixes, and new features. This is enabled, if you opt into telemetry.',
                        'smashballoon-wpchat-livechat-customer-support',
                      )
                    : __(
                        'Receive important updates, tips, and announcements directly within the plugin dashboard',
                        'smashballoon-wpchat-livechat-customer-support',
                      )
                }
                descriptionClassName='wpchat:text-gray-700 wpchat:max-w-[395px] wpchat:leading-[1.6] wpchat:mb-0'
              />
              <Switch
                isSelected={dataSharingConsent ? true : notificationsEnabled}
                onChange={setNotificationsEnabled}
                isDisabled={dataSharingConsent}
              />
            </div>
          </Card>
        </>
      ) : (
        <Card className='wpchat:pt-6 wpchat:pb-7'>
          <div className='wpchat:flex wpchat:flex-col wpchat:gap-3.5'>
            <TitleDescription
              className='wpchat:mb-0'
              title={__(
                'Data sharing',
                'smashballoon-wpchat-livechat-customer-support',
              )}
              titleClassName='wpchat:text-base wpchat:leading-[1.6]'
              description={__(
                "To keep your WPChat and Smash Balloon plugins secure and up to date, we collect limited, anonymised usage data. We never collect your chat content or your visitors' personal information. We'll also send you occasional in-plugin notifications about updates, fixes, and new features.",
                'smashballoon-wpchat-livechat-customer-support',
              )}
              descriptionClassName='wpchat:text-gray-700 wpchat:leading-[1.6] wpchat:mb-0 wpchat:max-w-none'
            />
            <div className='wpchat:flex wpchat:flex-col wpchat:gap-1 wpchat:md:flex-row wpchat:md:gap-4 wpchat:text-xs wpchat:text-wp-blue-500'>
              <a href={window.wpChatAdmin?.urls?.legalLinks?.permissions} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                {__('What data is collected?', 'smashballoon-wpchat-livechat-customer-support')}
              </a>
              <a href={window.wpChatAdmin?.urls?.legalLinks?.terms} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                {__('Terms & Conditions', 'smashballoon-wpchat-livechat-customer-support')}
              </a>
              <a href={window.wpChatAdmin?.urls?.legalLinks?.privacy} target='_blank' rel='noopener noreferrer' className='wpchat:text-wp-blue-500 wpchat:hover:text-wp-blue-600'>
                {__('Privacy', 'smashballoon-wpchat-livechat-customer-support')}
              </a>
            </div>
          </div>
        </Card>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </PageLayout>
    </Suspense>
  );
}
