import React from 'react';
import SvgLoader from '@Components/SvgLoader';
import AnalyticsSkeleton from './AnalyticsSkeleton';
import { cn } from '@Utils/cn';

const StateView = ({
  state,
  icon,
  iconClassName,
  heading,
  message,
  description,
  children
}) => {
  // Early return if no state
  if (!state) {
    return children;
  }

  // Early return for loading state with skeleton
  if (state === 'loading') {
    return <AnalyticsSkeleton />;
  }

  // State configurations
  const getStateConfig = (currentState) => {
    if (currentState === 'error') {
      return {
        variant: 'default',
        defaultIcon: null
      };
    }

    if (currentState === 'empty') {
      return {
        variant: 'empty',
        defaultIcon: null
      };
    }

    return null;
  };

  const config = getStateConfig(state);

  // Invalid state
  if (!config) {
    return children;
  }

  return (
    <div className="wpchat:pt-19 wpchat:pb-23 wpchat:px-8">
      <div className="wpchat:flex wpchat:justify-center">
        <div className="wpchat:text-center wpchat:w-full wpchat:max-w-[286px] ">
          {/* Icon */}
          {icon ? (
            <div className="wpchat:mx-auto wpchat:mb-6.5">
              <SvgLoader
                name={icon}
                className={cn(`wpchat:w-[2em] wpchat:h-[2em] wpchat:fill-gray-500 ` + config.iconSize, iconClassName)}
              />
            </div>
          ) : config.defaultIcon}

          {/* Text Content */}
          {heading && (
            <h3 className={cn('wpchat:text-sm wpchat:font-semibold wpchat:mb-1.5 wpchat:text-gray-900', config.messageColor)}>
              {heading}
            </h3>
          )}
          {message && (
            <p className={cn(config.messageColor, 'wpchat:text-[13px] wpchat:text-gray-500 wpchat:mb-0', heading && 'wpchat:mt-1')}>
              {message}
            </p>
          )}
          {description && (
            <p className="wpchat:text-gray-400 wpchat:text-xs wpchat:mt-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StateView; 