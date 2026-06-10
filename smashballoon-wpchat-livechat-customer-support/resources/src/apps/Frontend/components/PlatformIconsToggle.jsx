import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SvgLoader from '@Components/SvgLoader';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import { computeActivePlatformSlugs } from '@FDataStore/Chat/chatStoreFactory';
import { cn } from '@Utils/cn';

const PLATFORM_STYLES = {
  whatsapp: {
    gradient: 'linear-gradient(179.66deg, #57d163 6.25%, #23b33a 91.21%)',
    glow: 'rgba(224,255,158,0.45)',
  },
  telegram: {
    gradient: 'linear-gradient(203.2deg, #37aee2 21.67%, #1e96c8 82.08%)',
    glow: 'rgba(158,242,255,0.45)',
  },
  messenger: {
    gradient: 'radial-gradient(circle at 17% 100%, #0099FF 0%, #A033FF 60%, #FF5280 90%, #FF7061 100%)',
    glow: 'rgba(255,255,255,0.45)',
  },
  instagram: {
    gradient: 'linear-gradient(44.41deg, #f6640e 3%, #ba03a7 66%, #6a01b9 128%)',
    glow: 'rgba(255,255,255,0.45)',
  },
  sms: {
    gradient: 'linear-gradient(to top, #0CBD2A 0%, #5BF675 100%)',
    glow: 'rgba(224,255,158,0.45)',
  },
  phone: {
    gradient: 'linear-gradient(to top, #0CBD2A 0%, #5BF675 100%)',
    glow: 'rgba(224,255,158,0.45)',
  },
};

const CLOSE_STYLE = {
  gradient: 'var(--wpchat-color-close-button-gradient)',
};

const PLATFORM_DISPLAY_NAMES = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  messenger: 'FB Messenger',
  instagram: 'Instagram',
  sms: 'SMS',
  phone: 'Phone',
};

const ICON_SHADOW = '4px 3px 3px -4px rgba(0,0,0,0.2), 0 10px 31px -3px rgba(0,0,0,0.1)';

const SPRING_HOVER = { stiffness: 500, damping: 35 };
const SPRING_COLLAPSE = { stiffness: 400, damping: 35 };
const SPRING_EXPAND = { stiffness: 300, damping: 35 };
const SPRING_LAYOUT = { type: 'spring', stiffness: 500, damping: 35 };
const SPRING_X_ICON = { stiffness: 400, damping: 28 };
const TWEEN_FADE = { duration: 0.2, ease: [0.4, 0, 0.2, 1] };
const TOOLTIP_TRANSITION = { duration: 0.15, ease: [0.4, 0, 0.2, 1] };

function getRotation(index, count) {
  const maxDist = Math.max(count - 1, 1);
  const distFromRight = count - 1 - index;
  return 30 + 330 * (distFromRight / maxDist);
}

