import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { __ } from '@wordpress/i18n';
import useNotificationsStore from '@DataStore/notifications/notificationsStore';
import { LinkButton } from './ui/LinkButton';
import SvgLoader from '@Components/SvgLoader';

/**
 * Color config matching the reference prototype.
 * Left border accent + filled icon circle.
 */
const NOTIFICATION_PRESETS = {
  default: {
    btnVariant: 'primary',
  },
  success: {
    btnVariant: 'tertiary',
  },
  warning: {
    btnVariant: 'amber',
  },
  error: {
    btnVariant: 'error',
  },
};

const MAX_VISIBLE = 3;
const STACK_OFFSET = 12;
const EXPAND_GAP = 12;

const CARD_SHADOW = '0px 4px 5px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.05)';

function getLinkProps(btn) {
  const isExternal =
    (Array.isArray(btn.attr) && btn.attr.includes('targetblank')) ||
    btn.newTab === true;
  return isExternal
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
}

function CardContent({ notification, colors }) {
  return (
    <div className="wpchat:flex wpchat:gap-6 wpchat:pr-6">
      {/* Custom image */}
      {(notification.image_url || (notification.image && notification.image.startsWith('http'))) && (
        <div className="wpchat:shrink-0">
          <div className="wpchat:flex wpchat:h-10 wpchat:w-10 wpchat:items-center wpchat:justify-center wpchat:overflow-hidden wpchat:rounded wpchat:bg-white">
            <img
              src={notification.image_url || notification.image}
              alt=""
              className="wpchat:h-full wpchat:w-full wpchat:object-contain"
            />
          </div>
        </div>
      )}

      {/* Text content */}
      <div className="wpchat:flex wpchat:flex-1 wpchat:min-w-0 wpchat:flex-col">
        <div className="wpchat:flex wpchat:flex-col" style={{ gap: '5px' }}>
          <h3 className="wpchat:m-0 wpchat:font-semibold wpchat:text-gray-900" style={{ fontSize: '18px', lineHeight: 1.4 }}>
            {notification.title}
          </h3>
          {notification.content_html ? (
            /* Safe: content_html is sanitized server-side via wp_kses before reaching the client */
            <div
              className={`wpchat:text-sm wpchat:text-gray-700 wpchat:[&_a]:text-blue-600 wpchat:[&_a]:underline wpchat:[&_p]:mb-3.5 notification-card-single${
                /wp:preformatted|<pre/i.test(notification.content_html || '') ? ' wpchat:mb-3.5' : ''
              }`}
              style={{ lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: notification.content_html }}
            />
          ) : (
            <p className="wpchat:m-0 wpchat:text-sm wpchat:text-gray-700 wpchat:pt-0" style={{ lineHeight: 1.6 }}>
              {notification.content}
            </p>
          )}
        </div>

        {/* Buttons */}
        {notification.btns && (
          <div className="wpchat:flex wpchat:flex-col wpchat:gap-1.5 wpchat:sm:flex-row">
            {notification.btns.primary?.text && notification.btns.primary?.url && (
              <LinkButton
                href={notification.btns.primary.url}
                variant={colors.btnVariant || 'primary'}
                {...getLinkProps(notification.btns.primary)}
              >
                {notification.btns.primary.text}
                <SvgLoader name='chevronRight' className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:rtl:rotate-180' />
              </LinkButton>
            )}
            {notification.btns.secondary?.text && notification.btns.secondary?.url && (
              <LinkButton
                href={notification.btns.secondary.url}
                variant="secondary"
                {...getLinkProps(notification.btns.secondary)}
              >
                {notification.btns.secondary.text}
              </LinkButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * NotificationStack — Stacked notification cards with motion animations.
 *
 * Collapsed: top card visible, actual cards peek behind with offset + scale.
 * Hover: all cards animate into expanded vertical layout.
 * Dismiss: card animates out with scale + opacity.
 */
export default function NotificationStack() {
  const { notifications, fetch, dismiss, isExpanded, setExpanded } = useNotificationsStore();
  const cardRefs = useRef([]);
  const containerRef = useRef(null);
  const [cardHeights, setCardHeights] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => !!window.wpChatAdmin?.notificationsEnabled,
  );

  useEffect(() => {
    const sync = () =>
      setNotificationsEnabled(!!window.wpChatAdmin?.notificationsEnabled);
    window.addEventListener('wpchat:settings-updated', sync);
    return () => window.removeEventListener('wpchat:settings-updated', sync);
  }, []);

  useEffect(() => {
    if (notificationsEnabled) {
      fetch();
    }
  }, [fetch, notificationsEnabled]);

  // isExpanded is global store state. Clicking a notification CTA navigates away
  // and unmounts this component before onMouseLeave can fire, leaving isExpanded
  // stuck true so the stack reopens on return. Force collapsed on mount/unmount.
  useEffect(() => {
    setExpanded(false);
    return () => setExpanded(false);
  }, [setExpanded]);

  // Measure card heights after render and on container resize
  useEffect(() => {
    const measureHeights = () => {
      const heights = cardRefs.current.map(
        (el) => el?.offsetHeight || 0,
      );
      setCardHeights(heights);
    };

    measureHeights();

    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(measureHeights);
    observer.observe(el);

    return () => observer.disconnect();
  }, [notifications]);

  const handleDismiss = useCallback(
    (id) => {
      dismiss(id);
    },
    [dismiss],
  );

  if (!notificationsEnabled || notifications.length === 0) {
    return null;
  }

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);
  const count = visibleNotifications.length;

  // Compute cumulative Y offsets for expanded state based on measured heights
  const expandedOffsets = visibleNotifications.map((_, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (cardHeights[i] || 0) + EXPAND_GAP;
    }
    return offset;
  });

  const totalExpandedHeight =
    expandedOffsets[count - 1] + (cardHeights[count - 1] || 0);

  // Number of dummy stack indicators behind the front card
  const dummyCount = Math.min(count - 1, 2);

  return (
    <div
      className="wpchat:flex wpchat:justify-center wpchat:pb-6"
      style={{ marginBottom: dummyCount > 0 ? `${dummyCount * STACK_OFFSET}px` : 0 }}
    >
      {/* Overlay — only when multiple notifications */}
      {count > 1 && (
        <motion.div
          className="wpchat:pointer-events-none wpchat:fixed wpchat:inset-0 wpchat:bg-black/40"
          style={{ zIndex: 110 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <div
        ref={containerRef}
        className="wpchat:relative wpchat:w-full"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        style={{
          zIndex: isExpanded && count > 1 ? 120 : 0,
          transition: isExpanded ? 'z-index 0s' : 'z-index 0s 0.3s',
        }}
      >
        {/* Invisible hover area that covers expanded cards */}
        {count > 1 && (
          <div
            className="wpchat:absolute wpchat:inset-0"
            style={{
              height: isExpanded ? `${totalExpandedHeight}px` : undefined,
            }}
          />
        )}

        {/* Dummy stack indicators — thin decorative strips peeking behind the front card */}
        {Array.from({ length: dummyCount }).map((_, i) => (
          <motion.div
            key={`stack-${i}`}
            className="wpchat:absolute wpchat:left-0 wpchat:right-0 wpchat:rounded-b-lg wpchat:border wpchat:border-t-0 wpchat:border-black/10 wpchat:bg-white"
            style={{
              bottom: `-${(i + 1) * STACK_OFFSET}px`,
              height: `${STACK_OFFSET}px`,
              boxShadow: CARD_SHADOW,
              zIndex: -1 - i,
              transform: `scale(${1 - (i + 1) * 0.02})`,
              transformOrigin: 'top center',
            }}
            animate={{ opacity: isExpanded ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          />
        ))}

        <AnimatePresence mode="popLayout">
          {visibleNotifications.map((notification, index) => {
            const colors =
              NOTIFICATION_PRESETS[notification.presets] || NOTIFICATION_PRESETS.default;

            return (
              <motion.div
                key={notification.id}
                layout
                className={`wpchat:w-full ${index === 0 ? 'wpchat:relative' : 'wpchat:absolute wpchat:left-0 wpchat:right-0 wpchat:top-0'}`}
                style={{
                  zIndex: count - index,
                  transformOrigin: 'top center',
                }}
                initial={index > 0 ? { opacity: 0, y: 0 } : undefined}
                animate={{
                  y: isExpanded ? expandedOffsets[index] : 0,
                  scale: 1,
                  opacity: isExpanded ? 1 : (index === 0 ? 1 : 0),
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div
                  ref={(el) => (cardRefs.current[index] = el)}
                  className="wpchat:relative wpchat:w-full wpchat:rounded-lg wpchat:border wpchat:border-black/10 wpchat:bg-white wpchat:p-5"
                  style={{
                    boxShadow: CARD_SHADOW,
                    pointerEvents: (!isExpanded && index > 0) ? 'none' : 'auto',
                  }}
                >
                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={() => handleDismiss(notification.id)}
                    className="wpchat:absolute wpchat:right-3 wpchat:top-3 wpchat:flex wpchat:h-5 wpchat:w-5 wpchat:cursor-pointer wpchat:items-center wpchat:justify-center wpchat:rounded-full wpchat:border-0 wpchat:bg-transparent wpchat:text-gray-400 wpchat:transition-colors hover:wpchat:bg-gray-100 hover:wpchat:text-gray-600"
                    aria-label={__(
                      'Dismiss notification',
                      'smashballoon-wpchat-livechat-customer-support',
                    )}
                  >
                    <SvgLoader name='close' className='wpchat:h-5 wpchat:w-5' />
                  </button>

                  <CardContent
                    notification={notification}
                    colors={colors}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
