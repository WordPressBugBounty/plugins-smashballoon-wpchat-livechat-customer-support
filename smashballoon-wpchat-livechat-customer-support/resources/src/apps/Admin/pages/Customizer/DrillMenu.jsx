import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { AnimatePresence, Reorder, motion } from 'motion/react';
import { TooltipTrigger, Button as RACButton } from 'react-aria-components';
import { __, sprintf } from '@wordpress/i18n';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { Tooltip } from '@AC/ui/Tooltip';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { useEntitlements } from '@AH/useEntitlements';
import SvgLoader from '@Components/SvgLoader';
import { useMenuStore } from '@DataStore/Customizer/menuStore';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import useFaqsStore from '@DataStore/faqs/faqsStore';
import { cn } from '@Utils/cn';
import { isPro } from '@Utils/isPro';
import { useRTL } from '@Hooks/useRTL';

/**
 * DrillMenu component displays a hierarchical drill-down menu interface.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.data - Menu data structure, typically with nested items.
 * @param {string} [props.className] - Optional additional class names for styling.
 *
 * @returns {JSX.Element} The rendered DrillMenu component.
 */
export const DrillMenu = ({ data, className }) => {
  const location = useLocation();
  const { stack, push, pop, direction, reset } = useMenuStore();
  const current = stack[stack.length - 1] || { title: '', children: data };
  const isRTL = useRTL();

  const [items, setItems] = useState(current.children || []);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isSectionOrderDialogOpen, setIsSectionOrderDialogOpen] = useState(false);
  const [menuItem, setMenuItem] = useState(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  // SR announcement for keyboard reordering
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');
  const panelHeadingRef = useRef(null);
  const panelContainerRef = useRef(null);

  const entitlements = useEntitlements();
  const { hasFullCustomizerEntitlement, hasWhiteLabelEntitlement, isPro: isProPlan } = entitlements;

  // Helper function to check if user has the required entitlement for an item
  const hasRequiredEntitlement = (item) => {
    if (!item.requiredEntitlement) {
      return hasFullCustomizerEntitlement;
    }
    return entitlements[item.requiredEntitlement] || false;
  };

  // Get upgrade dialog data for customizer features
  const getItemUpgradeDialogData = (item) => {
    const slug = item?.slug;
    return getUpgradeDialogData(slug, {
      isPro: isProPlan,
      isFeatureAccess: true, // This is feature access, not limits
      ...upgradeConfigs[slug] || upgradeConfigs.customizer,
    });
  };
  
  const upgradeDialogData = getItemUpgradeDialogData(menuItem);

  // Get section order dialog data specifically for drag & drop functionality
  const sectionOrderDialogData = getUpgradeDialogData('sectionOrder', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.sectionOrder,
  });


  const reorderableKeys = useChatStore((s) => s.reorderableKeys);
  const toggleVisibleKey = useChatStore((s) => s.toggleVisibleKey);
  const setReorderableKeys = useChatStore((s) => s.setReorderableKeys);
  const visibleMap = useChatStore((s) => s.visibleMap);
  const navigateViaStore = useChatStore((s) => s.navigateViaStore);
  const totalFaqs = useFaqsStore((s) => s.pagination.totalFaqs);

  // Check if visibility toggle should be disabled for an item
  const isVisibilityDisabled = (item) => {
    if (item?.visibilityRequires === 'faqs' && totalFaqs === 0) {
      return true;
    }
    return false;
  };

  // Get tooltip message for disabled visibility toggle
  const getVisibilityDisabledTooltip = (item) => {
    if (isVisibilityDisabled(item) && item?.visibilityDisabledTooltip) {
      return item.visibilityDisabledTooltip;
    }
    return null;
  };

  // Render visibility toggle button with optional tooltip
  const renderVisibilityButton = (item, isMenuLocked, stopPropagation = false) => {
    const isDisabled = isVisibilityDisabled(item);
    const tooltip = getVisibilityDisabledTooltip(item);

    const buttonContent = (
      <>
        {(!visibleMap[item?.slug] || isDisabled) && (
          <SvgLoader
            name='displayEyeOff'
            className={cn('wpchat:fill-gray-500', !isDisabled && 'wpchat:cursor-pointer', isDisabled && 'wpchat:cursor-not-allowed')}
          />
        )}
        {visibleMap[item?.slug] && !isDisabled && (
          <SvgLoader
            name='displayEye'
            className='wpchat:fill-wp-blue-500 wpchat:cursor-pointer'
          />
        )}
      </>
    );

    const handleClick = (e) => {
      if (stopPropagation && e?.stopPropagation) e.stopPropagation();
      if (isDisabled) return;
      if (isMenuLocked) {
        setMenuItem(item);
        setIsUpgradeDialogOpen(true);
      } else {
        toggleVisibility(item);
      }
    };

    if (tooltip) {
      return (
        <TooltipTrigger delay={0}>
          <RACButton
            data-draggable="false"
            aria-label={sprintf(
              /* translators: %s: section name */
              visibleMap[item?.slug]
                ? __('Hide %s', 'smashballoon-wpchat-livechat-customer-support')
                : __('Show %s', 'smashballoon-wpchat-livechat-customer-support'),
              item?.title ?? '',
            )}
            className="wpchat:bg-transparent wpchat:border-none wpchat:p-0 wpchat:outline-none wpchat:cursor-not-allowed"
            onPress={handleClick}
            excludeFromTabOrder={isDisabled}
          >
            {buttonContent}
          </RACButton>
          <Tooltip placement="top">{tooltip}</Tooltip>
        </TooltipTrigger>
      );
    }

    return (
      <button
        data-draggable="false"
        disabled={isDisabled}
        onClick={handleClick}
        title={visibleMap[item?.slug] ? __('Hide', 'smashballoon-wpchat-livechat-customer-support') : __('Show', 'smashballoon-wpchat-livechat-customer-support')}
        aria-label={sprintf(
          /* translators: %s: section name */
          visibleMap[item?.slug]
            ? __('Hide %s', 'smashballoon-wpchat-livechat-customer-support')
            : __('Show %s', 'smashballoon-wpchat-livechat-customer-support'),
          item?.title ?? '',
        )}
      >
        {buttonContent}
      </button>
    );
  };

  // Update items when current changes (fixes blank state issue)
  useEffect(() => {
    setItems(current.children || []);
  }, [current]);

  // Track initial mount for animation purposes
  useEffect(() => {
    // After initial render, set to false
    setIsInitialMount(false);
  }, []);

  // a11y: when a panel is pushed/popped, move focus to the new panel's
  // heading so keyboard/SR users land on the context change.
  useEffect(() => {
    if (isInitialMount) {
      return;
    }
    requestAnimationFrame(() => {
      // During the exit animation the ref can still point at the OUTGOING
      // panel's heading — only use it if it belongs to the current panel.
      const heading = panelHeadingRef.current;
      const target = heading && heading.dataset.slug === (current.slug ?? '') ? heading : panelContainerRef.current;
      target?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.slug]);

  const handleBack = () => {
    navigateViaStore('/');
    pop();
  };

  useEffect(() => {
    // Only consider items as sortable if they have the sortable flag AND user has entitlement AND draggable is not false
    const actualSortableItems = items.filter(
      (i) => i && i.sortable && i.draggable !== false && (i.upsellLevel !== 'menu' || hasFullCustomizerEntitlement),
    );
    const sortableMap = Object.fromEntries(actualSortableItems.map((i) => [i.slug, i]));

    const sortedSortable = reorderableKeys.map((key) => sortableMap[key]).filter(Boolean);

    const merged = items.map((item) => {
      if (!item) return item;
      const canSort =
        item.sortable && item.draggable !== false && (item.upsellLevel !== 'menu' || hasFullCustomizerEntitlement);
      if (canSort) {
        return sortedSortable.shift();
      }
      return item;
    });

    setItems(merged);
  }, [reorderableKeys, hasFullCustomizerEntitlement, current]);

  const toggleVisibility = (item) => {
    const key = item.slug;
    toggleVisibleKey(key);
  };

  const handleReorder = (newSortedItems) => {
    // Prevent reordering for free and basic users
    if (!hasFullCustomizerEntitlement) {
      setIsSectionOrderDialogOpen(true);
      return;
    }
    
    const newItems = [];
    let sortedIndex = 0;

    for (const item of items) {
      if (!item) {
        newItems.push(item);
        continue;
      }
      const canSort =
        item.sortable && item.draggable !== false && (item.upsellLevel !== 'menu' || hasFullCustomizerEntitlement);
      newItems.push(canSort ? newSortedItems[sortedIndex++] : item);
    }

    setItems(newItems);
    const newKeys = newItems
      .filter((i) => i && i.sortable && (i.upsellLevel !== 'menu' || hasFullCustomizerEntitlement))
      .map((i) => i.slug);
    setReorderableKeys(newKeys);
  };

  // Keyboard alternative to pointer drag: Arrow Up/Down on the drag handle
  const moveSortableItem = (item, delta) => {
    // Free/basic users can't reorder — surface the upsell and do NOT announce
    // a move that never happened (handleReorder would early-return here too).
    if (!hasFullCustomizerEntitlement) {
      setIsSectionOrderDialogOpen(true);
      return;
    }
    const sortableValues = items.filter(
      (i) =>
        i && i.sortable && i.draggable !== false && (i.upsellLevel !== 'menu' || hasFullCustomizerEntitlement),
    );
    const from = sortableValues.indexOf(item);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= sortableValues.length) {
      return;
    }
    const next = [...sortableValues];
    next.splice(from, 1);
    next.splice(to, 0, item);
    handleReorder(next);
    setReorderAnnouncement(
      sprintf(
        /* translators: 1: section name, 2: new position, 3: total number of sections */
        __('%1$s moved to position %2$d of %3$d', 'smashballoon-wpchat-livechat-customer-support'),
        item.title,
        to + 1,
        next.length,
      ),
    );
  };

  const renderHeadingSection = (item, key) => (
    <div
      key={key}
      className={cn(
        'wpchat:px-4 wpchat:py-2 wpchat:pt-8 wpchat:pb-2 wpchat:ps-5 wpchat:text-xs wpchat:font-semibold wpchat:text-gray-700 wpchat:uppercase',
        item.borderBottom && 'wpchat:border-border wpchat:border-b wpchat:border-gray-300',
      )}
    >
      {item.title}
    </div>
  );

  const renderIconLabel = (item) => {
    const isMenuLocked = item.upsellLevel === 'menu' && !hasRequiredEntitlement(item);
    return (
      <>
        {item.icon && <SvgLoader name={item.icon} />}
        <span
          className={cn(
            'wpchat:text-xs wpchat:font-semibold wpchat:text-gray-900 wpchat:flex wpchat:items-center',
            visibleMap[item.title] === false && 'wpchat:line-through wpchat:opacity-50',
          )}
        >
          {item.title}
          {isMenuLocked && <SvgLoader name='lockedBadgeText' className="wpchat:ms-1.5" />}
        </span>
      </>
    );
  };

  const renderDraggableItem = (item, key, drillable) => {
    const isMenuLocked = item.upsellLevel === 'menu' && !hasRequiredEntitlement(item);
    const isDragLocked = !hasFullCustomizerEntitlement; // Free and basic users can't drag
    
    return (
      <Reorder.Item
        key={key}
        value={item}
        as='div'
        className='wpchat:mb-0 wpchat:relative wpchat:flex wpchat:cursor-move wpchat:items-center wpchat:justify-between wpchat:py-2.5 wpchat:pe-3 wpchat:ps-5 wpchat:hover:bg-gray-50'
        onDragStart={(event) => {
          if (isDragLocked) {
            event.preventDefault();
            setIsSectionOrderDialogOpen(true);
          }
        }}
        onPointerDown={(event) => {
          if (isDragLocked) {
            // Allow interaction with buttons and other interactive elements
            const target = event.target;
            if (target.closest('[data-draggable="false"]')) {
              return;
            }
            
            // Set up a drag detection system
            let startX = event.clientX;
            let startY = event.clientY;
            
            const handlePointerMove = (moveEvent) => {
              const deltaX = Math.abs(moveEvent.clientX - startX);
              const deltaY = Math.abs(moveEvent.clientY - startY);
              
              if (deltaX > 5 || deltaY > 5) { // Drag threshold
                setIsSectionOrderDialogOpen(true);
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
              }
            };
            
            const handlePointerUp = () => {
              document.removeEventListener('pointermove', handlePointerMove);
              document.removeEventListener('pointerup', handlePointerUp);
            };
            
            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);
          }
        }}
      >
        <button
          type='button'
          data-draggable='false'
          aria-label={sprintf(
            /* translators: %s: section name */
            __('Reorder %s — use arrow keys to move up or down', 'smashballoon-wpchat-livechat-customer-support'),
            item.title,
          )}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              moveSortableItem(item, event.key === 'ArrowUp' ? -1 : 1);
            }
          }}
          className='wpchat:m-0 wpchat:flex wpchat:cursor-move wpchat:items-center wpchat:border-0 wpchat:bg-transparent wpchat:p-0 wpchat:pe-2.5'
        >
          <SvgLoader name='drag' className='wpchat:h-3 wpchat:w-1.5' />
        </button>
        {renderVisibilityButton(item, isMenuLocked)}
        <div className='wpchat:flex wpchat:flex-1 wpchat:flex-col wpchat:gap-0.5 wpchat:ps-3'>
          <div className='wpchat:flex wpchat:items-center wpchat:gap-2'>
            {renderIconLabel(item)}
          </div>
          {isVisibilityDisabled(item) && item.visibilityDisabledMessage && (
            <p className='wpchat:m-0 wpchat:text-xs wpchat:text-gray-500'>{item.visibilityDisabledMessage}</p>
          )}
        </div>
        <div className='wpchat:flex wpchat:items-center wpchat:gap-3'>
          {drillable && (
            <button
              data-draggable="false"
              aria-label={sprintf(
                /* translators: %s: section name */
                __('Open %s settings', 'smashballoon-wpchat-livechat-customer-support'),
                item.title,
              )}
              onClick={() => {
                if (isMenuLocked) {
                  setMenuItem(item);
                  setIsUpgradeDialogOpen(true);
                } else {
                  (item?.children || item?.component) && push(item)
                }
              }}
              className='wpchat:cursor-pointer'
            >
              <SvgLoader name='chevronRight' className='wpchat:rtl:rotate-180' />
            </button>
          )}
        </div>
      </Reorder.Item>
    );
  };

  const renderDrillableItem = (item, key) => {
    const isMenuLocked = item.upsellLevel === 'menu' && !hasRequiredEntitlement(item);
    return (
      <div
        key={key}
         className={cn(
          'wpchat:relative wpchat:flex wpchat:w-full wpchat:items-center wpchat:justify-between wpchat:py-2.5 wpchat:text-start wpchat:hover:bg-gray-50',
          item?.draggable !== false
            ? 'wpchat:px-5 wpchat:cursor-pointer'
            : 'wpchat:px-9 wpchat:pe-3'
        )}
        {...(!item?.sortable && {
          role: 'button',
          tabIndex: 0,
          'aria-label': item.title,
        })}
        onClick={() => {
          if (isMenuLocked) {
            setMenuItem(item);
            setIsUpgradeDialogOpen(true);
          } else {
            // For content-level upselling, allow navigation - blocking happens inside the component
            (item?.children || item?.component) && push(item)
          }
        }}
        onKeyDown={(event) => {
          // Only react to keys on the row itself, not bubbled from inner buttons
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        {item?.sortable && (
          <>
          {item?.draggable !== false &&  (
              <div className='wpchat:pe-2.5'>
              <SvgLoader name='drag' className='wpchat:h-3 wpchat:w-1.5' />
            </div>
          )}

            {renderVisibilityButton(item, isMenuLocked, true)}
          </>
        )}

        <div
          className={cn(
            'wpchat:flex',
            item?.sortable ? 'wpchat:flex-1 wpchat:flex-col wpchat:gap-0.5 wpchat:ps-3' : 'wpchat:items-center wpchat:gap-3',
          )}
        >
          <div className='wpchat:flex wpchat:items-center wpchat:gap-2'>
            {renderIconLabel(item)}
          </div>
          {isVisibilityDisabled(item) && item.visibilityDisabledMessage && (
            <p className='wpchat:m-0 wpchat:text-xs wpchat:text-gray-500'>{item.visibilityDisabledMessage}</p>
          )}
        </div>
        {/* Real drill affordance: the row itself can't be a button (it nests the visibility toggle) */}
        {item?.sortable && (item?.children || item?.component) && (
          <button
            type='button'
            aria-label={sprintf(
              /* translators: %s: section name */
              __('Open %s settings', 'smashballoon-wpchat-livechat-customer-support'),
              item.title,
            )}
            onClick={(event) => {
              event.stopPropagation();
              if (isMenuLocked) {
                setMenuItem(item);
                setIsUpgradeDialogOpen(true);
              } else {
                (item?.children || item?.component) && push(item);
              }
            }}
            className='wpchat:m-0 wpchat:flex wpchat:cursor-pointer wpchat:items-center wpchat:border-0 wpchat:bg-transparent wpchat:p-0'
          >
            <SvgLoader name='chevronRight' className='wpchat:rtl:rotate-180' />
          </button>
        )}
      </div>
    );
  };

  const renderLink = (item, key) => (
    <div
      key={key}
      className='wpchat:w-full wpchat:px-4 wpchat:py-3 wpchat:text-start wpchat:hover:bg-gray-50'
    >
      <button
        onClick={item.onClick}
        className='text-start wpchat:flex wpchat:w-full wpchat:items-center wpchat:gap-2'
      >
        {renderIconLabel(item)}
      </button>
    </div>
  );

  // RTL-aware slide directions
  const getSlideX = (ltrValue) => isRTL ? (ltrValue === '100%' ? '-100%' : '100%') : ltrValue;

  const variants = {
    initial: (dir) => ({
      // Always slide from left on initial mount or when reopening menu
      // Otherwise maintain drill behavior for navigation
      x: isInitialMount
        ? getSlideX('-100%')
        : (dir === 'forward' ? getSlideX('100%') : getSlideX('-100%')),
      opacity: 0.5,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
        type: 'spring',
        bounce: 0.15,
      },
    },
    exit: (dir) => ({
      x: dir === 'forward' ? getSlideX('-100%') : getSlideX('100%'),
      opacity: 0.5,
      transition: {
        duration: 0.4,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <div
      ref={panelContainerRef}
      tabIndex={-1}
      className={cn(
        'wpchat:relative wpchat:h-[calc(100vh-100px)] wpchat:w-full wpchat:overflow-x-hidden wpchat:overflow-y-auto wpchat:outline-none wpchat:md:max-w-sm',
        className,
      )}
    >
      <div role='status' aria-live='polite' className='wpchat:sr-only'>
        {reorderAnnouncement}
      </div>
      <AnimatePresence custom={direction}>
        <motion.div
          key={current.slug}
          custom={direction}
          variants={variants}
          initial='initial'
          animate='animate'
          exit='exit'
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='wpchat:absolute wpchat:top-0 wpchat:start-0 wpchat:h-full wpchat:w-full wpchat:overflow-y-auto wpchat:bg-white wpchat:pt-4'
        >
          {stack.length > 0 && (
            <div className='wpchat:border-b wpchat:border-gray-200 wpchat:px-5 wpchat:pt-1 wpchat:pb-5'>
              <button
                onClick={handleBack}
                className='wpchat:flex wpchat:cursor-pointer wpchat:items-center wpchat:pb-1 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-500'
              >
                <SvgLoader
                  name='chevronLeft'
                  className='wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:pe-0.5 wpchat:rtl:rotate-180'
                />
                {__('Back', 'smashballoon-wpchat-livechat-customer-support')}
              </button>
              <h2
                ref={panelHeadingRef}
                data-slug={current.slug ?? ''}
                tabIndex={-1}
                className='wpchat:m-0 wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:text-2xl wpchat:leading-relaxed wpchat:font-semibold wpchat:text-black wpchat:outline-none'
              >
                {current.title}
                {current.upsellLevel === 'content' && !isPro && <SvgLoader name='lockedBadgeText' />}
              </h2>
            </div>
          )}

          {current.component ? (
            <div className='wpchat:px-5'>
              {current.upsellLevel === 'content' && !hasRequiredEntitlement(current) ? (
                <div
                  role='button'
                  tabIndex={0}
                  aria-label={sprintf(
                    /* translators: %s: feature name */
                    __('Upgrade to unlock %s', 'smashballoon-wpchat-livechat-customer-support'),
                    current.title,
                  )}
                  className='wpchat:relative wpchat:cursor-pointer wpchat:select-none'
                  onClick={() => {
                    setIsUpgradeDialogOpen(true);
                    setMenuItem(current);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setIsUpgradeDialogOpen(true);
                      setMenuItem(current);
                    }
                  }}
                >
                  <div className='wpchat:pointer-events-none'>
                    {typeof current.component === 'function'
                      ? current.component()
                      : current.component}
                  </div>
                  <div className='wpchat:absolute wpchat:inset-0 wpchat:z-10' />
                </div>
              ) : (
                <>
                  {typeof current.component === 'function'
                    ? current.component()
                    : current.component}
                </>
              )}
            </div>
          ) : (
            <Reorder.Group
              as='div'
              axis='y'
              values={items.filter(
                (i) =>
                  i && i.sortable && i.draggable !== false && (i.upsellLevel !== 'menu' || hasFullCustomizerEntitlement),
              )}
              onReorder={handleReorder}
            >
              {items.map((item) => {
                if (!item) return null;
                const key = `${item.slug}`;
                if (item.type === 'headingSection') return renderHeadingSection(item, key);
                // Only allow sorting if item is sortable AND draggable AND user has entitlement (or doesn't require it)
                const canSort =
                  item.sortable && item.draggable !== false && (item.upsellLevel !== 'menu' || hasFullCustomizerEntitlement);
                if (canSort) return renderDraggableItem(item, key, item.children || item.component);
                if (item.sortable && !canSort) {
                  // Render as non-draggable but drillable item if sorting is disabled due to entitlements or draggable: false
                  return renderDrillableItem(item, key);
                }
                if (item.children || item.component) return renderDrillableItem(item, key);
                if (item.type === 'link') return renderLink(item, key);
                return null;
              })}
            </Reorder.Group>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Upgrade modal for locked customizer features */}
      <Modal isOpen={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...upgradeDialogData} />
        </Dialog>
      </Modal>
      
      {/* Section order modal for drag & drop functionality */}
      <Modal isOpen={isSectionOrderDialogOpen} onOpenChange={setIsSectionOrderDialogOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...sectionOrderDialogData} />
        </Dialog>
      </Modal>
    </div>
  );
};
