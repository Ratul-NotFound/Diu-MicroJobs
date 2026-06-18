'use client';

import React from 'react';
import styles from './Input.module.css';

export interface InputProps {
  /** Label text displayed above the input */
  label?: string;
  /** HTML input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'date';
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value */
  value?: string | number;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Error message — triggers error styling when set */
  error?: string;
  /** Supplementary help text below the input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional icon rendered on the left side */
  icon?: React.ReactNode;
  /** HTML name attribute */
  name?: string;
  /** HTML id attribute */
  id?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Text input component with label, icon, and validation support.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   icon={<Mail size={16} />}
 *   error={errors.email}
 * />
 * ```
 */
export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
  icon,
  name,
  id,
  className,
}: InputProps) {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={inputId}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${styles.input} ${icon ? styles.hasIcon : ''} ${error ? styles.inputError : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className={styles.helperText}>
          {helperText}
        </p>
      )}
    </div>
  );
}
