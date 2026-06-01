import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import { cn } from '@Utils/cn';

/**
 * A submenu component that appears on hover and allows selecting between
 * creating a new block or linking an existing block.
 *
 * @param {Object} props - Component props.
 * @param {(action: 'create-new' | 'link-existing') => void} [props.onSelect] - Callback fired when an option is selected.
 * @returns {JSX.Element} Rendered SubMenuComponent.
 */
export default function SubMenuComponent({ onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="wpchat:relative wpchat:w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        variant="ghost"
        className={cn(
          'wpchat:w-full wpchat:justify-start wpchat:px-2 wpchat:text-start'
        )}
      >
        {__('To Another Block', 'smashballoon-wpchat-livechat-customer-support')}
      </Button>

      {isHovered && (
        <div className="wpchat:absolute wpchat:start-full wpchat:top-0 wpchat:ms-2 wpchat:mt-0 wpchat:min-w-[200px] wpchat:z-50 wpchat:rounded-md wpchat:border wpchat:border-gray-200 wpchat:bg-white wpchat:shadow-lg">
          <button
            className="wpchat:block wpchat:w-full wpchat:px-4 wpchat:py-2 wpchat:text-sm wpchat:text-start wpchat:hover:bg-gray-100"
            onClick={() => onSelect?.('create-new')}
          >
            {__('Create New Block', 'smashballoon-wpchat-livechat-customer-support')}
          </button>
          <button
            className="wpchat:block wpchat:w-full wpchat:px-4 wpchat:py-2 wpchat:text-sm wpchat:text-start wpchat:hover:bg-gray-100"
            onClick={() => onSelect?.('link-existing')}
          >
            {__('Link Existing Block', 'smashballoon-wpchat-livechat-customer-support')}
          </button>
        </div>
      )}
    </div>
  );
}
