import React from 'react';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import HeaderLayout from '@AC/HeaderLayout';
import { Button } from '@AC/ui/Button';
import { HideOnDesktop, HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
/**
 * Header component for admin pages with breadcrumb, logo, and action buttons.
 *
 * @param {Object} props - Component props.
 * @param {Array<{ label: string, href?: string, disabled?: boolean }>} [props.breadcrumb] - Breadcrumb items.
 * @param {React.ComponentType} [props.HeaderButtons] - Component to render action buttons on the right side.
 * @param {React.ComponentType} [props.HeaderButtonsLeft] - Component to render action buttons on the left (variant two).
 * @param {boolean} [props.disableHelpBtn=false] - Disable the help button.
 * @param {boolean} [props.disableLogo=false] - Disable the logo display.
 * @param {'one'|'two'} [props.headerVariant='one'] - Layout variant of the header.
 * @param {string} [props.headerHeading] - Optional heading text (variant two).
 * @returns {JSX.Element} Rendered Header component.
 */
function Header({
  breadcrumb,
  HeaderButtons,
  HeaderButtonsLeft,
  disableHelpBtn = false,
  disableLogo = false,
  headerVariant = 'one',
  headerHeading,
}) {
  const navigate = useNavigate();

  return (
    <HeaderLayout>
      <div className='wpchat:flex wpchat:items-center wpchat:gap-1 wpchat:md:gap-x-5'>
        {/* Left Section - Variant One */}
        {headerVariant === 'one' && (
          <div className='wpchat:flex wpchat:w-[50%] wpchat:items-center wpchat:justify-start'>
            {!disableLogo && <SvgLoader name='logo' />}

            {breadcrumb?.length > 0 && (
              <nav
                aria-label='breadcrumb'
                role='breadcrumb'
                className='wpchat:flex wpchat:items-center wpchat:ps-3 wpchat:text-sm wpchat:md:ps-5 wpchat:md:text-lg'
              >
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <HideOnMobile>
                      <span className='wpchat:hidden wpchat:md:inline-flex'>
                        {index > 0 && <span className='wpchat:px-2'>/</span>}
                        {item?.href ? (
                          <button
                            onClick={() => navigate(item.href)}
                            className='hover:wpchat:text-gray-700 wpchat:cursor-pointer wpchat:border-none wpchat:bg-transparent wpchat:p-0 wpchat:text-gray-500'
                          >
                            {item?.label}
                          </button>
                        ) : (
                          <span
                            className={
                              item?.disabled ? 'wpchat:text-gray-500' : 'wpchat:font-semibold'
                            }
                          >
                            {item?.label}
                          </span>
                        )}
                      </span>
                    </HideOnMobile>
                    <HideOnDesktop>
                      {index === 0 && (
                        <span className='wpchat:inline-flex'>
                          <span className='wpchat:font-semibold'>{item?.label}</span>
                        </span>
                      )}
                    </HideOnDesktop>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>
        )}

        {/* Middle Section - Variant Two */}
        {headerVariant === 'two' && (
          <>
            {HeaderButtonsLeft && (
              <div className='wpchat:flex wpchat:w-[50%] wpchat:items-center wpchat:justify-start wpchat:md:w-[33.33%]'>
                <HeaderButtonsLeft />
              </div>
            )}
            {headerHeading && (
              <div className='wpchat:hidden wpchat:w-[33.33%] wpchat:text-center wpchat:text-base wpchat:leading-relaxed wpchat:font-semibold wpchat:md:block'>
                {headerHeading}
              </div>
            )}
          </>
        )}

      {/* Middle Section - Variant Three */}
        {headerVariant === 'three' && (
          <>
            {HeaderButtonsLeft && (
              <div className='wpchat:flex wpchat:w-[50%] wpchat:items-center wpchat:justify-start'>
                <HeaderButtonsLeft />
              </div>
            )}
          </>
        )}

        {/* Right Section */}
        <div
          className={`wpchat:flex wpchat:w-[50%] wpchat:items-center wpchat:justify-end ${
            headerVariant === 'two' ? 'wpchat:md:w-[33.33%]' : 'wpchat:md:w-[50%]'
          }`}
        >
          {HeaderButtons && <HeaderButtons />}

          {!disableHelpBtn && (
            <Button
              variant='secondary'
              onPress={() => (window.location.href = wpChatAdmin?.mainPageUrl + '#/support')}
              className='wpchat:ms-2'
            >
              <SvgLoader name='questionMarkCircle' />
              <HideOnMobile>{__('Help', 'smashballoon-wpchat-livechat-customer-support')}</HideOnMobile>
            </Button>
          )}
        </div>
      </div>
    </HeaderLayout>
  );
}

export default Header;
