import React from 'react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import styles from './Avatar.module.css';

/** Avatar size options */
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Name used to derive fallback initials and background colour */
  name?: string;
  /** Size of the avatar */
  size?: AvatarSize;
  /** Show an online-status indicator dot */
  online?: boolean;
  /** Additional class name */
  className?: string;
}

const fallbackTextClass: Record<AvatarSize, string> = {
  sm: styles.fallbackSm,
  md: styles.fallbackMd,
  lg: styles.fallbackLg,
  xl: styles.fallbackXl,
};

const onlineSizeClass: Record<AvatarSize, string> = {
  sm: '',
  md: '',
  lg: styles.onlineLg,
  xl: styles.onlineXl,
};

/**
 * User avatar with image, initials fallback, and online indicator.
 *
 * @example
 * ```tsx
 * <Avatar src={user.photoURL} name={user.displayName} size="lg" online />
 * ```
 */
export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  online = false,
  className,
}: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <span className={`${styles.wrapper} ${className || ''}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${styles.avatar} ${styles[size]}`}
        />
      ) : (
        <span
          className={`${styles.fallback} ${styles[size]} ${fallbackTextClass[size]}`}
          style={{ backgroundColor: bgColor }}
          aria-label={name}
        >
          {initials}
        </span>
      )}
      {online && (
        <span
          className={`${styles.online} ${onlineSizeClass[size]}`}
          aria-label="Online"
        />
      )}
    </span>
  );
}
