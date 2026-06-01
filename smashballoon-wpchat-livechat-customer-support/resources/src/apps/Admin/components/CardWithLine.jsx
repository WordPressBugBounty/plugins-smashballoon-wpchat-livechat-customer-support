import React from 'react';
import { cn } from '@Utils/cn';

/**
 * CardWithLine Component
 *
 * A styled container component that displays its children inside a card layout
 * with a green top border and gradient background. Typically used to visually
 * separate content sections in the UI.
 *
 * @component
 * @example
 * return (
 *   <CardWithLine className="custom-class">
 *     <p>This is inside the card</p>
 *   </CardWithLine>
 * );
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Elements to render inside the card.
 * @param {string} [props.className] - Optional additional class names to customize the container.
 *
 * @returns {JSX.Element} The rendered CardWithLine component.
 */
function CardWithLine({ children, className }) {
  return (
    <div
      className={cn(
        'wpchat:rounded-lg wpchat:border-t-2 wpchat:border-green-600 wpchat:bg-white wpchat:px-7 wpchat:py-6 wpchat:[background:var(--wpchat-color-admin-gradient)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default CardWithLine;
