import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
import { Tab, TabList, Tabs } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { __ } from '@wordpress/i18n';

// Free version tabs configuration
const getFreeTabsData = () => [
  {
    id: 'include',
    title: __('Display on all pages', 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Display the chat assistant globally.', 'smashballoon-wpchat-livechat-customer-support'),
  },
  {
    id: 'exclude',
    title: __("Don't display on any pages", 'smashballoon-wpchat-livechat-customer-support'),
    description: __('Hide chat assistant from all pages.', 'smashballoon-wpchat-livechat-customer-support'),
  },
];

/**
 * VisibilityTabs component - Simple visibility settings for free version
 * Only handles basic include/exclude mode selection
 *
 * @param {Object} props
 * @param {Object} props.value - Visibility settings object with mode
 * @param {Function} props.onChange - Function called when mode changes
 */
function VisibilityTabs({ value, onChange }) {
  const { mode: tab = 'include' } = value || { mode: 'include' };

  // Early return if no onChange handler provided
  if (!onChange) {
    console.warn('VisibilityTabs: onChange prop is required');
    return null;
  }

  // Memoize tabs data since translations don't change
  const tabsData = useMemo(() => getFreeTabsData(), []);

  // Handle tab changes
  const handleTabChange = useCallback((newTab) => {
    onChange({
      ...value,
      mode: newTab
    });
  }, [value, onChange]);

  return (
    <div className='wpchat:flex wpchat:flex-col wpchat:flex-wrap'>
      {/* Visibility Tabs */}
      <Tabs className='wpchat:mb-4' selectedKey={tab} onSelectionChange={handleTabChange}>
        <TabList
          aria-label='Chatbot Visibility Settings'
          className='wpchat:mb-8 wpchat:grid wpchat:gap-2.5 wpchat:md:mb-7.5 wpchat:md:grid-cols-2'
        >
          {tabsData.map(({ id, title, description }) => (
            <Tab
              key={id}
              id={id}
              className={twMerge(
                clsx(
                  'wpchat:border-gray-200 wpchat:relative wpchat:cursor-pointer wpchat:rounded-lg wpchat:border wpchat:bg-white wpchat:py-5 wpchat:pe-5 wpchat:ps-13 wpchat:shadow-md',
                  {
                    'wpchat:border-wp-light-blue-500': id === tab,
                  },
                ),
              )}
            >
              <span
                className={twMerge(
                  clsx(
                    'wpchat:border-gray-500 wpchat:absolute wpchat:top-6 wpchat:start-5 wpchat:h-4 wpchat:w-4 wpchat:rounded-full wpchat:border',
                    {
                      'wpchat:border-wp-light-blue-500 wpchat:border-5': id === tab,
                    },
                  ),
                )}
              ></span>
              <h6 className='wpchat:text-gray-800 wpchat:mt-0 wpchat:mb-1 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold'>
                {title}
              </h6>
              <p className='wpchat:admin-6 wpchat:m-0 wpchat:text-xs wpchat:leading-relaxed'>
                {description}
              </p>
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </div>
  );
}

export default VisibilityTabs;