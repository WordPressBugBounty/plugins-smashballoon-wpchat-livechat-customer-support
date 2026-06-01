import React from 'react';
import { Form as RACForm } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

export function Form(props) {
  return (
    <RACForm
      {...props}
      className={twMerge('wpchat:flex wpchat:flex-col wpchat:gap-4', props.className)}
    />
  );
}
