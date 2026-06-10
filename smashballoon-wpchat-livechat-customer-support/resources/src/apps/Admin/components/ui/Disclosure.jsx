import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Button,
} from 'react-aria-components';
import { motion } from 'motion/react';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

export function AccordionGroup({ children, ...props }) {
  return (
    <DisclosureGroup
      {...props}
      className={cn('wpchat:flex wpchat:flex-col', props.className)}
    >
      {children}
    </DisclosureGroup>
  );
}

export function AccordionItem({ icon, label, value, children, borderless, ...props }) {
  return (
    <Disclosure
      {...props}
      className={({ isExpanded: expanded }) => cn(
        'wpchat:-mx-5',
        !borderless && !expanded && 'wpchat:border-b wpchat:border-gray-200',
        'wpchat:transition-all wpchat:duration-200',
        expanded && 'wpchat:rounded-lg wpchat:my-1',
        expanded && borderless && 'wpchat:border-t wpchat:border-transparent',
        props.className,
      )}
      style={({ isExpanded: expanded }) => expanded ? {
        boxShadow: '0px 10px 15px -3px #0000000D, 0px 4px 6px -4px #0000000D',
      } : undefined}
    >
      {({ isExpanded }) => (
        <>
          <Button
            slot="trigger"
            className="wpchat:flex wpchat:w-full wpchat:items-center wpchat:justify-between wpchat:py-3 wpchat:cursor-pointer wpchat:bg-transparent wpchat:border-0 wpchat:px-5 wpchat:outline-none"
          >
            <span className="wpchat:flex wpchat:items-center wpchat:gap-2.5">
              {icon && (
                <SvgLoader
                  name={icon}
                  className="wpchat:h-[1.2em] wpchat:w-[1.2em] wpchat:fill-gray-900"
                />
              )}
              <span className="wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900">
                {label}
              </span>
            </span>
            <span className="wpchat:flex wpchat:items-center wpchat:gap-1">
              {value && (
                <span className="wpchat:text-sm wpchat:text-gray-500">
                  {value}
                </span>
              )}
              <SvgLoader
                name="chevronDown"
                className={cn(
                  'wpchat:h-[1.5em] wpchat:w-[1.5em] wpchat:fill-gray-500 wpchat:transition-transform wpchat:duration-200',
                  isExpanded && 'wpchat:rotate-180',
                )}
              />
            </span>
          </Button>
          <DisclosurePanel
            className="wpchat:overflow-hidden"
            style={{
              height: 'var(--disclosure-panel-height)',
              transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <motion.div
              initial={false}
              animate={
                isExpanded
                  ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                  : { opacity: 0, scale: 0.95, filter: 'blur(4px)' }
              }
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="wpchat:pb-4 wpchat:px-5">{children}</div>
            </motion.div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
