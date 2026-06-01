import React from 'react';
import { ModalOverlay, Modal as RACModal } from 'react-aria-components';
import { motion } from 'motion/react';
import { tv } from 'tailwind-variants';

const overlayStyles = tv({
  base: 'wpchat-pf-width wpchat-pf-height wpchat:fixed wpchat:isolate wpchat:z-99999 wpchat:flex wpchat:h-(--visual-viewport-height) wpchat:w-full wpchat:items-center wpchat:justify-center wpchat:bg-gray-500/[50%] wpchat:p-4',
});

const modalStyles = tv({
  base: 'wpchat:max-h-full wpchat:overflow-y-auto wpchat:bg-clip-padding wpchat:text-start wpchat:align-middle',
});

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const modalVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export function Modal(props) {
  return (
    <ModalOverlay {...props}>
      <motion.div
        initial='hidden'
        animate='visible'
        exit='exit'
        variants={overlayVariants}
        className={overlayStyles()}
      >
        <motion.div
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={modalVariants}
          className={modalStyles()}
        >
          <RACModal {...props} />
        </motion.div>
      </motion.div>
    </ModalOverlay>
  );
}
