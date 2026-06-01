import React, { Suspense, lazy, useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import UpgradeToPro from '@AC/UpgradeToPro';
import VisibilitySkeleton from '@AC/Visibility/VisibilitySkeleton';
import VisibilityTabs from '@AC/Visibility/VisibilityTabs';
import { Button } from '@AC/ui/Button';
import { Toast } from '@AC/ui/Toast';
import VisibilityTabsPro from '@ACPro/Visibility/VisibilityTabsPro';
import { HideOnDesktop, HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { isPro } from '@Utils/isPro';

const PageLayout = lazy(() => import('@AC/PageLayout'));

const UpgradeToProData = {
  title: __(
    'Upgrade to fine tune Chat Assistant visibility ',
    'smashballoon-wpchat-livechat-customer-support',
  ),
  description: __(
    'Add and remove from specific categories, custom post type and much more when you upgrade',
    'smashballoon-wpchat-livechat-customer-support',
  ),
  features: [
    {
      icon: <SvgLoader name='pageLevelTargeting' className="wpchat:fill-green-600" />,
      title: __('Page-Level Targeting', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Pick exactly which pages or posts your assistant shows up on (or hides from).',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      icon: <SvgLoader name='categoryTagFilters' className="wpchat:fill-green-600"/>,
      title: __('Category & Tag Filters', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        "Include or exclude whole categories or tags with one click—context matters.",
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      icon: <SvgLoader name='categorySearch' className="wpchat:fill-green-600"/>,
      title: __('Custom Post Type Rules', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        "Control chat on any CPT (products, portfolios, reviews—whatever you’ve got).",
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
  ],
};

/**
 * Visibility component
 *
 * This component controls the visibility of UI elements for the chatbot.
 * It allows users to select which pages, categories, tags, and custom post types
 * the chatbot should appear on.
 *
 * @component
 * @returns {JSX.Element} Rendered Visibility component
 */
export default function Visibility() {
  const { settings, fetchSettings, saveSettings, saveStatus } = useSettingsStore();
  const [visibilitySettings, setVisibilitySettings] = useState({
    mode: 'include',
    exclude: { pages: [], categories: [], tags: [], postTypes: [] },
    include: { pages: [], categories: [], tags: [], postTypes: [] },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.visibilitySettings) {
      setVisibilitySettings(settings.visibilitySettings);
    }
  }, [settings]);

  useEffect(() => {
    if (!saveStatus) return;

    const messages = {
      success: __('Visibility settings saved successfully', 'smashballoon-wpchat-livechat-customer-support'),
      error: __('[WPC-SET-002] Error saving settings', 'smashballoon-wpchat-livechat-customer-support'),
    };

    setToast({
      show: true,
      message: messages[saveStatus] || '',
      type: saveStatus,
    });
    setIsSaving(false);
  }, [saveStatus]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveSettings({
      ...settings,
      visibilitySettings,
    });
  };

  function HeaderButtons() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <Button onPress={handleSave} isLoading={isSaving}>
          <HideOnMobile>
            {__('Save Changes', 'smashballoon-wpchat-livechat-customer-support')}
          </HideOnMobile>
          <HideOnDesktop>{__('Save', 'smashballoon-wpchat-livechat-customer-support')}</HideOnDesktop>
        </Button>
      </div>
    );
  }

  return (
    <Suspense fallback={<VisibilitySkeleton />}>
      <PageLayout
        breadcrumb={[{ label: __('Visibility', 'smashballoon-wpchat-livechat-customer-support') }]}
        className='wpchat:md:pb-32'
        HeaderButtons={HeaderButtons}
      >
        {isPro ? (
          <VisibilityTabsPro value={visibilitySettings} onChange={setVisibilitySettings} />
        ) : (
          <VisibilityTabs value={visibilitySettings} onChange={setVisibilitySettings} />
        )}
        {!isPro && <UpgradeToPro {...UpgradeToProData} />}

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      </PageLayout>
    </Suspense>
  );
}
