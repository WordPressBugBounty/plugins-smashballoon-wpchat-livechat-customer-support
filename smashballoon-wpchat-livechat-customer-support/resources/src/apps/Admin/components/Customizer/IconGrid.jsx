import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { useEntitlements } from '@AH/useEntitlements';
import SvgLoader from '@Components/SvgLoader';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { cn } from '@Utils/cn';
import { getGlobalLightnessAndChroma } from '@Utils/getGlobalLightnessAndChroma';
import { isPro } from '@Utils/isPro';

/**
 * IconGrid component displays a grid of icons with optional titles.
 * It supports click interactions for selecting icons and optionally editing custom ones.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Array<{icon: string, title?: string, isCustom?: boolean, isPro?: boolean}>} [props.icons=[]] -
 *   Array of icon objects. Each icon can have:
 *   - `title` (optional) → Display text for the icon.
 *   - `isCustom` (optional) → Marks the icon as user-uploaded/custom.
 *   - `isPro` (optional) → Marks the icon as available only in the Pro version.
 * @param {function(Object): void} props.onIconClick -
 *   Callback function triggered when an icon is clicked.
 * @param {function(Object): void} [props.onEditClick] -
 *   Optional. Callback triggered when the edit button on a custom icon is clicked.
 * @param {string} [props.compareKey='chatToggleIcon'] -
 *   Key used to determine which icon is currently selected (for active state styling).
 * @param {string} [props.slug='customizer'] -
 *   Slug to determine which upgrade configuration to use for upsells.
 *
 * @returns {JSX.Element} The rendered IconGrid component.
 */
export default function IconGrid({
  icons = [],
  onIconClick,
  compareKey = 'chatToggleIcon',
  onEditClick,
  slug = '',
}) {
  const currentColor = getGlobalLightnessAndChroma();
  const brandColor = useChatStore((s) => s.brandColor);
  const compareValue = useChatStore((s) => s[compareKey]);
  
  const { isPro: isProPlan } = useEntitlements();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  // Get the appropriate upgrade config based on the slug
  const upgradeConfig = upgradeConfigs[slug] || upgradeConfigs.customizer;
  
  // Get upgrade dialog data
  const upgradeDialogData = getUpgradeDialogData(slug, {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfig,
  });

  return (
    <>
      <div className='wpchat:grid wpchat:grid-cols-2 wpchat:gap-2 wpchat:pt-5'>
        {icons.map((item) => {
          const isActive = compareValue === item.icon;
          const isLocked = item.isPro && !isPro;

          return (
            <button
              key={item.icon}
              onClick={() => {
                if (isLocked) {
                  setIsUpgradeDialogOpen(true);
                } else {
                  onIconClick?.(item);
                }
              }}
              disabled={false}
              className={cn(
                'wpchat:group wpchat:hover:border-wp-light-blue-500 wpchat:relative wpchat:flex wpchat:h-26 wpchat:flex-col wpchat:items-center wpchat:justify-center wpchat:rounded-sm wpchat:border wpchat:border-gray-50 wpchat:bg-gray-50 wpchat:px-3.5 wpchat:py-3.5 wpchat:hover:bg-white',
                isActive ? 'wpchat:border-wp-light-blue-500 wpchat:bg-white' : '',
                isLocked ? 'wpchat:cursor-not-allowed' : 'wpchat:cursor-pointer',
              )}
            >
              <div className='wpchat:h-12 wpchat:w-12'>
                {item.isCustom ? (
                  <>
                    {/* Edit button */}
                    <button
                      className='wpchat:absolute wpchat:top-1 wpchat:end-1 wpchat:cursor-pointer wpchat:rounded-lg wpchat:border wpchat:border-gray-200 wpchat:p-2 wpchat:shadow-sm'
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditClick?.();
                      }}
                      aria-label={__('Edit custom avatar', 'smashballoon-wpchat-livechat-customer-support')}
                    >
                      <SvgLoader name='editOutline' className='wpchat:fill-wp-blue-500' />
                    </button>

                    {/* Delete button */}
                    <button
                      className='wpchat:absolute wpchat:top-11 wpchat:end-1 wpchat:block wpchat:cursor-pointer wpchat:rounded-lg wpchat:border wpchat:border-gray-200 wpchat:p-2 wpchat:shadow-sm wpchat:transition-all wpchat:duration-200 wpchat:ease-in-out wpchat:md:invisible wpchat:md:opacity-0 wpchat:group-hover:md:visible wpchat:group-hover:md:opacity-100'
                      onClick={(event) => {
                        event.stopPropagation();
                        // reset custom
                        useChatStore.setState({
                          chatbotCustomAvatar: '',
                          chatbotCustomName: '',
                        });
                        // move to first option
                        const first = icons.find((i) => !i.isCustom);
                        if (first) {
                          useChatStore.setState({
                            chatbotAvatar: first.icon,
                            chatbotName: first.title,
                          });
                          onIconClick?.(first);
                        }
                      }}
                      aria-label={__('Clear', 'smashballoon-wpchat-livechat-customer-support')}
                    >
                      <SvgLoader
                        name='deleteOutline'
                        className='wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:fill-red-700'
                      />
                    </button>

                    {/* Custom image */}
                    {item?.icon ? (
                      <img
                        className='wpchat:h-full wpchat:w-full wpchat:rounded-full wpchat:object-cover'
                        src={item.icon}
                        alt={item.title}
                      />
                    ) : (
                      <div className='wpchat:h-full wpchat:w-full wpchat:rounded-full wpchat:bg-gray-300' />
                    )}
                  </>
                ) : (
                  <SvgLoader
                    name={item.icon}
                    style={{
                      fill: `oklch(${currentColor.lightness} ${currentColor.chroma} ${brandColor})`,
                    }}
                  />
                )}
              </div>

              {/* Show Pro badge only if icon is Pro and user is NOT Pro */}
              {item?.isPro && !isPro && (
                <SvgLoader name='lockedBadge' className='wpchat:absolute wpchat:top-1.5 wpchat:end-1.5' />
              )}

              {item.title && (
                <span className='wpchat:mt-2 wpchat:w-full wpchat:truncate wpchat:overflow-hidden wpchat:text-center wpchat:text-xs wpchat:leading-relaxed wpchat:font-semibold wpchat:break-words wpchat:whitespace-nowrap wpchat:text-gray-500 wpchat:group-hover:text-gray-900'>
                  {item.title}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Upgrade modal for pro icons */}
      <Modal isOpen={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...upgradeDialogData} />
        </Dialog>
      </Modal>
    </>
  );
}
