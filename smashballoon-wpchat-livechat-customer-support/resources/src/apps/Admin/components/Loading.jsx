import React from 'react';

export default function Loading({ className }) {
  return (
    <>
      <div
        className={`wpchat:h-12 wpchat:w-full wpchat:animate-pulse wpchat:rounded-md wpchat:bg-gray-200 wpchat:${className}`}
      ></div>

      <div
        className={
          'wpchat:${className} wpchat:mx-auto wpchat:mt-20 wpchat:h-40 wpchat:w-4/5 wpchat:animate-pulse wpchat:rounded-md wpchat:bg-gray-200'
        }
      ></div>

      <div
        className={
          'wpchat:${className} wpchat:mx-auto wpchat:mt-5 wpchat:h-60 wpchat:w-4/5 wpchat:animate-pulse wpchat:rounded-md wpchat:bg-gray-200'
        }
      ></div>
    </>
  );
}
