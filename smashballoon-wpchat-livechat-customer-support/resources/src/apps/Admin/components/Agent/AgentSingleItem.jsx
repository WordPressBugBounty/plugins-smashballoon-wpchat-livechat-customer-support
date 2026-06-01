import React, { Suspense, lazy } from 'react';
import { TooltipTrigger } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { __ } from '@wordpress/i18n';
import Avatar from '@Components/Avatar';
import { Button } from '@AC/ui/Button';
import { Tooltip } from '@AC/ui/Tooltip';
import SvgLoader from '@Components/SvgLoader';
import { getAvatarFallback } from '@Utils/getAvatarFallback';
import { isPro } from '@Utils/isPro';

const AgentSingleItemPro = isPro
  ? lazy(() =>
      import('@ACPro/Agent/AgentSingleItemPro').then((module) => ({
        default: module.AgentSingleItemPro,
      })),
    )
  : null;

const AgentSingleItemProTimings = isPro
  ? lazy(() =>
      import('@ACPro/Agent/AgentSingleItemPro').then((module) => ({
        default: module.AgentSingleItemProTimings,
      })),
    )
  : null;

/**
 * Renders a single agent item with optional avatar, text, click, and delete functionality.
 *
 * @param {Object} props - Component props.
 * @param {string} [props.className=''] - Additional CSS classes for the container element.
 * @param {Function} [props.onClick=() => {}] - Callback when the item is clicked.
 * @param {string} [props.avatarClassName=''] - Additional CSS classes for the avatar element.
 * @param {string} [props.textClassName=''] - Additional CSS classes for the text element.
 * @param {Function} [props.onDelete=() => {}] - Callback when the delete action is triggered.
 * @param {boolean} [props.isLastAgent=false] - Indicates if this is the last agent in the list.
 * @param {Object} [props.agent={}] - The agent data object.
 * @param {Object} props.settings - Settings object for the agent.
 *
 * @returns {JSX.Element} The rendered AgentSingleItem component.
 */
export default function AgentSingleItem({
  className = '',
  onClick = () => {},
  avatarClassName = '',
  textClassName = '',
  onDelete = () => {},
  isLastAgent = false,
  agent = {},
  settings = {},
}) {
  const { name, avatar, schedule, platforms } = agent || {};
  const { start_time: startTime, end_time: endTime } = schedule || {};

  const fallback = getAvatarFallback(name);

  return (
    <div
      className={twMerge(
        'wpchat:relative wpchat:mb-2 wpchat:min-h-23 wpchat:rounded-lg wpchat:bg-white wpchat:py-5.5 wpchat:ps-24 wpchat:shadow-md',
        isPro ? 'wpchat:pe-32' : 'wpchat:pe-21',
        className,
      )}
    >
      <div className='wpchat:absolute wpchat:top-5 wpchat:start-5'>
        <Avatar file={avatar} fallback={fallback} className='wpchat:h-13 wpchat:w-13' />
      </div>

      <div>
        <h4
          className={twMerge(
            'wpchat:text-gray-900 wpchat:m-0 wpchat:text-sm wpchat:font-semibold',
            textClassName,
          )}
        >
          {name}
        </h4>
        <div className='wpchat:gap-2 wpchat:md:flex wpchat:md:gap-1.5'>
          {platforms?.whatsapp && (
            <p className={twMerge('wpchat:text-gray-500 wpchat:m-0 wpchat:text-sm', textClassName)}>
              {platforms.whatsapp}
            </p>
          )}
          {AgentSingleItemProTimings && (
            <Suspense>
              <AgentSingleItemProTimings startTime={startTime} endTime={endTime} />
            </Suspense>
          )}
        </div>
        {AgentSingleItemPro && (
          <Suspense>
            <AgentSingleItemPro platforms={platforms} settings={settings} agent={agent} />
          </Suspense>
        )}
      </div>
      <Button
        className={twMerge(
          'wpchat:absolute wpchat:top-2.5 wpchat:px-2 wpchat:py-1.5 wpchat:text-xs',
          isPro ? 'wpchat:end-13' : 'wpchat:end-2.5', // Conditionally add wpchat:end-5 if isPro is true
        )}
        variant='secondary'
        onPress={onClick}
      >
        <SvgLoader name='editOutline' />
        {__('Edit', 'smashballoon-wpchat-livechat-customer-support')}
      </Button>

      {/* Conditionally render the Delete button if isPro is valid */}
      {isPro && (
        <TooltipTrigger delay={0}>
          <Button
            className={`${isLastAgent ? '' : '[&_svg]:fill-amber-700'} wpchat:absolute wpchat:top-2.5 wpchat:end-2.5 wpchat:px-2 wpchat:py-1.5 wpchat:text-xs ${
              isLastAgent ? 'wpchat:opacity-50' : ''
            }`}
            variant={isLastAgent ? 'secondary' : 'danger'}
            aria-disabled={isLastAgent}
            onPress={(e) => {
              if (!isLastAgent) {
                onDelete(e);
              }
            }}
          >
            <SvgLoader
              name='deleteOutline'
              className='wpchat:h-[1.3em] wpchat:w-[1.3em]'
            />
          </Button>
          <Tooltip placement='top'>
            {isLastAgent
              ? __('You cannot delete the only agent', 'smashballoon-wpchat-livechat-customer-support')
              : __('Delete', 'smashballoon-wpchat-livechat-customer-support')}
          </Tooltip>
        </TooltipTrigger>
      )}
    </div>
  );
}
