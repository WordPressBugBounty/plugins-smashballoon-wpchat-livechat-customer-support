import React, { useEffect, useState, lazy } from 'react';
import { useLocation } from 'react-router';
import { __ } from '@wordpress/i18n';
import IconGrid from '@AC/Customizer/IconGrid';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import SvgLoader from '@Components/SvgLoader';
import { getInitialMessages } from '@FC/getInitialMessages';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { isPro } from '@Utils/isPro';
import { useEntitlements } from '@AH/useEntitlements';

const CustomAvatarModal = isPro ? lazy(() => import('@ACPro/Customizer/CustomAvatarModal')) : null;

/**
 * IconPanel component displays a collection or grid of icons within a panel.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered IconPanel component.
 */
export default function AssistantAvatarPanel() {
  const location = useLocation();

  const setChatbotAvatar = useChatStore((s) => s.setChatbotAvatar);
  const chatbotCustomAvatar = useChatStore((s) => s.chatbotCustomAvatar);
  const chatbotName = useChatStore((s) => s.chatbotName);
  const setChatbotName = useChatStore((s) => s.setChatbotName);
  const chatbotCustomName = useChatStore((s) => s.chatbotCustomName);
  const setShowChat = useChatStore((s) => s.setShowChat);
  const setDisableNavigation = useChatStore((s) => s.setDisableNavigation);
  const navigateViaStore = useChatStore((s) => s.navigateViaStore);
  const setIsPreviewMode = useChatStore((s) => s.setIsPreviewMode);
  const setDisableFaqTracking = useChatStore((s) => s.setDisableFaqTracking);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

    const { isPro: isProPlan } = useEntitlements();

  // Get upgrade dialog data for assistant avatar
  const upgradeDialogData = getUpgradeDialogData('assistantAvatar', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.assistantAvatar,
  });

  const avatars = [
    { icon: 'wpChat', title: __('WPChat', 'smashballoon-wpchat-livechat-customer-support'), isPro: false },
    { icon: 'wpChatAlt', title: __('WPChat', 'smashballoon-wpchat-livechat-customer-support'), isPro: false },
    { icon: 'juno', title: __('Juno', 'smashballoon-wpchat-livechat-customer-support'), isPro: true },
    { icon: 'quark', title: __('Quark', 'smashballoon-wpchat-livechat-customer-support'), isPro: true },
    { icon: 'tera', title: __('Tera', 'smashballoon-wpchat-livechat-customer-support'), isPro: true },
    { icon: 'pixie', title: __('Pixie', 'smashballoon-wpchat-livechat-customer-support'), isPro: true },
  ];

  const botMsg = getInitialMessages('', (url) => {
    window.location.href = url;
  });

  const handleIconClick = ({ icon, title }) => {
    setChatbotAvatar(icon);
    setChatbotName(title);
  };

  const computedAvatars = [
    ...(chatbotCustomAvatar || chatbotCustomName
      ? [{ icon: chatbotCustomAvatar, title: chatbotCustomName, isCustom: true }]
      : []),
    ...avatars,
  ];

  useEffect(() => {
    navigateViaStore('/chat', { msg: botMsg });
    setShowChat(true);
    setDisableNavigation(false);
    setIsPreviewMode(true); // Set preview mode to prevent analytics logging
    setDisableFaqTracking(true); // Disable FAQ click tracking in customizer preview
  }, [location.pathname]);

  return (
    <>
      <IconGrid
        icons={computedAvatars}
        onIconClick={handleIconClick}
        compareKey={'chatbotAvatar'}
        onEditClick={() => setIsOpen(true)}
        slug="assistantAvatar"
      />
      {!(chatbotCustomAvatar && chatbotCustomName) && (
        <Button
          onPress={() => {
            if (!isPro) {
              setIsUpgradeDialogOpen(true);
            } else {
              setIsOpen(true);
            }
          }}
          variant='quaternary'
          className='wpchat:mt-2 wpchat:w-full wpchat:py-4'
        >
          <SvgLoader name='plus' />
          {__('Add Your Own', 'smashballoon-wpchat-livechat-customer-support')}
          {!isPro && <SvgLoader name='lockedBadge' />}
        </Button>
      )}
      {CustomAvatarModal &&  <CustomAvatarModal isOpen={isOpen} onOpenChange={setIsOpen} />}
      
      {/* Upgrade modal for custom avatar feature */}
      <Modal isOpen={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...upgradeDialogData} />
        </Dialog>
      </Modal>
    </>
  );
}
