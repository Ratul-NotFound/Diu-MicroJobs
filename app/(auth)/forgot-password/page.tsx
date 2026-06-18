'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Input } from '@/components/ui';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('Please enter your email address', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      addToast('Password reset link sent to your email!', 'success');
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : 'Failed to send password reset email', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Reset Password</h2>
      
      {isSuccess ? (
        <div className={styles.successWrapper}>
          <div className={styles.successAlert}>
            <p>A password reset link has been sent to <strong>{email}</strong>.</p>
            <p>Please check your inbox (and spam folder) and follow the instructions to reset your password.</p>
          </div>
          <Link href="/login" className={styles.backButtonLink}>
            <Button variant="primary" fullWidth>
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.subtitle}>Enter your email address and we will send you a link to reset your password.</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="email"
              label="Email Address"
              placeholder="e.g. name.cse@diu.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>

          <div className={styles.backPrompt}>
            <Link href="/login" className={styles.backLink}>
              Nevermind, take me back
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
