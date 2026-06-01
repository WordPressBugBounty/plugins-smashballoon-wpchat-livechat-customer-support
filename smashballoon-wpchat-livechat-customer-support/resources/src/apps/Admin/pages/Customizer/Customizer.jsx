import React, { useCallback, useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import EmbeddedFrontend from '@AC/EmbeddedFrontend';
import PageLayout from '@AC/PageLayout';
import { Button } from '@AC/ui/Button';
import { SideNav } from '@AC/ui/SideNav';
import { Toast } from '@AC/ui/Toast';
import SvgLoader from '@Components/SvgLoader';
import { chatSettingsSaver, useChatStore } from '@FDataStore/Chat/chatStore';
import { DrillMenu } from './DrillMenu';
import { menuData } from './menuData';
import { useEntitlements } from '@AH/useEntitlements';
import { useMenuStore } from '@DataStore/Customizer/menuStore';
import useFaqsStore from '@DataStore/faqs/faqsStore';
/**
 * Customizer component provides a UI for customizing application settings or appearance.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered Customizer component.
 */
export default function Customizer() {
  const setDisableFixed = useChatStore((s) => s.setDisableFixed);
  const setShowChat = useChatStore((s) => s.setShowChat);
  const setRootClassName = useChatStore((s) => s.setRootClassName);
  const setIsPreviewMode = useChatStore((s) => s.setIsPreviewMode);
  const setDisableChatToggle = useChatStore((s) => s.setDisableChatToggle);
  const setDisableFaqTracking = useChatStore((s) => s.setDisableFaqTracking);
  const setReorder = useChatStore((s) => s.setReorder);
  const setRoute = useChatStore((s) => s.setRoute);
  const reset = useChatStore((s) => s.reset);
  const { hasFullCustomizerEntitlement } = useEntitlements();
  const resetMenu = useMenuStore((s) => s.reset);
  const loadFaqs = useFaqsStore((s) => s.loadFaqs);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isOpenSideNav, setIsOpenSideNav] = useState(true);

  // Ensure sidebar is always open on desktop
  useEffect(() => {
    const handleResize = () => {
      // 768px is the md breakpoint - sidebar should always be open on desktop
      if (window.innerWidth >= 768) {
        setIsOpenSideNav(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    chatSettingsSaver();

    setTimeout(() => {
      setIsSaving(false);
      setToast({
        show: true,
        message: __('Settings saved successfully', 'smashballoon-wpchat-livechat-customer-support'),
      });
    }, 500);
  };

  // Initialize customizer environment on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    reset();
    resetMenu(); // Reset drill menu when entering customizer page
    loadFaqs(); // Load FAQs to determine visibility state
    setDisableFixed(true);
    setDisableChatToggle(true);
    setRootClassName('wpchat:flex wpchat:justify-center');
    setIsPreviewMode(true); // Set preview mode to prevent analytics logging
    setDisableFaqTracking(true); // Disable FAQ click tracking in customizer preview
  }, []); // Intentionally empty - run only once on mount

  // Open chat only after EmbeddedFrontend is fully initialized to avoid race conditions on slow servers
  const handleFrontendReady = useCallback(() => {
    setShowChat(true);
  }, [setShowChat]);

  // Track current panel for frontend preview
  const menuStack = useMenuStore((s) => s.stack);

  useEffect(() => {
    const currentPanel = menuStack[menuStack.length - 1];
    const currentSlug = currentPanel?.slug;
    setRoute(currentSlug ? `/panel/${currentSlug}` : '/');
  }, [menuStack]);

  useEffect(() => {
  if (hasFullCustomizerEntitlement) {
    setReorder(true);
  }

  return () => {
    setReorder(false); // Cleanup always
  };
}, [hasFullCustomizerEntitlement]);

  function HeaderButtonsRight() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <Button onPress={handleSaveSettings} isPending={isSaving} isLoading={true === isSaving}>
          {__('Save', 'smashballoon-wpchat-livechat-customer-support')}
        </Button>
      </div>
    );
  }

  function HeaderButtonsLeft() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <Button
          variant='secondary'
          onPress={() => setIsOpenSideNav((prev) => !prev)}
          className='wpchat:block wpchat:md:hidden'
        >
          <SvgLoader name={isOpenSideNav ? 'close' : 'hamburger'} className="wpchat:h-4 wpchat:w-4"/>
        </Button>
        <Button
          variant='secondary'
          onPress={() => (window.location.href = wpChatAdmin.mainPageUrl)}
        >
          <SvgLoader name='displayEye' />
          <span className='wpchat:hidden wpchat:md:block'> {__('Close Editor', 'smashballoon-wpchat-livechat-customer-support')}</span>
          <span className='wpchat:block wpchat:md:hidden'> {__('Close', 'smashballoon-wpchat-livechat-customer-support')}</span>
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      HeaderButtons={HeaderButtonsRight}
      HeaderButtonsLeft={HeaderButtonsLeft}
      disableLogo={true}
      HeaderTitle={__('Chat Assistant Editor', 'smashballoon-wpchat-livechat-customer-support')}
      className=':wpchat:py-0 wpchat:max-w-full wpchat:p-0 wpchat:md:py-0'
      headerVariant='two'
      headerHeading={__('Chat Assistant Editor', 'smashballoon-wpchat-livechat-customer-support')}
    >
      <div className='p-4 max-w-xs mx-auto'>
        <SideNav
          isOpen={isOpenSideNav}
          setIsOpen={setIsOpenSideNav}
          position='left'
          className='wpchat:md:w-[384px]'
          showLoading={true}
        >
          <DrillMenu data={menuData} />
        </SideNav>

      <EmbeddedFrontend className='wpchat:me-0 wpchat:ms-auto wpchat:pt-5 wpchat:md:w-[calc(100vw-384px)]' showLoader onReady={handleFrontendReady} />
      </div>
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </PageLayout>
  );
}
