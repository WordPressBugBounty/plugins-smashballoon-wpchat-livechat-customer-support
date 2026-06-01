import React, { useState, lazy } from 'react';
import { __ } from '@wordpress/i18n';
import CTA from '@AC/Customizer/CTA';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { Select, SelectItem } from '@AC/ui/Select';
import { getMenuItemBySlug } from '@AU/getMenuItemBySlug';
import SvgLoader from '@Components/SvgLoader';
import { useMenuStore } from '@DataStore/Customizer/menuStore';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { isPro } from '@Utils/isPro';
import ThemePresets from '@FDataStore/Themes/ThemePresets';
import { availableThemes } from '@FDataStore/Themes/availableThemes';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';


/**
 * ThemePanel component allows users to select and customize application themes.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered ThemePanel component.
 */
export default function ThemePanel() {
  const { isPro: isProPlan } = useEntitlements();


  const theme = useChatStore((s) => s.theme);
  const setTheme = useChatStore((s) => s.setTheme);
  const currentOption = availableThemes.find((opt) => opt.slug === theme);

  const [isOpen, setIsOpen] = useState(false);

  // Get upgrade dialog data for customizer features
  const customizerUpgradeDialogData = getUpgradeDialogData('theme', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.theme,
  });

  const handleSelectionChange = async (slug) => {
    const selectedTheme = availableThemes.find(theme => theme.slug === slug);
    
    if (selectedTheme?.isPro && !isPro) {
      setIsOpen(true);
      return;
    }
    
    setTheme(slug);
    
    if (selectedTheme?.isPro && isPro) {
      const proPresets = await import('@FDataStorePro/Themes/ThemePresets');
      proPresets.default(slug);
    } else {
      ThemePresets(slug);
    }
  };

  return (
    <>
      <Select
        selectedKey={theme}
        onSelectionChange={handleSelectionChange}
        btnClassName='wpchat:w-full wpchat:mb-3'
        className='wpchat:pt-4'
      >
        {availableThemes.map((option) => (
          <SelectItem
            key={option.slug}
            id={option.slug}
            isPro={option.isPro}
            isSelectedCustom={__('Current', 'smashballoon-wpchat-livechat-customer-support')}
          >
            <div className='flex items-center gap-2'>
              <span>{option.name}</span>
            </div>
          </SelectItem>
        ))}
      </Select>

      {currentOption && (
        <div className='wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:relative wpchat:flex wpchat:justify-center wpchat:rounded-lg wpchat:border wpchat:px-5 wpchat:pt-10 wpchat:overflow-hidden'>
          <SvgLoader name={currentOption.image} className="wpchat:-mb-16" />
        </div>
      )}

      <CTA
        title={__('Customise Colors', 'smashballoon-wpchat-livechat-customer-support')}
        description={__('Like the theme but need different colors? Customise them', 'smashballoon-wpchat-livechat-customer-support')}
        icon='paintBucket'
        variation='two'
        className='wpchat:mt-4'
        onClick={() => useMenuStore.getState().push(getMenuItemBySlug('colorPalette'))}
      />

      {/* Upgrade modal for customizer features */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...customizerUpgradeDialogData} />
        </Dialog>
      </Modal>
    </>
  );
}
