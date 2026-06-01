import React from 'react';
import { twMerge } from 'tailwind-merge';
import Header from '@AC/Header';

/**
 * Renders the page layout with a footer.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the layout.
 * @returns {JSX.Element} The rendered page layout component.
 */
const PageLayout = ({
  HeaderButtonsLeft,
  HeaderButtons,
  disableHelpBtn,
  breadcrumb,
  children,
  className,
  layoutClassName,
  disableLogo,
  headerVariant,
  headerHeading,
}) => (
  <div
    className={twMerge(
      '',
      layoutClassName,
    )}
  >
    <Header
      breadcrumb={breadcrumb}
      disableLogo={disableLogo}
      HeaderButtons={HeaderButtons}
      HeaderButtonsLeft={HeaderButtonsLeft}
      headerVariant={headerVariant}
      headerHeading={headerHeading}
      disableHelpBtn={disableHelpBtn}
    />
    <div
      className={twMerge(
        'wpchat:mx-auto wpchat:max-w-3xl wpchat:px-4 wpchat:py-5 wpchat:md:py-14',
        className,
      )}
    >
      {children}
    </div>
  </div>
);

export default PageLayout;
