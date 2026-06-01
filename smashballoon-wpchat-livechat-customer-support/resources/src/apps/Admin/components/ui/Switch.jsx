import { __ } from '@wordpress/i18n';
import { Switch as AriaSwitch, TooltipTrigger, Button as RACButton } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { Tooltip } from './Tooltip';
import { composeTailwindRenderProps, focusRing } from './utils';

const track = tv({
  extend: focusRing,
  base: 'wpchat:relative wpchat:flex wpchat:h-4 wpchat:w-7 wpchat:shrink-0 wpchat:cursor-default wpchat:items-center wpchat:rounded-full wpchat:border wpchat:border-transparent wpchat:px-px wpchat:shadow-inner wpchat:transition wpchat:duration-200 wpchat:ease-in-out',
  variants: {
    isSelected: {
      false: 'group-pressed:wpchat:bg-gray-500 wpchat:bg-gray-400',
      true: 'group-pressed:wpchat:bg-gray-800 wpchat:bg-wp-light-blue-500',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:group-selected wpchat:bg-gray-200',
    },
  },
  compoundVariants: [
    {
      isSelected: true,
      isDisabled: true,
      className: 'wpchat:bg-[#B6DDAD]',
    },
  ],
});

const handle = tv({
  base: 'wpchat:absolute wpchat:top-1/2 wpchat:-translate-y-1/2 wpchat:start-px wpchat:h-3 wpchat:w-3 wpchat:rounded-full wpchat:bg-white wpchat:shadow-xs wpchat:outline wpchat:outline-1 wpchat:-outline-offset-1 wpchat:outline-transparent wpchat:transition-[inset-inline-start] wpchat:duration-200 wpchat:ease-in-out',
  variants: {
    isSelected: {
      false: '',
      true: 'wpchat:start-[calc(100%-13px)]',
    },
    isDisabled: {
      true: 'forced-colors:wpchat:outline-[GrayText]',
    },
  },
});

function SwitchTrack({ renderProps, tooltip, tooltipPlacement = 'top', onToggle, isDisabled }) {
  const trackElement = (
    <div className={cn(track(renderProps), 'wpchat:mt-0.5', isDisabled && 'wpchat:cursor-not-allowed')}>
      <span className={handle(renderProps)} />
    </div>
  );

  if (!tooltip) return trackElement;

  return (
    <TooltipTrigger delay={0}>
      <RACButton
        aria-label={__('Toggle switch', 'smashballoon-wpchat-livechat-customer-support')}
        className={cn("wpchat:bg-transparent wpchat:border-none wpchat:p-0 wpchat:outline-none", isDisabled && "wpchat:cursor-not-allowed")}
        onPress={() => !isDisabled && onToggle(!renderProps.isSelected)}
        excludeFromTabOrder={isDisabled}
      >
        {trackElement}
      </RACButton>
      <Tooltip placement={tooltipPlacement}>{tooltip}</Tooltip>
    </TooltipTrigger>
  );
}

export function Switch({ children, iconName, iconNameOn, iconClassName, align = 'right', tooltip, tooltipPlacement, onChange, isDisabled, ...props }) {
  const isRightAligned = align === 'right';

  const renderContent = (renderProps) => {
    const currentIconName = iconNameOn && renderProps.isSelected ? iconNameOn : iconName;
    const icon = currentIconName && (
      <SvgLoader
        name={currentIconName}
        className={cn(
          'wpchat:shrink-0 wpchat:mt-0.5',
          isRightAligned ? 'wpchat:h-[1.4em] wpchat:w-[1.4em]' : 'wpchat:h-[1.5em] wpchat:w-[1.5em]',
          iconClassName
        )}
      />
    );

    const label = (
      <span className={cn('wpchat:flex wpchat:gap-3', isRightAligned ? 'wpchat:items-start' : 'wpchat:items-center')}>
        {icon}
        {children}
      </span>
    );

    const trackComponent = (
      <SwitchTrack
        renderProps={renderProps}
        tooltip={tooltip}
        tooltipPlacement={tooltipPlacement}
        onToggle={onChange}
        isDisabled={isDisabled}
      />
    );

    return isRightAligned ? (
      <>
        {label}
        {trackComponent}
      </>
    ) : (
      <>
        {trackComponent}
        {label}
      </>
    );
  };

  return (
    <AriaSwitch
      {...props}
      onChange={onChange}
      isDisabled={isDisabled}
      className={composeTailwindRenderProps(
        props.className,
        cn(
          'wpchat:group disabled:wpchat:text-gray-300 forced-colors:wpchat:disabled wpchat:flex wpchat:gap-5 wpchat:text-sm wpchat:text-gray-800 wpchat:transition',
          isRightAligned && 'wpchat:justify-between'
        ),
      )}
    >
      {renderContent}
    </AriaSwitch>
  );
}
