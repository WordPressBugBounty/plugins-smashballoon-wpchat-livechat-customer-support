import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import { Select, SelectItem } from '@AC/ui/Select';
import SvgLoader from '@Components/SvgLoader';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import ThemePresets from '@FDataStore/Themes/ThemePresets';
import { availableThemes } from '@FDataStore/Themes/availableThemes';
import OnboardingPreview from '../OnboardingPreview';
import { iconLoaders } from '@Components/iconLoaders';

const SelectTheme = ({
  value,
  onChange,
  availableOptions = availableThemes,
  showPreview = true
}) => {
  const setTheme = useChatStore((s) => s.setTheme);
  const currentOption = availableOptions.find((opt) => opt.slug === value);

  // Preload all theme SVGs when component mounts
  useEffect(() => {
    availableOptions.forEach((option) => {
      const loader = iconLoaders[option.image];
      if (loader) {
        loader().catch(() => {
          // Silently handle preload errors
        });
      }
    });
  }, [availableOptions]);
  
  const handleSelectionChange = (slug) => {
    setTheme(slug);
    ThemePresets(slug);
    onChange(slug);
  };

  const transitionIn = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
      type: 'spring',
    },
  };

  const transitionOut = {
    exit: { y: 20, opacity: 0 },
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
      type: 'spring',
    },
  };

  return (
    <div className='wpchat:w-full wpchat:space-y-4'>
      <Select
        selectedKey={value}
        onSelectionChange={handleSelectionChange}
        btnClassName='wpchat:w-full wpchat:mb-3 wpchat:md:max-w-[251px] wpchat:h-[50px]'
      >
        {availableOptions.map((option) => (
          <SelectItem key={option.slug} id={option.slug}>
            <div className='flex items-center gap-2'>
              <span>{option.name}</span>
            </div>
          </SelectItem>
        ))}
      </Select>

      {showPreview && (
        <OnboardingPreview
          title={__('Theme', 'smashballoon-wpchat-livechat-customer-support')}
          description={
            <>
              {__('This is how your chatbot would look like.', 'smashballoon-wpchat-livechat-customer-support')}{' '}
              <b>{__('Don\'t worry about the colors. You can change them later!', 'smashballoon-wpchat-livechat-customer-support')}</b>
            </>
          }
          centerOnMobile={true}
        >
          <AnimatePresence mode='wait'>
            {currentOption && (
              <motion.div
                key={currentOption.image}
                initial={transitionIn.initial}
                animate={transitionIn.animate}
                exit={transitionOut.exit}
                transition={transitionIn.transition}
              >
                <SvgLoader name={currentOption.image} className='wpchat:h-[322px]' />
              </motion.div>
            )}
          </AnimatePresence>
        </OnboardingPreview>
      )}
    </div>
  );
};

export default SelectTheme;