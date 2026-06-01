import HTMLReactParser from 'html-react-parser';
import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';
import { copyTextToCB } from '@Utils/copyTextToCB.jsx';

function SystemInfo({ className }) {
  const [expanded, setExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const systemInfoRef = useRef(null);

  const handleCopy = async () => {
    const result = await copyTextToCB(window.wpChatAdmin.systemInfoPlain);
    if (result) {
      setIsCopied(true);
      // Reset status after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      console.error('Failed to copy');
    }
  };

  return (
    <div
      className={cn(
        'wpchat:bg-white wpchat:px-5 wpchat:pt-4.5 wpchat:pb-5 wpchat:shadow-md',
        className,
      )}
    >
      <div className='wpchat:mb-5.5 wpchat:flex wpchat:justify-between wpchat:gap-2'>
        <h4 className='wpchat:text-gray-900 wpchat:m-0 wpchat:text-lg wpchat:font-semibold'>
          {__('System Info', 'smashballoon-wpchat-livechat-customer-support')}
        </h4>
        <Button variant='secondary' onPress={handleCopy}>
          <SvgLoader name='contentCopy2' className='wpchat:h-[1.2em] wpchat:w-[1.2em]' />
          {isCopied ? __('Copied', 'smashballoon-wpchat-livechat-customer-support') : __('Copy', 'smashballoon-wpchat-livechat-customer-support')}
        </Button>
      </div>

      <div className='sby-system-info'>
        <div className='wpchat:overflow-hidden'>
          <motion.div
            ref={systemInfoRef}
            id='system_info'
            className='system_info'
            initial={false}
            animate={{
              height: expanded ? 'auto' : '200px',
              opacity: expanded ? 1 : 0.8,
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            style={{
              overflow: 'hidden',
            }}
          >
            <div className='wpchat:bg-gray-50 wpchat:border-gray-200 wpchat:text-gray-900 wpchat:box-border wpchat:w-full wpchat:resize-none wpchat:rounded-none wpchat:border wpchat:px-7 wpchat:py-5 wpchat:font-mono wpchat:text-xs wpchat:leading-[18px] wpchat:break-all'>
              {HTMLReactParser(window.wpChatAdmin.systemInfo)}
            </div>
          </motion.div>
          <AnimatePresence>
            {!expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='wpchat:pointer-events-none wpchat:absolute wpchat:end-0 wpchat:bottom-0 wpchat:start-0 wpchat:h-12 wpchat:bg-gradient-to-t wpchat:from-white wpchat:to-transparent'
              />
            )}
          </AnimatePresence>
        </div>

        <motion.button
          className='wpchat:border-gray-300 wpchat:flex wpchat:w-full wpchat:cursor-pointer wpchat:justify-center wpchat:rounded-xs wpchat:border wpchat:p-2 wpchat:text-center wpchat:text-xs wpchat:font-semibold'
          onClick={() => setExpanded(!expanded)}
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <SvgLoader name='chevronDown' />
          </motion.span>
          <span className='wpchat:leading-[20px]'>{!expanded ? __('Expand', 'smashballoon-wpchat-livechat-customer-support') : __('Collapse', 'smashballoon-wpchat-livechat-customer-support')}</span>
        </motion.button>
      </div>
    </div>
  );
}

export default SystemInfo; 
