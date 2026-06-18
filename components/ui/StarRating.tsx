'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const starSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const currentSize = starSizes[size];

  const handleMouseEnter = (index: number) => {
    if (!interactive) return;
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (!interactive || !onChange) return;
    onChange(index);
  };

  return (
    <div
      className={`${styles.container} ${interactive ? styles.interactive : ''} ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        
        // Calculate fill percentage for display-only fractional stars
        let fillPercentage = 0;
        if (activeRating >= starValue) {
          fillPercentage = 100;
        } else if (activeRating > starValue - 1) {
          fillPercentage = (activeRating - (starValue - 1)) * 100;
        }

        return (
          <div
            key={i}
            className={styles.starWrapper}
            style={{ width: currentSize, height: currentSize }}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onClick={() => handleClick(starValue)}
          >
            {/* Empty base star */}
            <Star
              size={currentSize}
              className={styles.emptyStar}
            />
            {/* Filled overlay star */}
            {fillPercentage > 0 && (
              <div
                className={styles.filledStarContainer}
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  size={currentSize}
                  className={styles.filledStar}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
