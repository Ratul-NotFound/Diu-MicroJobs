'use client';

import React from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps {
  /** Label text displayed above the textarea */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Error message — triggers error styling when set */
  error?: string;
  /** Supplementary help text below the textarea */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Number of visible rows */
  rows?: number;
  /** Maximum character length — shows a counter when set */
  maxLength?: number;
  /** HTML name attribute */
  name?: string;
  /** HTML id attribute */
  id?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Multi-line text input component with optional character counter.
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   placeholder="Describe the job..."
 *   maxLength={500}
 *   rows={6}
 * />
 * ```
 */
export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
  rows = 4,
  maxLength,
  name,
  id,
  className,
}: TextareaProps) {
  const textareaId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  const charLength = typeof value === 'string' ? value.length : 0;
  const isOver = maxLength ? charLength > maxLength : false;

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
      />
      <div className={styles.footer}>
        {error && (
          <p id={`${textareaId}-error`} className={styles.errorMessage} role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
        {maxLength != null && (
          <span className={`${styles.charCount} ${isOver ? styles.charCountOver : ''}`}>
            {charLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
