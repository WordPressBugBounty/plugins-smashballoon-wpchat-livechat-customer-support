import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { getAllPlatformLinks, trackPlatformRedirect } from '@FDataStore/Chat/chatApi';
import { logFunnelComplete } from '@FDataStore/Chat/analyticsApi';
import { getPlatformNameBySlug } from '@Utils/getPlatformNameBySlug';
import { isMobileDevice } from '@Utils/isMobileDevice';
import {
  formatOffHoursMessage,
} from '@FDataStore/Chat/offHoursHandler';

/**
 * Loading dots indicator while platform links are being fetched.
 */
function LoadingDots() {
  return (
    <div className='wpchat:flex wpchat:items-center wpchat:gap-1.5 wpchat:py-2'>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className='wpchat:inline-block wpchat:h-2 wpchat:w-2 wpchat:rounded-full wpchat:bg-slate-400 wpchat:animate-pulse'
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

/**
 * PlatformLinks component — fetches all platform agent links on mount and renders
 * each platform as a native <a> tag. This avoids async work between user gesture
 * and navigation, which Safari blocks with popup blockers.
 *
 * For SMS/Phone platforms on desktop, a QR code is shown instead of a link
 * (since tel:/sms: URIs don't work on desktop browsers).
 *
 * @param {Object} props
 * @param {Array<string>} props.platforms - Array of platform slugs to show.
 * @param {Object|null} props.storeApi - Zustand store API for funnel context.
 */
export default function PlatformLinks({ platforms, storeApi }) {
  const [links, setLinks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getAllPlatformLinks()
      .then((result) => {
        if (!cancelled) {
          // Check if ALL requested platforms errored or returned nothing
          const resolvedPlatforms = platforms.filter((p) => result.links[p]);
          if (resolvedPlatforms.length === 0) {
            // No usable links. Prefer a specific backend error (e.g. off-hours) when we
            // have one; otherwise fall back to a generic "no agents available" message
            // so we never render a blank bubble (e.g. when admin disabled every platform
            // between the widget bootstrap and this fetch).
            const offHoursError = Object.values(result.errors).find(
              (err) => err.error_type === 'agents_offline_off_hours'
            );
            if (offHoursError) {
              setError(formatOffHoursMessage(offHoursError.off_hours_data));
            } else {
              const firstError = Object.values(result.errors)[0];
              setError(
                firstError?.message ||
                  __('Sorry, no agents are available at the moment. Please try again later.', 'smashballoon-wpchat-livechat-customer-support')
              );
            }
          } else {
            setLinks(result.links);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            __('Sorry, no agents are available at the moment. Please try again later.', 'smashballoon-wpchat-livechat-customer-support')
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = (platform, agentId) => {
    // NOTE: storeApi is null for messages restored from localStorage. Funnel analytics won't fire in that case — acceptable trade-off.
    const { funnelContext, clearFunnelContext } = storeApi
      ? storeApi.getState()
      : { funnelContext: null, clearFunnelContext: () => {} };

    if (funnelContext) {
      const { funnelId, funnelName, completionBlock, blockMessage } = funnelContext;

      logFunnelComplete(funnelId, funnelName || '', completionBlock, 'converted', {
        completion_block: completionBlock,
        block_message: blockMessage,
        selected_platform: platform,
      });

      trackPlatformRedirect(platform, agentId, 'funnel', funnelId);
      clearFunnelContext();
    } else {
      trackPlatformRedirect(platform, agentId, 'chat', null);
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!links) {
    return <LoadingDots />;
  }

  // Filter to only platforms that resolved successfully
  const availableLinks = platforms.filter((p) => links[p]);
  const isMobile = isMobileDevice();

  return (
    <div className='wpchat:pt-4'>
      {availableLinks.map((platform) => {
        const data = links[platform];
        const isSmsOrPhone = platform === 'sms' || platform === 'phone';

        // SMS/Phone on desktop: show QR code on click
        if (isSmsOrPhone && !isMobile) {
          return (
            <button
              key={platform}
              type='button'
              className='wpchat:me-1 wpchat:mb-1.5 wpchat:inline-block wpchat:cursor-pointer wpchat:rounded-2xl wpchat:border wpchat:border-solid wpchat:bg-transparent wpchat:px-5 wpchat:py-1 wpchat:text-base wpchat:text-widget-accent-1 wpchat:hover:border-transparent wpchat:hover:bg-widget-accent-1 wpchat:hover:text-white'
              onClick={() => {
                handleClick(platform, data.agent_id);
                if (storeApi) {
                  storeApi.getState().setChatMessages((prev) => [
                    ...prev,
                    {
                      type: 'qr_code',
                      messageType: 'receive',
                      data: {
                        platformName: getPlatformNameBySlug(platform),
                        link: data.link,
                        platform,
                      },
                    },
                  ]);
                }
              }}
            >
              {getPlatformNameBySlug(platform)}
            </button>
          );
        }

        // All other platforms (and SMS/Phone on mobile): native <a> tag
        return (
          <a
            key={platform}
            href={data.link}
            target='_blank'
            rel='noopener noreferrer'
            className='wpchat:me-1 wpchat:mb-1.5 wpchat:inline-block wpchat:cursor-pointer wpchat:rounded-2xl wpchat:border wpchat:border-solid wpchat:bg-transparent wpchat:px-5 wpchat:py-1 wpchat:text-base wpchat:no-underline wpchat:text-widget-accent-1 wpchat:hover:border-transparent wpchat:hover:bg-widget-accent-1 wpchat:hover:text-white'
            onClick={() => handleClick(platform, data.agent_id)}
          >
            {getPlatformNameBySlug(platform)}
          </a>
        );
      })}
    </div>
  );
}
