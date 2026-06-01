import React from 'react';
import { ColorPicker as AriaColorPicker, Button, DialogTrigger } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { __ } from '@wordpress/i18n';
import { cn } from '@Utils/cn';
import { ColorArea } from './ColorArea.jsx';
import { ColorField } from './ColorField.jsx';
import { ColorSlider } from './ColorSlider.jsx';
import { ColorSwatch } from './ColorSwatch.jsx';
import { Dialog } from './Dialog';
import { Popover } from './Popover';
import { focusRing } from './utils';

const buttonStyles = tv({ 
  extend: focusRing,
  base: 'wpchat:flex wpchat:cursor-default wpchat:items-center wpchat:gap-2 wpchat:rounded-xs wpchat:text-sm wpchat:text-gray-800',
});

export function ColorPicker({
  label,
  children,
  showColorArea = true,
  showColorSlider = true,
  showColorField = true,
  value,
  ...props
}) {
  return (
    <AriaColorPicker {...props}>
      <div className='wpchat:flex wpchat:items-center wpchat:gap-20'>
        <span className='wpchat:text-gray-900 wpchat:text-xs wpchat:leading-relaxed'>{label}</span>
        <DialogTrigger>
          <Button className={cn('wpchat:cursor-pointer', buttonStyles)}>
            <div className='wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:rounded-3xl wpchat:border wpchat:py-1 wpchat:pe-4 wpchat:ps-1'>
              <ColorSwatch />
              <span className='wpchat:text-gray-800 wpchat:text-xs'>
                {!value ? __('Inherit', 'smashballoon-wpchat-livechat-customer-support') : __('Custom', 'smashballoon-wpchat-livechat-customer-support')}
              </span>
            </div>
          </Button>
          <Popover placement='bottom start' className='wpchat:min-w-[192px]'>
            <Dialog className='wpchat:max-h-inherit wpchat:box-border wpchat:flex wpchat:min-w-[192px] wpchat:flex-col wpchat:gap-2 wpchat:overflow-auto wpchat:p-[15px] wpchat:outline-none'>
              {children || (
                <>
                  {showColorArea && (
                    <ColorArea colorSpace='hsb' xChannel='saturation' yChannel='brightness' />
                  )}
                  {showColorSlider && <ColorSlider colorSpace='hsb' channel='hue' />}
                  {showColorField && <ColorField label='Hex' />}
                </>
              )}
            </Dialog>
          </Popover>
        </DialogTrigger>
      </div>
    </AriaColorPicker>
  );
}
