import React from 'react';
import styles from './Badge.module.css';

/** Visual variant for the Badge */
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted';

/** Badge size */
type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /** Visual colour variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Badge content */
  children: React.ReactNode;
  /** Show a small status dot before the text */
  dot?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Compact label for statuses, counts, and categories.
 *
 * @example
 * ```tsx
 * <Badge variant="success" dot>Active</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 * ```
 */
export function Badge({
  variant = 'primary',
  size = 'sm',
  children,
  dot = false,
  className,
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
