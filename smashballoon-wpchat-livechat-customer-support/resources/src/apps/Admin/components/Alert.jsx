import React from 'react';
import { tv } from 'tailwind-variants';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

const alert = tv({
  base: 'wpchat:rounded-lg wpchat:border wpchat:px-3.5 wpchat:py-3 wpchat:grid wpchat:grid-cols-1 wpchat:gap-4 wpchat:md:grid-cols-[60fr_30fr] wpchat:md:gap-2 wpchat:items-start',
  variants: {
    variant: {
      info: 'wpchat:text-wp-blue-500 wpchat:[&_svg]:fill-wp-blue-500 wpchat:bg-wp-light-blue-50 wpchat:border-sky-300/40 wpchat:shadow-md',
      error:
        'wpchat:border-red-300/40 wpchat:bg-red-50 wpchat:text-red-600 wpchat:[&_svg]:fill-red-600',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

/**
 * Alert component to display informational or error messages with optional CTA button.
 *
 * @param {Object} props - Component props.
 * @param {string} [props.icon] - The name of the SVG icon to display on the left.
 * @param {string} [props.title] - The title text of the alert.
 * @param {string} [props.description] - The description text of the alert.
 * @param {string} [props.ctaText] - The text for the call-to-action button.
 * @param {() => void} [props.ctaAction] - The callback function for the CTA button click.
 * @param {string} [props.className] - Additional custom class names to apply to the alert container.
 * @param {'info' | 'error'} [props.variant='info'] - The visual variant of the alert, affecting colors and styles.
 *
 * @returns {JSX.Element} The rendered alert component.
 *
 * @example
 * <Alert
 *   icon="warning"
 *   title="Information"
 *   description="This is an informational alert."
 *   ctaText="Edit"
 *   ctaAction={() => console.log('Clicked')}
 *   variant="info"
 * />
 */
export default function Alert({
  icon,
  title,
  description,
  ctaText,
  ctaAction,
  ctaIcon = 'editOutline',
  className,
  variant = 'info',
}) {
  return (
    <div className={cn(alert({ variant }), className)}>
      <div className='wpchat:flex wpchat:flex-1 wpchat:items-start wpchat:gap-2'>
        {icon && (
          <SvgLoader name={icon} className='wpchat:mt-0.5 wpchat:h-[1.55em] wpchat:w-[1.55em] wpchat:shrink-0' />
        )}
        <div className='wpchat:flex wpchat:flex-col wpchat:gap-0.5'>
          {title && <h6 className='wpchat:m-0 wpchat:text-base wpchat:font-semibold'>{title}</h6>}
          {description && (
            <span className='wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed'>{description}</span>
          )}
        </div>
      </div>

        <div className='wpchat:flex wpchat:md:justify-end'>
        {ctaText && ctaAction && (
        <Button variant='secondary' onPress={ctaAction} className='wpchat:w-full wpchat:md:w-auto'>
          {ctaIcon && (
            <SvgLoader name={ctaIcon} className='wpchat:h-[1.3em] wpchat:w-[1.3em]' />
          )}
          {ctaText}
        </Button>
      )}
        </div>
    </div>
  );
}
