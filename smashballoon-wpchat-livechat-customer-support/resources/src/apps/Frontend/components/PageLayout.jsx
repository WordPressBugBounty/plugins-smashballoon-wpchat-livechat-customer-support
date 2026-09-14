import React from 'react';
import { motion } from 'motion/react';
import ScrollableSection from '@FC/ScrollableSection';
import { useTransitions } from '@Hooks/useTransitions';

/**
 * PageLayout component serves as a wrapper for page content, providing a consistent layout structure.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the layout.
 * @param {string} [props.route] - The route path this layout renders (exposed as data-route for focus management).
 *
 * @returns {JSX.Element} The rendered PageLayout component.
 */
const PageLayout = ({ children, route }) => (
  <PageTransition route={route}>
    <ScrollableSection>{children}</ScrollableSection>
  </PageTransition>
);

export default PageLayout;

/**
 * PageTransition component handles animated transitions between pages.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be wrapped with transition effects.
 * @param {string} props.keyProp - A unique key to identify the transitioning element.
 * @param {string} [props.route] - The route path this view renders (exposed as data-route for focus management).
 *
 * @returns {JSX.Element} The rendered PageTransition component with animations.
 */
const PageTransition = ({ children, keyProp, route }) => {
  // Call hook at top level, not inside JSX
  const transition = useTransitions();

  return (
    <motion.div
      key={keyProp} // Unique key for each view
      data-route={route}
      {...transition}
      className='wpchat:absolute wpchat:inset-0' // Stack views on top of each other
    >
      {children}
    </motion.div>
  );
};
