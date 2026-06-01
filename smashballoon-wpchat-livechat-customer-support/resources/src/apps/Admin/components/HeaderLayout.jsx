import React from 'react';
import { cn } from '@Utils/cn';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { useProUpsellBanner } from '@AH/useProUpsellBanner';

/**
 * Renders a layout wrapper for the header.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the layout.
 * @returns {JSX.Element} The rendered header layout component.
 */
function HeaderLayout({ children }) {
  const { shouldShowBanner, dismissBanner } = useProUpsellBanner();

  const handleCloseBanner = async () => {
    await dismissBanner();
  };

  return (
    <>
      {/* Spacer for fixed header (and banner if free user) */}
      <div
        className={cn(
          'wpchat:max-[783px]:pt-0',
          shouldShowBanner ? 'wpchat:pt-24 wpchat:min-[783px]:pt-[97px]' : 'wpchat:pt-14 wpchat:min-[783px]:pt-16',
        )}
      />

      {/* Banner only if not Pro and not dismissed */}
      {shouldShowBanner && (
        <div
          className={cn(
            'wpchat:flex wpchat:items-center wpchat:justify-center wpchat:z-99991 wpchat:bg-green-700 wpchat:px-4 wpchat:py-1.5 wpchat:text-sm wpchat:text-white wpchat:md:px-13 wpchat-pf-width wpchat:min-[783px]:fixed wpchat:min-[783px]:top-8',
          )}
        >
          <div className='wpchat:relative wpchat:w-full wpchat:text-center'>
            <span>{__('You Are using WPChat Lite. Unlock more features when you upgrade', 'smashballoon-wpchat-livechat-customer-support')}</span>
            <a
              href={window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing'}
              className='wpchat:ms-2 wpchat:font-semibold wpchat:underline wpchat:hover:text-white wpchat:text-white' 
              target='_blank'
            >
              {__('Upgrade', 'smashballoon-wpchat-livechat-customer-support')}
            </a>
            <SvgLoader 
              name="close" 
              className="wpchat:absolute wpchat:end-0 wpchat:top-1/2 wpchat:-translate-y-1/2 wpchat:fill-white wpchat:w-[1.2em] wpchat:h-[1.2em] wpchat:cursor-pointer"
              onClick={handleCloseBanner}
            />
          </div>
        </div>
      )}

      {/* Main header */}
      <div
        className={cn(
          'wpchat-admin-header wpchat-pf-width wpchat:top-10.5 wpchat:z-99991 wpchat:min-h-[66px] wpchat:border-b wpchat:border-gray-300 wpchat:bg-white wpchat:px-4 wpchat:py-2 wpchat:min-[783px]:fixed wpchat:md:px-13 wpchat:md:py-3',
          shouldShowBanner ? 'wpchat:min-[783px]:top-16' : 'wpchat:min-[783px]:top-8',
        )}
      >
        {children}
      </div>
    </>
  );
}

export default HeaderLayout;
