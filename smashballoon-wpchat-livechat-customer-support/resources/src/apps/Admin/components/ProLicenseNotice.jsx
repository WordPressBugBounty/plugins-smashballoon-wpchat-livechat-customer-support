import React from 'react';
import { __ } from '@wordpress/i18n';
import Alert from '@AC/Alert';

/**
 * ProLicenseNotice component displays a notice when a Pro license is detected in the Free version.
 * Prompts users to download and install WPChat Pro to access Pro features.
 *
 * @returns {JSX.Element|null} The rendered notice component or null if not applicable.
 */
export default function ProLicenseNotice() {
  const hasProLicenseInFree = window.wpChatAdmin?.hasProLicenseInFree || false;

  // Only show in free version when pro license is detected
  if (!hasProLicenseInFree) {
    return null;
  }

  const downloadProUrl = window.wpChatAdmin?.urls?.downloadPro || 'https://wpchat.com/account/downloads/';

  const handleDownload = () => {
    window.open(downloadProUrl, '_blank');
  };

  return (
    <div className="wpchat:mb-4">
      <Alert
        icon="warning"
        title={__('WPChat Pro License Detected', 'smashballoon-wpchat-livechat-customer-support')}
        description={__(
          'You have a Pro license activated, but you\'re using the Free version of WPChat. To access Pro features, please install and activate WPChat Pro.',
          'smashballoon-wpchat-livechat-customer-support'
        )}
        ctaText={__('Download WPChat Pro', 'smashballoon-wpchat-livechat-customer-support')}
        ctaAction={handleDownload}
        ctaIcon="download"
        variant="info"
      />
    </div>
  );
}
