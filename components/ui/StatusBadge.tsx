'use client';

import React from 'react';
import { Badge, BadgeProps } from './Badge';
import { getStatusColor, formatStatus } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const color = getStatusColor(status);
  
  // Map 'accent' and other custom values to valid BadgeVariant types
  let variant: BadgeProps['variant'] = 'muted';
  if (color === 'primary' || color === 'secondary' || color === 'success' || color === 'warning' || color === 'error' || color === 'muted') {
    variant = color;
  } else if (color === 'accent') {
    variant = 'primary'; // Map accent to primary for visual compatibility
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {formatStatus(status)}
    </Badge>
  );
}
