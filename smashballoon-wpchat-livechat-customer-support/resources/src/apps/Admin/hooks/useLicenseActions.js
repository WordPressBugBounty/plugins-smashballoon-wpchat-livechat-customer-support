import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import useLicenseStore from '@DataStore/license/licenseStore';
import useOnboardingStore from '@DataStore/settings/onboardingStore';

export function useLicenseActions() {
  const { licenseKey, updateField } = useOnboardingStore();
  const {
    isActive,
    isActivating,
    isDeactivating,
    isLoading,
    isUpgrading,
    upgradeProgress,
    error: licenseError,
    activateLicense,
    deactivateLicense,
    clearError
  } = useLicenseStore();
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleLicenseAction = async () => {
    if (isActive) {
      // Deactivate license
      try {
        clearError();
        await deactivateLicense();
        setToast({
          show: true,
          message: __('License deactivated successfully!', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'success'
        });
      } catch (error) {
        setToast({
          show: true,
          message: error.message || __('Failed to deactivate license', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'error'
        });
      }
    } else {
      // Activate license
      if (!licenseKey || !licenseKey.trim()) {
        setToast({
          show: true,
          message: __('Please enter a license key', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'error'
        });
        return;
      }

      try {
        clearError();
        const result = await activateLicense(licenseKey.trim());

        // Check if upgrade is happening
        if (result.data?.download_url && window.wpchatLicense?.is_lite) {
          setToast({
            show: true,
            message: __('Upgrading to WPChat Pro...', 'smashballoon-wpchat-livechat-customer-support'),
            type: 'success'
          });
        } else {
          setToast({
            show: true,
            message: __('License activated successfully!', 'smashballoon-wpchat-livechat-customer-support'),
            type: 'success'
          });
        }
      } catch (error) {
        setToast({
          show: true,
          message: error.message || __('Failed to activate license', 'smashballoon-wpchat-livechat-customer-support'),
          type: 'error'
        });
      }
    }
  };


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

  return {
    // State
    licenseKey,
    isActive,
    isActivating,
    isDeactivating,
    isLoading,
    isUpgrading,
    upgradeProgress,
    licenseError,
    toast,

    // Actions
    handleLicenseAction,
    updateField,
    setToast,

    // Computed values
    getLicenseKeyDisplayValue,
    getLicenseButtonLabel
  };
}