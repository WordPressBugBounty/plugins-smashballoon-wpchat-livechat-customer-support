import { Radio, RadioGroup } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { cn } from '@Utils/cn';
import { focusRing } from '@AC/ui/utils';

const radioCircle = tv({
  extend: focusRing,
  base: 'wpchat:mt-0.5 wpchat:h-5 wpchat:w-5 wpchat:shrink-0 wpchat:rounded-full wpchat:border-2 wpchat:bg-white wpchat:transition-all',
  variants: {
    isSelected: {
      false: 'wpchat:border-gray-400',
      true: 'wpchat:border-[7px] wpchat:border-wp-light-blue-500',
    },
  },
});

export function CardRadioGroup({ value, onChange, children, className }) {
  return (
    <RadioGroup
      className={cn('wpchat:flex wpchat:w-full wpchat:flex-col wpchat:overflow-hidden wpchat:rounded-lg', className)}
      value={value}
      onChange={onChange}
    >
      {children}
    </RadioGroup>
  );
}

export function CardRadio({ value, title, description, isDisabled = false }) {
  return (
    <Radio
      value={value}
      isDisabled={isDisabled}
      className={({ isSelected }) =>
        cn(
          'wpchat:flex wpchat:items-start wpchat:gap-3 wpchat:border wpchat:px-4 wpchat:py-4 wpchat:first:rounded-t-lg wpchat:last:rounded-b-lg wpchat:-mt-px wpchat:first:mt-0',
          isDisabled
            ? 'wpchat:cursor-not-allowed wpchat:opacity-50 wpchat:bg-white wpchat:border-gray-200'
            : cn(
              'wpchat:cursor-pointer wpchat:hover:bg-gray-50',
              isSelected
                ? 'wpchat:relative wpchat:z-10 wpchat:border-wp-light-blue-500 wpchat:bg-white'
                : 'wpchat:border-gray-200 wpchat:bg-white',
            ),
        )
      }
    >
      {({ isSelected }) => (
        <>
          <div className={radioCircle({ isSelected: !isDisabled && isSelected })} />
          <div className="wpchat:flex wpchat:flex-col wpchat:gap-1">
            <p className="wpchat:m-0 wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900">
              {title}
            </p>
            {description && (
              <p className="wpchat:m-0 wpchat:text-xs wpchat:text-gray-500">
                {description}
              </p>
            )}
          </div>
        </>
      )}
    </Radio>
  );
}
