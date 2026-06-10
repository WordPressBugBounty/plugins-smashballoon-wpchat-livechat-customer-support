import React from 'react';
import { Focusable, TooltipTrigger } from 'react-aria-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Tooltip } from '@AC/ui/Tooltip';
import SvgLoader from '@Components/SvgLoader';
import { freePlatforms } from '@Utils/getPlatforms';

/**
 * Shared component that displays platform status for an agent card.
 * Shows configured platform icons, a warning badge for missing platforms,
 * and accepts children (e.g. pro-only badges like off-hours).
 *
 * @param {Object} props
 * @param {Object} props.platforms - Agent's platform configuration keyed by slug.
 * @param {Object} props.settings - Global agent settings.
 * @param {React.ReactNode} [props.children] - Additional badge elements (e.g. off-hours badge).
 */
export default function AgentPlatformStatus({ platforms, settings, children }) {
  const enabledPlatforms = Object.entries(settings?.agentSettings?.platforms || {})
    .filter(([, platform]) => platform?.enabled === true)
    .map(([key]) => key);

  if (enabledPlatforms.length === 0) {
    return children || null;
  }

  const platformEntries = Object.entries(platforms || {}).filter(
    ([key, value]) => enabledPlatforms.includes(key) && value && String(value).trim() !== '',
  );

  const configuredPlatformKeys = platformEntries.map(([key]) => key);

  const missingPlatformCount = enabledPlatforms.length - platformEntries.length;

  const getPlatformLabel = (slug) => {
    const platform = freePlatforms.find((p) => p.slug === slug);
    return platform?.label || slug;
  };

  const missingPlatformNames = enabledPlatforms
    .filter((key) => !configuredPlatformKeys.includes(key))
    .map(getPlatformLabel)
    .join(', ');

  const hasConfigured = platformEntries.length > 0;
  const hasChildren = React.Children.count(children) > 0;

  if (!hasConfigured && missingPlatformCount === 0 && !hasChildren) {
    return null;
  }

  if (!hasConfigured && !hasChildren) {
    return (
      <ul className='wpchat:text-gray-500 wpchat:mt-2 wpchat:flex wpchat:list-none wpchat:items-center wpchat:gap-1.5 wpchat:ps-0 wpchat:text-xs'>
        <TooltipTrigger delay={0}>
          <Focusable>
            <li className='wpchat:bg-amber-50 wpchat:border-amber-100 wpchat:text-amber-700 wpchat:relative wpchat:mb-0 wpchat:cursor-pointer wpchat:rounded-4xl wpchat:border wpchat:py-1 wpchat:pe-3 wpchat:ps-6 wpchat:leading-relaxed wpchat:font-semibold'>
              <SvgLoader
                name='warning'
                className='wpchat:fill-amber-700 wpchat:absolute wpchat:top-1.5 wpchat:start-1.5 wpchat:h-[1.1em] wpchat:w-[1.1em]'
              />
              {__(
                'No platforms configured',
                'smashballoon-wpchat-livechat-customer-support',
              )}
            </li>
          </Focusable>
          <Tooltip placement='top'>
            {sprintf(
              /* translators: %1$s: platform names, %2$s: "is" or "are" */
              __('%1$s %2$s enabled but not configured', 'smashballoon-wpchat-livechat-customer-support'),
              missingPlatformNames,
              enabledPlatforms.length > 1 ? __('are', 'smashballoon-wpchat-livechat-customer-support') : __('is', 'smashballoon-wpchat-livechat-customer-support'),
            )}
          </Tooltip>
        </TooltipTrigger>
      </ul>
    );
  }

  return (
    <ul className='wpchat:text-gray-500 wpchat:mt-2 wpchat:flex wpchat:list-none wpchat:items-center wpchat:gap-1.5 wpchat:ps-0 wpchat:text-xs'>
      {platformEntries.map(([key]) => (
        <li key={key} className='wpchat:mb-0'>
          <SvgLoader name={key} className='wpchat:fill-gray-500 wpchat:h-[1.5em] wpchat:w-[1.5em]' />
        </li>
      ))}
      {missingPlatformCount > 0 && (
        <TooltipTrigger delay={0}>
          <Focusable>
            <li className='wpchat:bg-amber-50 wpchat:border-amber-100 wpchat:text-amber-700 wpchat:relative wpchat:mb-0 wpchat:cursor-pointer wpchat:rounded-4xl wpchat:border wpchat:py-1 wpchat:pe-3 wpchat:ps-6 wpchat:leading-relaxed wpchat:font-semibold'>
              <SvgLoader
                name='warning'
                className='wpchat:fill-amber-700 wpchat:absolute wpchat:top-1.5 wpchat:start-1.5 wpchat:h-[1.1em] wpchat:w-[1.1em]'
              />
              {sprintf(
                /* translators: %d: number of platforms not configured */
                _n(
                  '%d platform not configured',
                  '%d platforms not configured',
                  missingPlatformCount,
                  'smashballoon-wpchat-livechat-customer-support',
                ),
                missingPlatformCount,
              )}
            </li>
          </Focusable>
          <Tooltip placement='top'>
            {sprintf(
              /* translators: %1$s: platform names, %2$s: "is" or "are" */
              __('%1$s %2$s enabled but not configured', 'smashballoon-wpchat-livechat-customer-support'),
              missingPlatformNames,
              missingPlatformCount > 1 ? __('are', 'smashballoon-wpchat-livechat-customer-support') : __('is', 'smashballoon-wpchat-livechat-customer-support'),
            )}
          </Tooltip>
        </TooltipTrigger>
      )}
      {children}
    </ul>
  );
}
