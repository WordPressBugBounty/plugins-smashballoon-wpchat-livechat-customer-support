import React from 'react';
import { motion } from 'motion/react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { useRTL, rtlX } from '@Hooks/useRTL';

const DEFAULT_ROWS = [
  __('Add a Whatsapp number', 'smashballoon-wpchat-livechat-customer-support'),
  __('Configure theme', 'smashballoon-wpchat-livechat-customer-support'),
  __('Set up website visibility', 'smashballoon-wpchat-livechat-customer-support'),
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.5,
    },
  },
};

export default function SummaryCard({
  title = __('Awesome. You are all set up!', 'smashballoon-wpchat-livechat-customer-support'),
  description = __(
    "Here's an overview of everything that is setup",
    'smashballoon-wpchat-livechat-customer-support',
  ),
  rows = DEFAULT_ROWS,
}) {
  const isRTL = useRTL();

  const rowVariants = {
    hidden: { opacity: 0, x: rtlX(-20, isRTL) },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className='wpchat:rounded-lg wpchat:border wpchat:border-gray-200 wpchat:bg-white wpchat:shadow'>
      <div className='wpchat:p-5 wpchat:md:p-8'>
        <h3 className='wpchat:m-0 wpchat:text-2xl wpchat:font-semibold wpchat:text-gray-900'>
          {title}
        </h3>
        <p className='wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-500'>
          {description}
        </p>
      </div>

      {/* Animated container */}
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='wpchat:overflow-hidden'
      >
        {rows.map((text, idx) => (
          <motion.div
            key={idx}
            variants={rowVariants}
            className={`wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:px-5 wpchat:py-3.5 wpchat:md:px-8 ${idx % 2 === 0 ? 'wpchat:bg-gray-50' : 'wpchat:bg-white'} ${idx === rows.length - 1 ? 'wpchat:rounded-b-lg' : ''}`}
          >
            <SvgLoader
              name='check'
              className='wpchat:h-[1.8em] wpchat:w-[1.8em] wpchat:fill-gray-400 wpchat:text-gray-300'
            />
            <span className='wpchat:text-sm wpchat:leading-relaxed wpchat:font-normal wpchat:text-gray-800'>
              {text}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
