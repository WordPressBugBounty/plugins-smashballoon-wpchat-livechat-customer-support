import React from 'react';
import { __ } from '@wordpress/i18n';
import { Toast } from '@AC/ui/Toast';
import useOnboardingStore from '@DataStore/settings/onboardingStore';
import SummaryCard from '../shared/SummaryCard';
import UpgradePromoSection from '../shared/UpgradePromoSection';
import LicenseSection from '../shared/LicenseSection';
import NewsletterSection from '../shared/NewsletterSection';
import { useLicenseActions } from '@AH/useLicenseActions';
import { isPro } from '@Utils/isPro';

export default function FinalStep() {
  const {
    newsletterEmail,
    newsletterSubscribed,
    updateField
  } = useOnboardingStore();

  const {
    licenseKey,
    isActive,
    isActivating,
    isDeactivating,
    isLoading,
    isUpgrading,
    upgradeProgress,
    licenseError,
    toast,
    handleLicenseAction,
    setToast,
    getLicenseKeyDisplayValue,
    getLicenseButtonLabel
  } = useLicenseActions();

  const rows = [
    __('Add a Whatsapp number', 'smashballoon-wpchat-livechat-customer-support'),
    __('Configure theme', 'smashballoon-wpchat-livechat-customer-support'),
    __('Set up website visibility', 'smashballoon-wpchat-livechat-customer-support')
  ];

  return (
    <div className='wpchat:flex wpchat:flex-col wpchat:gap-4'>
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <SummaryCard rows={rows} />

      <div className='wpchat:rounded-lg wpchat:bg-white wpchat:shadow wpchat:border wpchat:border-gray-200 wpchat:border-t-[3px] wpchat:border-t-wp-light-blue-500'>

        {isPro ? (
          // Pro version: License activation only
          <LicenseSection
            licenseKey={licenseKey}
            getLicenseKeyDisplayValue={getLicenseKeyDisplayValue}
            updateField={updateField}
            isActive={isActive}
            isActivating={isActivating}
            isDeactivating={isDeactivating}
            isLoading={isLoading}
            isUpgrading={isUpgrading}
            upgradeProgress={upgradeProgress}
            licenseError={licenseError}
            onActivate={handleLicenseAction}
            getLicenseButtonLabel={getLicenseButtonLabel}
            variant='pro'
          />
        ) : (
          // Free version: Upgrade promo + license activation + newsletter
          <>
            <UpgradePromoSection />

            <LicenseSection
              title={__('Already have a license key?', 'smashballoon-wpchat-livechat-customer-support')}
              description={__('Upgrade in a single click by adding your license key below', 'smashballoon-wpchat-livechat-customer-support')}
              licenseKey={licenseKey}
              getLicenseKeyDisplayValue={getLicenseKeyDisplayValue}
              updateField={updateField}
              isActive={isActive}
              isActivating={isActivating}
              isDeactivating={isDeactivating}
              isLoading={isLoading}
              isUpgrading={isUpgrading}
              upgradeProgress={upgradeProgress}
              licenseError={licenseError}
              onActivate={handleLicenseAction}
              getLicenseButtonLabel={getLicenseButtonLabel}
              showHelpSection={false}
              variant='free'
            />
          </>
        )}
      </div>

      {!isPro && (
        <NewsletterSection
          newsletterEmail={newsletterEmail}
          newsletterSubscribed={newsletterSubscribed}
          onEmailChange={(email) => updateField('newsletterEmail', email)}
          onSubscribedChange={(subscribed) => updateField('newsletterSubscribed', subscribed)}
        />
      )}
    </div>
  );
}