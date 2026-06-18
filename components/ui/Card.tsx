import React from 'react';
import styles from './Card.module.css';

/** Visual variant for the Card */
type CardVariant = 'default' | 'interactive' | 'bordered';

/** Padding size for the Card */
type CardPadding = 'sm' | 'md' | 'lg';

const paddingMap: Record<CardPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export interface CardProps {
  /** Visual style variant */
  variant?: CardVariant;
  /** Internal padding size */
  padding?: CardPadding;
  /** Card content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Click handler — typically used with the `interactive` variant */
  onClick?: () => void;
}

/**
 * Versatile card container for grouping related content.
 *
 * @example
 * ```tsx
 * <Card variant="interactive" padding="md" onClick={handleClick}>
 *   <h3>Job Title</h3>
 *   <p>Description here…</p>
 * </Card>
 * ```
 */
export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  onClick,
}: CardProps) {
  const classNames = [
    styles.card,
    styles[variant],
    paddingMap[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </div>
  );
}
