import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import CardWithLine from '@AC/CardWithLine';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { LinkButton } from '@AC/ui/LinkButton';
import { Modal } from '@AC/ui/Modal';
import { useEntitlements } from '@AH/useEntitlements';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';

/**
 * UpgradeToProBlurNotice component - displays a premium upgrade prompt over blurred content
 * Perfect for showcasing premium features with a professional overlay
 * Supports entitlement checking to conditionally render content
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.backgroundImage] - Optional URL of background image. If not provided, children will be rendered and blurred
 * @param {string} [props.icon='crown'] - Name of the SVG icon to display (e.g., 'crown', 'star', 'lock')
 * @param {string} props.title - Title text for the upgrade prompt
 * @param {string} props.description - Description text explaining the premium feature
 * @param {Function} [props.onUpgrade] - Callback function when upgrade button is clicked
 * @param {Function} [props.onLearnMore] - Callback function when learn more button is clicked (deprecated - use upgradeDialogData instead)
 * @param {string} [props.upgradeText] - Custom text for upgrade button
 * @param {string} [props.learnMoreText] - Custom text for learn more button
 * @param {string} [props.className] - Additional CSS classes for the container
 * @param {number} [props.minHeight=400] - Minimum height of the component in pixels
 * @param {string|string[]} [props.requiredEntitlement] - Entitlement(s) required to access this feature
 * @param {React.ReactNode} [props.children] - Content to show when user has entitlement, or content to blur when they don't
 * @param {Object} [props.upgradeDialogData] - Data to display in the upgrade modal dialog
 */
const UpgradeToProBlurNotice = ({
  backgroundImage,
  icon = 'crown',
  title,
  description,
  onUpgrade,
  onLearnMore,
  upgradeText,
  learnMoreText,
  className = '',
  minHeight = 350,
  requiredEntitlement,
  children,
  upgradeDialogData,
}) => {
  const { hasFeature } = useEntitlements();
  const [isOpen, setIsOpen] = useState(false);
  const backgroundRef = useRef(null);
  const overlayRef = useRef(null);
  const contentBlurRef = useRef(null);

  // Determine if we're using content blur mode (no backgroundImage provided)
  const useContentBlur = !backgroundImage;

  // Handler for "Learn More" button click
  const handleUpgradeClick = () => {
    if (upgradeDialogData) {
      setIsOpen(true);
    } else if (onLearnMore) {
      onLearnMore();
    }
  };

  // Function to enforce blur styles - makes it tamper-resistant
  const enforceBlurStyles = () => {
    const targetRef = useContentBlur ? contentBlurRef : backgroundRef;

    if (targetRef.current) {
      // Apply blur with !important using inline styles
      const blurStyles = {
        filter: 'blur(7px) !important',
        pointerEvents: 'none !important',
      };

      // Set each style with !important
      Object.keys(blurStyles).forEach((key) => {
        targetRef.current.style.setProperty(
          key.replace(/([A-Z])/g, '-$1').toLowerCase(),
          blurStyles[key].replace(' !important', ''),
          'important',
        );
      });
    }

    if (overlayRef.current) {
      // Enforce overlay opacity
      overlayRef.current.style.setProperty('opacity', '1', 'important');
      overlayRef.current.style.setProperty('pointer-events', 'none', 'important');
    }
  };

  // Set up tamper-resistant blur enforcement
  useEffect(() => {
    // Initial enforcement
    enforceBlurStyles();

    // Set up MutationObserver to watch for style/attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')
        ) {
          enforceBlurStyles();
        }
      });
    });

    // Observe the appropriate blur target
    const targetRef = useContentBlur ? contentBlurRef : backgroundRef;
    if (targetRef.current) {
      observer.observe(targetRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }

    if (overlayRef.current) {
      observer.observe(overlayRef.current, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }

    // Backup: Re-enforce styles every 100ms to catch any bypass attempts
    const intervalId = setInterval(enforceBlurStyles, 100);

    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, [useContentBlur]);

  // If entitlement is required and user has it, render children
  if (requiredEntitlement) {
    const hasAccess = Array.isArray(requiredEntitlement)
      ? requiredEntitlement.some((ent) => hasFeature(ent))
      : hasFeature(requiredEntitlement);

    if (hasAccess) {
      return children || null;
    }
  }
  return (
    <div
      className={`wpchat:relative wpchat:overflow-hidden ${className}`}
    >
      {/* Background: Either Image or Blurred Content */}
      {useContentBlur ? (
        // Render children as blurred background
        <div ref={contentBlurRef} className='wpchat:absolute wpchat:inset-0' aria-hidden='true'>
          {children}
        </div>
      ) : (
        // Render background image with blur
        <div
          ref={backgroundRef}
          className='wpchat:absolute wpchat:inset-0 wpchat:bg-cover wpchat:bg-center'
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
          aria-hidden='true'
        />
      )}

      {/* Overlay Gradient for Better Contrast */}
      <div
        ref={overlayRef}
        className='wpchat:absolute wpchat:inset-0 wpchat:bg-gradient-to-br wpchat:from-white/70'
        aria-hidden='true'
      />

      {/* Main Content */}
      <div
        className='wpchat:relative wpchat:z-10 wpchat:flex wpchat:items-center wpchat:justify-center wpchat:md:p-8 wpchat:p-5'
        style={{ minHeight: `${minHeight}px` }}
      >
        <CardWithLine className='wpchat:flex wpchat:md:flex-nowrap wpchat:flex-wrap wpchat:w-full wpchat:max-w-[400px] wpchat:items-start wpchat:md:gap-6.5 wpchat:gap-3 wpchat:md:px-9 wpchat:md:py-7.5 wpchat:px-4 wpchat:py-3 wpchat:shadow-md'>
          <div > 
            {icon && (
              <div className='wpchat:shrink-0 wpchat:rounded-full wpchat:bg-white wpchat:p-2.5 wpchat:shadow-md'>
                <SvgLoader name={icon} className='wpchat:h-6 wpchat:w-6 wpchat:fill-green-700' />
              </div>
            )}
          </div>
          <div>
            <TitleDescription
              title={title}
              description={description}
              titleClassName='wpchat:mb-5'
              className='wpchat:mb-0'
            />
            <div className='wpchat:flex wpchat:items-start wpchat:gap-3'>
              <LinkButton
                variant='tertiary'
                href={
                  onUpgrade
                    ? undefined
                    : window.wpChatAdmin?.urls?.upgrade || 'https://wpchat.com/pricing'
                }
                target="_blank"
                rel="noopener noreferrer"
                onPress={onUpgrade ? onUpgrade : undefined}
              >
                {upgradeText || __('Upgrade', 'smashballoon-wpchat-livechat-customer-support')}
                <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
              </LinkButton>
              {(onLearnMore || upgradeDialogData) && (
                <Button variant='secondary' onPress={handleUpgradeClick}>
                  {learnMoreText ||
                    __('Learn More', 'smashballoon-wpchat-livechat-customer-support')}
                </Button>
              )}
            </div>
          </div>
        </CardWithLine>
      </div>

      {/* Upgrade Modal */}
      {upgradeDialogData && (
        <Modal isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
          <Dialog>
            <UpgradeToProDialog {...upgradeDialogData} />
          </Dialog>
        </Modal>
      )}
    </div>
  );
};

export default UpgradeToProBlurNotice;
