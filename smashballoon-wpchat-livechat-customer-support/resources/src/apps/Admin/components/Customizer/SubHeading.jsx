import React from 'react';

/**
 * SubHeading component renders a section subheading with the given title.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.title - The text to display as the subheading.
 *
 * @returns {JSX.Element} The rendered SubHeading component.
 */
function SubHeading({ title }) {
  if (!title) return null;

  return (
    <h3 className='wpchat:text-gray-900 wpchat:m-0 wpchat:pt-4 wpchat:pb-6 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold'>
      {title}
    </h3>
  );
}

export default SubHeading;
