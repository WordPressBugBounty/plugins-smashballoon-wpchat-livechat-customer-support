import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import Avatar from '@Components/Avatar';
import TitleDescription from '@Components/TitleDescription';
import { getAvatarFallback } from '@Utils/getAvatarFallback';
import { cn } from '@Utils/cn';

export default function RedirectMsg({ name, phone_number, platformName, avatar, showLoader: showLoaderProp }) {
  const avatarFallback = getAvatarFallback(name);
  const [showLoader, setShowLoader] = useState(showLoaderProp ?? true);

  useEffect(() => {
    // Hide loader after 3 seconds (when the fallback message appears)
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='wpchat:px-1.5 wpchat:pb-5'>
      <TitleDescription
        title={__('Redirecting to', 'smashballoon-wpchat-livechat-customer-support') + ` ${platformName}`}
        description={__('You will be texting with...', 'smashballoon-wpchat-livechat-customer-support')}
        descriptionClassName='wpchat:leading-relaxed'
      />
      <div className={cn('wpchat:relative wpchat:min-h-[75px] wpchat:rounded-sm wpchat:bg-white wpchat:p-3 wpchat:ps-22 wpchat:shadow-md', showLoader && 'wpchat:mb-5.5')}>
        <div className='wpchat:absolute wpchat:top-3 wpchat:start-3'>
          <Avatar file={avatar} fallback={avatarFallback} className='wpchat:h-13 wpchat:w-13' />
        </div>
        <TitleDescription className='wpchat:mb-0' title={name} description={phone_number} />
      </div>
      {showLoader && <Loader />}
    </div>
  );
}

const dotVariants = {
  animate: (i) => ({
    opacity: [0.2, 1, 0.2],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'linear',
      delay: i * 0.33, // stagger like the CSS keyframes
    },
  }),
};

function Loader() {
  return (
    <div className='wpchat:flex wpchat:items-center wpchat:gap-2 wpchat:ps-4'>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className='wpchat:aspect-square wpchat:w-7.5 wpchat:rounded-full wpchat:bg-slate-400'
          custom={i}
          variants={dotVariants}
          animate='animate'
        />
      ))}
    </div>
  );
}
