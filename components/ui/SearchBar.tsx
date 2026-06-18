'use client';

import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  size = 'md',
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  const searchIconSizes = {
    sm: 14,
    md: 18,
    lg: 20,
  };

  const currentIconSize = searchIconSizes[size];

  return (
    <div className={`${styles.searchContainer} ${styles[size]} ${className}`}>
      <Search className={styles.searchIcon} size={currentIconSize} />
      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={currentIconSize - 2} />
        </button>
      )}
    </div>
  );
}
