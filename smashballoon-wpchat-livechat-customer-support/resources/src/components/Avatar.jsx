import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Avatar component for displaying a user's image or a fallback (e.g. initials or icon).
 *
 * @param {Object} props - Component props.
 * @param {string} [props.file] - URL or path to the avatar image file.
 * @param {Object} [props.fallback={}] - Fallback data to use when the image is not available (e.g., initials, color).
 * @param {string} [props.className] - Additional CSS classes for styling the avatar.
 *
 * @returns {JSX.Element} The rendered Avatar component.
 */
export default function Avatar({ file, fallback = {}, className }) {
  const { text = 'SB', theme_slug = 'theme_1' } = fallback;

  const AvatarFallbackThemeList = {
    theme_1: {
      background:
        'wpchat:bg-gradient-to-b wpchat:from-[var(--wpchat-color-avatar-1)] wpchat:to-[var(--wpchat-color-avatar-1)]',
      text: 'wpchat:text-[var(--wpchat-color-avatar-3)]',
    },
    theme_2: {
      background:
        'wpchat:bg-gradient-to-b wpchat:from-[var(--wpchat-color-avatar-4)] wpchat:to-[var(--wpchat-color-avatar-1)]',
      text: 'wpchat:text-[var(--wpchat-color-avatar-5)]',
    },
    theme_3: {
      background:
        'wpchat:bg-gradient-to-b wpchat:from-[var(--wpchat-color-avatar-6)] wpchat:to-[var(--wpchat-color-avatar-1)]',
      text: 'wpchat:text-[var(--wpchat-color-avatar-7)]',
    },
    theme_4: {
      background:
        'wpchat:bg-gradient-to-b wpchat:from-[var(--wpchat-color-avatar-8)] wpchat:to-[var(--wpchat-color-avatar-1)]',
      text: 'wpchat:text-[var(--wpchat-color-avatar-9)]',
    },
    theme_5: {
      background:
        'wpchat:bg-gradient-to-b wpchat:from-[var(--wpchat-color-avatar-10)] wpchat:to-[var(--wpchat-color-avatar-1)]',
      text: 'wpchat:text-[var(--wpchat-color-avatar-11)]',
    },
    theme_6: {
      background:
        'wpchat:bg-gradient-to-b wpchat:from-[var(--wpchat-color-avatar-12)] wpchat:to-[var(--wpchat-color-avatar-1)]',
      text: 'wpchat:text-[var(--wpchat-color-avatar-13)]',
    },
  };

  const theme = AvatarFallbackThemeList[theme_slug] || {};
  const fallbackClassname = twMerge(
    'wpchat:flex wpchat:h-16 wpchat:w-16 wpchat:items-center wpchat:justify-center wpchat:rounded-full wpchat:text-lg wpchat:font-medium',
    theme.background,
    theme.text,
    className,
  );

  return file ? (
    <img
      className={twMerge(
        'wpchat:h-16 wpchat:w-16 wpchat:rounded-full wpchat:object-cover',
        className,
      )}
      src={file}
      alt={text}
    />
  ) : (
    <div className={fallbackClassname} aria-hidden='true'>
      {text}
    </div>
  );
}
