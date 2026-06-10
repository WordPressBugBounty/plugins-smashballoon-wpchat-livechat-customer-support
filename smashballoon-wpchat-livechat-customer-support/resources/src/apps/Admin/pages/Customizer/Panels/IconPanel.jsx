import { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useShallow } from 'zustand/react/shallow';
import IconGrid from '@AC/Customizer/IconGrid';
import IconTypeSelect from '@AC/Customizer/IconTypeSelect';
import { CardRadioGroup, CardRadio } from '@AC/ui/CardRadioGroup';
import { AccordionGroup, AccordionItem } from '@AC/ui/Disclosure';
import { VisibilityReorderList } from '@AC/ui/VisibilityReorderList';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { PLATFORM_CONFIG } from '@AConfig/platformConfig';

const PLATFORM_COLOR_ICONS = {
  whatsapp: 'whatsappColor',
  instagram: 'instagramColor',
  telegram: 'telegramColor',
  messenger: 'messengerColor',
  sms: 'smsColor',
  phone: 'phoneColor',
};

const SHAPE_LABELS = {
  circle: __('Circle', 'smashballoon-wpchat-livechat-customer-support'),
  roundedRectangle: __('Rounded Rectangle', 'smashballoon-wpchat-livechat-customer-support'),
};

const POSITION_LABELS = {
  right: __('Right', 'smashballoon-wpchat-livechat-customer-support'),
  left: __('Left', 'smashballoon-wpchat-livechat-customer-support'),
};

const ANIMATION_LABELS = {
  none: __('None', 'smashballoon-wpchat-livechat-customer-support'),
  bounce: __('Bounce', 'smashballoon-wpchat-livechat-customer-support'),
  pulse: __('Pulse', 'smashballoon-wpchat-livechat-customer-support'),
};

const chatToggleIcons = [
  { icon: 'chatBubbleLogo', isPro: false },
  { icon: 'chatBubble', isPro: true },
  { icon: 'chatBubbleDots', isPro: true },
  { icon: 'chatQuestionMark', isPro: true },
  { icon: 'ChatBubbleSmile', isPro: true },
  { icon: 'chatBubbleEyes', isPro: true },
];

function OffsetInput({ value, onChange, label, suffix, unit = __('px', 'smashballoon-wpchat-livechat-customer-support') }) {
  return (
    <div className="wpchat:flex wpchat:flex-1 wpchat:items-center wpchat:overflow-hidden wpchat:rounded-sm wpchat:border wpchat:border-gray-200 wpchat:shadow-sm">
      <div className="wpchat:flex wpchat:items-center wpchat:pl-3 wpchat:pr-1.5 wpchat:py-1.5">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            onChange(val === '' ? 0 : Number(val));
          }}
          className="wpchat:w-8 wpchat:border-0 wpchat:p-0 wpchat:text-xs wpchat:text-gray-900 wpchat:outline-none wpchat:min-h-5"
          aria-label={label}
        />
        <span className="wpchat:text-xs wpchat:text-gray-500">{unit}</span>
      </div>
      <span className="wpchat:flex-1 wpchat:border-l wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:px-2 wpchat:py-2 wpchat:text-xs wpchat:text-gray-700">
        {suffix}
      </span>
    </div>
  );
}

function usePlatformSync(availablePlatforms, setPlatformOrder, setPlatformVisibility) {
  const enabledPlatforms = useMemo(() => {
    return (availablePlatforms || []).map((slug) => ({
      slug,
      name: PLATFORM_CONFIG[slug]?.name || slug,
      colorIcon: PLATFORM_COLOR_ICONS[slug] || slug,
    }));
  }, [availablePlatforms]);

  const platformLookup = useMemo(() => {
    const map = {};
    for (const p of enabledPlatforms) map[p.slug] = p;
    return map;
  }, [enabledPlatforms]);

  // Seed + merge order
  useEffect(() => {
    const currentOrder = useChatStore.getState().platformOrder;
    const slugs = enabledPlatforms.map((p) => p.slug);
    if (!slugs.length) return;
    if (currentOrder === null) {
      setPlatformOrder(slugs);
      return;
    }
    const newSlugs = slugs.filter((s) => !currentOrder.includes(s));
    const filtered = currentOrder.filter((s) => slugs.includes(s));
    if (newSlugs.length > 0 || filtered.length !== currentOrder.length) {
      setPlatformOrder([...filtered, ...newSlugs]);
    }
  }, [enabledPlatforms, setPlatformOrder]);

  // Seed + merge visibility
  useEffect(() => {
    const currentVis = useChatStore.getState().platformVisibility;
    const slugs = enabledPlatforms.map((p) => p.slug);
    if (!slugs.length) return;
    if (currentVis === null) {
      setPlatformVisibility(Object.fromEntries(slugs.map((s) => [s, true])));
      return;
    }
    const updated = {};
    let changed = false;
    for (const slug of slugs) {
      updated[slug] = currentVis[slug] ?? true;
      if (!(slug in currentVis)) changed = true;
    }
    for (const slug of Object.keys(currentVis)) {
      if (!slugs.includes(slug)) changed = true;
    }
    if (changed) setPlatformVisibility(updated);
  }, [enabledPlatforms, setPlatformVisibility]);

  const platformOrder = useChatStore.getState().platformOrder;
  const platformVisibility = useChatStore.getState().platformVisibility;

  const orderedPlatformItems = useMemo(() => {
    if (!platformOrder) return enabledPlatforms;
    return platformOrder.map((slug) => platformLookup[slug]).filter(Boolean);
  }, [platformOrder, platformLookup, enabledPlatforms]);

  const enabledCount = platformVisibility
    ? Object.values(platformVisibility).filter(Boolean).length
    : enabledPlatforms.length;

  return { enabledPlatforms, orderedPlatformItems, enabledCount };
}