export default function PlatformIconsToggle({ isOpen, onToggle, iconShape, iconPosition = 'right', iconAnimation = 'none' }) {
  const platformOrder = useChatStore((s) => s.platformOrder);
  const platformVisibility = useChatStore((s) => s.platformVisibility);
  const availablePlatforms = useChatStore((s) => s.availablePlatforms);

  const activeSlugs = useMemo(
    () => computeActivePlatformSlugs(platformOrder, platformVisibility, availablePlatforms),
    [platformOrder, platformVisibility, availablePlatforms],
  );

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState(null);
  const [tooltipsReady, setTooltipsReady] = useState(true);
  const wasOpenRef = useRef(false);
  const count = activeSlugs.length;
  // With a single icon the row-style hover effects (pill backdrop, dock
  // magnification) look like glitches — keep only the tooltip in that case.
  const isSingle = count === 1;
  const isLeftPosition = iconPosition === 'left';

  // Always animate BOTH margin sides — the inactive side is forced to 0 so
  // Framer Motion clears any value left over from the previous position.
  // Without this, switching Bottom Left → Bottom Right (or vice-versa)
  // leaves the old margin applied alongside the new one, doubling the
  // spacing between icons.
  const marginAnimate = (value) => isLeftPosition
    ? { marginRight: value, marginLeft: 0 }
    : { marginLeft: value, marginRight: 0 };
  const marginTransitions = (transition) => ({ marginLeft: transition, marginRight: transition });

  useEffect(() => {
    if (isOpen) {
      setTooltipsReady(false);
    } else {
      const id = setTimeout(() => setTooltipsReady(true), 400);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  if (count === 0) return null;

  const isRounded = iconShape === 'roundedRectangle';

  const handleClick = () => {
    wasOpenRef.current = isOpen;
    onToggle();
  };

  function getMargin(index) {
    if (isOpen) return index === 0 ? 0 : -48;
    if (isPressed) return index === 0 ? 0 : -10;
    if (isHovered) return index === 0 ? 0 : -6;
    return index === 0 ? 0 : -10;
  }

  function getDelay(index) {
    if (wasOpenRef.current) return index * 0.03;
    return (count - 1 - index) * 0.03;
  }

  function renderTooltip(slug) {
    return (
      <AnimatePresence>
        {hoveredSlug === slug && !isOpen && tooltipsReady && (
          <motion.div
            className="wpchat:absolute wpchat:left-1/2 wpchat:-translate-x-1/2 wpchat:bottom-full wpchat:mb-2 wpchat:px-2.5 wpchat:py-1.5 wpchat:rounded-lg wpchat:bg-gray-900 wpchat:text-white wpchat:text-xs wpchat:whitespace-nowrap wpchat:pointer-events-none wpchat:origin-bottom"
            style={{ zIndex: count + 2 }}
            initial={{ opacity: 0, scale: 0.95, y: 4, filter: 'blur(2px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 4, filter: 'blur(2px)' }}
            transition={TOOLTIP_TRANSITION}
          >
            {PLATFORM_DISPLAY_NAMES[slug] || slug}
            <div className="wpchat:absolute wpchat:left-1/2 wpchat:-translate-x-1/2 wpchat:top-full wpchat:border-4 wpchat:border-transparent wpchat:border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  function getDockItemStyle(slug, i) {
    if (isSingle) return {};
    const isFirst = i === 0;
    const isLast = i === count - 1;
    // In row-reverse (left position), visual first/last are swapped
    const isVisualFirst = isLeftPosition ? isLast : isFirst;
    const isVisualLast = isLeftPosition ? isFirst : isLast;
    const isDockHovered = isHovered && !isOpen && hoveredSlug;
    const isThisHovered = hoveredSlug === slug;

    return {
      transition: 'padding 300ms ease-out, margin 300ms ease-out',
      zIndex: isThisHovered ? 50 : undefined,
      ...(isDockHovered && !isThisHovered
        ? { marginInline: '-2px' }
        : {}),
      ...(isThisHovered && !isOpen
        ? { [isVisualFirst ? 'paddingRight' : isVisualLast ? 'paddingLeft' : 'paddingInline']: '12px' }
        : {}),
    };
  }

  return (
    <motion.div
      className={cn(
        'wpchat:group wpchat:relative wpchat:flex wpchat:items-center wpchat:isolate',
        iconAnimation === 'pulse' && !isOpen && 'pulse-ring',
      )}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => { setIsHovered(false); setIsPressed(false); }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      data-open={isOpen || undefined}
      style={{
        cursor: 'pointer',
        flexDirection: isLeftPosition ? 'row-reverse' : 'row',
        '--pulse-inset': '-10px -14px',
        '--pulse-radius': isRounded ? '16px' : '32px',
      }}
    >
      {/* Hover pill — inline styles for glass effect (Shadow DOM safe).
          Skipped for a single icon: the pill is meant as a backdrop for a row
          of icons and looks like a stray glow when there's only one. */}
      {!isSingle && (
        <motion.div
          className="wpchat:absolute wpchat:inset-x-[-14px] wpchat:inset-y-[-10px] wpchat:rounded-[32px]"
          style={{
            zIndex: -1,
            pointerEvents: 'none',
            transformOrigin: iconPosition === 'left' ? 'left center' : 'right center',
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 0 0 3px rgba(0,0,0,0.05)',
          }}
          initial={false}
          animate={{
            scale: isHovered && !isOpen ? 1 : 0.8,
            opacity: isHovered && !isOpen ? 1 : 0,
          }}
          whileTap={!isOpen ? { scale: 0.97, transformOrigin: 'center center' } : undefined}
          transition={{
            scale: { type: 'spring', ...SPRING_HOVER },
            opacity: TWEEN_FADE,
          }}
        />
      )}

      {/* Platform icons */}
      <AnimatePresence initial={false}>
      {activeSlugs.map((slug, i) => {
        const isLast = i === count - 1;
        const style = PLATFORM_STYLES[slug] || PLATFORM_STYLES.whatsapp;
        const delay = getDelay(i);
        const margin = getMargin(i);

        const marginTransition = {
          type: 'spring',
          ...(isOpen ? SPRING_COLLAPSE : isHovered ? SPRING_HOVER : SPRING_EXPAND),
          delay: isOpen ? delay : 0,
        };

        if (isLast) {
          // Keep the last icon in place when open so the close button
          // appears at the original icon position, not the collapsed stack.
          const lastMargin = isOpen ? (i === 0 ? 0 : -10) : margin;

          return (
            <motion.div
              layout
              key={slug}
              initial={false}
              animate={{
                ...marginAnimate(lastMargin),
                scale: 1,
                opacity: 1,
                rotate: 0,
                filter: 'blur(0px)',
              }}
              exit={{ scale: 0.8, opacity: 0, transition: TWEEN_FADE }}
              transition={{
                layout: SPRING_LAYOUT,
                ...marginTransitions(marginTransition),
                scale: SPRING_LAYOUT,
                opacity: TWEEN_FADE,
                rotate: SPRING_LAYOUT,
                filter: TWEEN_FADE,
              }}
              style={{
                zIndex: count - i,
                pointerEvents: isOpen ? 'none' : 'auto',
              }}
              onMouseEnter={() => { if (!isOpen) setHoveredSlug(slug); }}
              onMouseLeave={() => setHoveredSlug(null)}
            >
              {/* Bounce wrapper — CSS keyframes (independent of Framer Motion context) */}
              <div
                className={iconAnimation === 'bounce' && !isOpen ? 'icon-bounce' : undefined}
                style={{ '--bounce-delay': `${i * 0.1}s` }}
              >
                {/* Dock-item wrapper for magnification */}
                <div style={getDockItemStyle(slug, i)}>
                  {renderTooltip(slug)}
                  <div
                    className={cn(
                      'wpchat:relative wpchat:flex wpchat:size-12 wpchat:shrink-0 wpchat:items-center wpchat:justify-center',
                      isRounded ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
                    )}
                  >
                    {/* Inner platform bubble — animates scale/rotate/opacity/blur */}
                    <motion.div
                      className={cn(
                        'platform-icon-bubble wpchat:absolute wpchat:inset-0 wpchat:flex wpchat:items-center wpchat:justify-center',
                        isRounded ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
                      )}
                      style={{
                        background: style.gradient,
                        boxShadow: ICON_SHADOW,
                        '--glow-color': style.glow,
                      }}
                      initial={false}
                      animate={
                        isOpen
                          ? { scale: 0, rotate: 30, opacity: 0, filter: 'blur(4px)' }
                          : { scale: 1, rotate: 0, opacity: 1, filter: 'blur(0px)' }
                      }
                      transition={SPRING_X_ICON}
                    >
                      <SvgLoader name={slug} className="wpchat:h-6 wpchat:w-6 wpchat:fill-white" />
                    </motion.div>

                    {/* Close button — same size-12 parent = exact same spot */}
                    <motion.div
                      className={cn(
                        'wpchat:absolute wpchat:inset-0 wpchat:flex wpchat:items-center wpchat:justify-center wpchat:overflow-hidden',
                        isRounded ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
                      )}
                      style={{
                        background: CLOSE_STYLE.gradient,
                        zIndex: count + 1,
                      }}
                      initial={false}
                      animate={
                        isOpen
                          ? { scale: 1, rotate: 0, opacity: 1, filter: 'blur(0px)' }
                          : { scale: 0, rotate: -180, opacity: 0, filter: 'blur(4px)' }
                      }
                      transition={{
                        scale: { type: 'spring', ...SPRING_X_ICON, delay: isOpen ? 0.075 : 0 },
                        rotate: { type: 'spring', ...SPRING_X_ICON, delay: isOpen ? 0.075 : 0 },
                        opacity: { ...TWEEN_FADE, delay: isOpen ? 0.075 : 0 },
                        filter: { ...TWEEN_FADE, delay: isOpen ? 0.075 : 0 },
                      }}
                    >
                      <div
                        className={cn('wpchat:absolute wpchat:inset-0 wpchat:pointer-events-none', isRounded ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full')}
                        style={{ boxShadow: 'inset 1px 1px 2px 0 rgba(255,158,158,0.45)' }}
                      /> 
                      <SvgLoader name="chevronDown" className="wpchat:h-9 wpchat:w-9 wpchat:fill-white" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }

        // Non-last icons
        return (
          <motion.div
            layout
            key={slug}
            initial={false}
            animate={{
              ...marginAnimate(isOpen ? -48 : margin),
              rotate: isOpen ? getRotation(i, count) : 0,
              scale: isOpen ? 0.5 : 1,
              opacity: isOpen ? 0 : 1,
              filter: isOpen ? 'blur(4px)' : 'blur(0px)',
            }}
            exit={{ scale: 0.8, opacity: 0, transition: TWEEN_FADE }}
            transition={{
              ...marginTransitions(marginTransition),
              rotate: { type: 'spring', ...(isOpen ? SPRING_COLLAPSE : SPRING_EXPAND), delay },
              scale: { type: 'spring', ...(isOpen ? SPRING_COLLAPSE : SPRING_EXPAND), delay },
              opacity: { ...TWEEN_FADE, delay },
              filter: { ...TWEEN_FADE, delay },
              layout: SPRING_LAYOUT,
            }}
            style={{
              zIndex: count - i,
              pointerEvents: isOpen ? 'none' : 'auto',
            }}
            onMouseEnter={() => { if (!isOpen) setHoveredSlug(slug); }}
            onMouseLeave={() => setHoveredSlug(null)}
          >
            {/* Bounce wrapper — CSS keyframes (independent of Framer Motion context) */}
            <div
              className={iconAnimation === 'bounce' && !isOpen ? 'icon-bounce' : undefined}
              style={{ '--bounce-delay': `${i * 0.1}s` }}
            >
              {/* Dock-item wrapper for magnification */}
              <div style={getDockItemStyle(slug, i)}>
                {renderTooltip(slug)}
                <div
                  className={cn(
                    'platform-icon-bubble wpchat:relative wpchat:flex wpchat:size-12 wpchat:items-center wpchat:justify-center',
                    isRounded ? 'wpchat:rounded-2xl' : 'wpchat:rounded-full',
                  )}
                  style={{
                    background: style.gradient,
                    boxShadow: ICON_SHADOW,
                    '--glow-color': style.glow,
                    pointerEvents: 'none',
                  }}
                >
                  <SvgLoader name={slug} className="wpchat:h-6 wpchat:w-6 wpchat:fill-white" />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>

    </motion.div>
  );
}
