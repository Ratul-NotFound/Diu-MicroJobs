'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  /** Label text displayed above the select */
  label?: string;
  /** Array of options to render */
  options: SelectOption[];
  /** Controlled value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Placeholder text shown when no value is selected */
  placeholder?: string;
  /** Error message — triggers error styling when set */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** HTML name attribute */
  name?: string;
  /** HTML id attribute */
  id?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Native select dropdown with label and error support.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Category"
 *   placeholder="Select a category"
 *   options={[
 *     { value: 'design', label: 'Design' },
 *     { value: 'dev', label: 'Development' },
 *   ]}
 *   value={category}
 *   onChange={(e) => setCategory(e.target.value)}
 * />
 * ```
 */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  name,
  id,
  className,
}: SelectProps) {
  const selectId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.selectContainer}>
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${styles.select} ${error ? styles.selectError : ''} ${!value ? styles.placeholder : ''}`}
          aria-invalid={!!error}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronDown size={16} />
        </span>
      </div>
      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