export default function IconPanel() {
  const {
    setShowChat, setChatToggleIcon,
    iconType, setIconType,
    iconShape, setIconShape,
    iconPosition, setIconPosition,
    iconPositionOffsetX, setIconPositionOffsetX,
    iconPositionOffsetY, setIconPositionOffsetY,
    iconAnimation, setIconAnimation,
    platformOrder, setPlatformOrder,
    platformVisibility, setPlatformVisibility,
    togglePlatformVisibility,
    availablePlatforms, fetchAvailablePlatforms,
  } = useChatStore(useShallow((s) => ({
    setShowChat: s.setShowChat,
    setChatToggleIcon: s.setChatToggleIcon,
    iconType: s.iconType,
    setIconType: s.setIconType,
    iconShape: s.iconShape,
    setIconShape: s.setIconShape,
    iconPosition: s.iconPosition,
    setIconPosition: s.setIconPosition,
    iconPositionOffsetX: s.iconPositionOffsetX,
    setIconPositionOffsetX: s.setIconPositionOffsetX,
    iconPositionOffsetY: s.iconPositionOffsetY,
    setIconPositionOffsetY: s.setIconPositionOffsetY,
    iconAnimation: s.iconAnimation,
    setIconAnimation: s.setIconAnimation,
    platformOrder: s.platformOrder,
    setPlatformOrder: s.setPlatformOrder,
    platformVisibility: s.platformVisibility,
    setPlatformVisibility: s.setPlatformVisibility,
    togglePlatformVisibility: s.togglePlatformVisibility,
    availablePlatforms: s.availablePlatforms,
    fetchAvailablePlatforms: s.fetchAvailablePlatforms,
  })));

  // Treat null (loading) as configured so the radio doesn't flicker disabled
  // on first paint — real state takes over once the fetch lands.
  const hasConfiguredPlatform = availablePlatforms === null || availablePlatforms.length > 0;

  // Frontend embed only fetches when iconType is 'platform' — customizer
  // needs the list regardless. Store dedupes internally.
  useEffect(() => {
    if (availablePlatforms === null) fetchAvailablePlatforms();
  }, [availablePlatforms, fetchAvailablePlatforms]);

  useEffect(() => {
    setShowChat(false);
    return () => setShowChat(true);
  }, [setShowChat]);

  // Auto-fall-back to 'custom' if the user removed all platforms while
  // iconType was 'platform'. Gated on availablePlatforms !== null so we
  // don't clobber a valid saved iconType during the initial fetch.
  useEffect(() => {
    if (availablePlatforms !== null && availablePlatforms.length === 0 && iconType === 'platform') {
      setIconType('custom');
    }
  }, [availablePlatforms, iconType, setIconType]);

  const { orderedPlatformItems, enabledCount } = usePlatformSync(
    availablePlatforms, setPlatformOrder, setPlatformVisibility,
  );

  const handleReorder = (reorderedItems) => {
    setPlatformOrder(reorderedItems.map((item) => item.slug));
  };

  const handleIconClick = ({ icon }) => {
    setShowChat(false);
    setChatToggleIcon(icon);
  };

  return (
    <div className="wpchat:flex wpchat:flex-col wpchat:gap-0 wpchat:pt-5 wpchat-panel-highlight">
      <IconTypeSelect
        value={iconType}
        onChange={setIconType}
        isPlatformDisabled={!hasConfiguredPlatform}
        disabledTooltipText={__(
          'Configure at least one platform in Agent Settings to enable this option.',
          'smashballoon-wpchat-livechat-customer-support',
        )}
      />

      <AccordionGroup className="wpchat-accordion-highlight wpchat:mt-6">
        {/* Enable & Reorder (platform mode) */}
        {iconType === 'platform' && (
          <AccordionItem
            id="enable-reorder"
            icon="displayEye"
            label={__('Enable & Reorder', 'smashballoon-wpchat-livechat-customer-support')}
            value={`${enabledCount} ${__('Enabled', 'smashballoon-wpchat-livechat-customer-support')}`}
          >
            <VisibilityReorderList
              items={orderedPlatformItems}
              visibilityMap={platformVisibility ?? {}}
              onReorder={handleReorder}
              onToggleVisibility={togglePlatformVisibility}
              keyExtractor={(item) => item.slug}
              renderContent={(item, isVisible) => (
                <>
                  <SvgLoader
                    name={item.colorIcon}
                    className={cn('wpchat:h-5 wpchat:w-5', !isVisible && 'wpchat:grayscale')}
                  />
                  <span className={cn(
                    'wpchat:flex-1 wpchat:text-sm',
                    isVisible ? 'wpchat:text-gray-900' : 'wpchat:text-gray-400'
                  )}>
                    {item.name}
                  </span>
                </>
              )}
              emptyMessage={__('No platforms configured. Go to Agent Settings to add platforms.', 'smashballoon-wpchat-livechat-customer-support')}
            />
          </AccordionItem>
        )}

        {/* Custom Icon (custom mode) */}
        {iconType === 'custom' && (
          <AccordionItem
            id="custom-icon"
            icon="messageIcon"
            label={__('Icon', 'smashballoon-wpchat-livechat-customer-support')}
          >
            <IconGrid icons={chatToggleIcons} onIconClick={handleIconClick} slug="icon" />
          </AccordionItem>
        )}

        {/* Shape */}
        <AccordionItem
          id="shape"
          icon="category"
          label={__('Shape', 'smashballoon-wpchat-livechat-customer-support')}
          value={SHAPE_LABELS[iconShape]}
        >
          <CardRadioGroup value={iconShape} onChange={setIconShape}>
            <CardRadio value="circle" title={SHAPE_LABELS.circle} />
            <CardRadio value="roundedRectangle" title={SHAPE_LABELS.roundedRectangle} />
          </CardRadioGroup>
        </AccordionItem>

        {/* Position */}
        <AccordionItem
          id="position"
          icon="compareArrows"
          label={__('Position', 'smashballoon-wpchat-livechat-customer-support')}
          value={POSITION_LABELS[iconPosition]}
        >
          <div className="wpchat:flex wpchat:flex-col wpchat:gap-4">
            <CardRadioGroup value={iconPosition} onChange={setIconPosition}>
              <CardRadio
                value="right"
                title={__('Bottom Right', 'smashballoon-wpchat-livechat-customer-support')}
              />
              <CardRadio
                value="left"
                title={__('Bottom Left', 'smashballoon-wpchat-livechat-customer-support')}
              />
            </CardRadioGroup>
            <div className="wpchat:flex wpchat:flex-col wpchat:gap-1">
              <p className="wpchat:m-0 wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900">
                {__('Offset', 'smashballoon-wpchat-livechat-customer-support')}
              </p>
              <div className="wpchat:flex wpchat:items-center wpchat:gap-3">
                <OffsetInput
                  value={iconPositionOffsetX}
                  onChange={setIconPositionOffsetX}
                  label={__('Horizontal offset', 'smashballoon-wpchat-livechat-customer-support')}
                  suffix={iconPosition === 'left'
                    ? __('from left', 'smashballoon-wpchat-livechat-customer-support')
                    : __('from right', 'smashballoon-wpchat-livechat-customer-support')}
                />
                <OffsetInput
                  value={iconPositionOffsetY}
                  onChange={setIconPositionOffsetY}
                  label={__('Vertical offset', 'smashballoon-wpchat-livechat-customer-support')}
                  suffix={__('from bottom', 'smashballoon-wpchat-livechat-customer-support')}
                />
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Animation */}
        <AccordionItem
          id="animation"
          icon="starShine"
          label={__('Animation', 'smashballoon-wpchat-livechat-customer-support')}
          value={ANIMATION_LABELS[iconAnimation]}
          borderless
        >
          <CardRadioGroup value={iconAnimation} onChange={setIconAnimation}>
            <CardRadio value="none" title={ANIMATION_LABELS.none} />
            <CardRadio value="bounce" title={ANIMATION_LABELS.bounce} />
            <CardRadio value="pulse" title={ANIMATION_LABELS.pulse} />
          </CardRadioGroup>
        </AccordionItem>
      </AccordionGroup>
    </div>
  );
}
