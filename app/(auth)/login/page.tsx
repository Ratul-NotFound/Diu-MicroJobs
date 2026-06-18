'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Input } from '@/components/ui';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, userProfile, firebaseUser, loading } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user profile is loaded, redirect to dashboard
    if (!loading && (userProfile || firebaseUser)) {
      router.push('/dashboard');
    }
  }, [userProfile, firebaseUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      addToast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : 'Invalid email or password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      addToast('Signed in successfully!', 'success');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : 'Google sign-in failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Welcome Back</h2>
      <p className={styles.subtitle}>Log in to access your dashboard and work</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          type="email"
          label="DIU Email Address"
          placeholder="e.g. name.cse@diu.edu.bd"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <div className={styles.forgotWrapper}>
          <Link href="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
        >
          Sign In
        </Button>
      </form>

      <div className={styles.divider}>
        <span>or continue with</span>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        className={styles.googleButton}
      >
        <svg className={styles.googleIcon} viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h3.99c2.34-2.16 3.68-5.32 3.68-9.05z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.13a7.45 7.45 0 0 1-11.93-3.96H.02v3.23A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M4.04 14c-.2-.6-.31-1.25-.31-1.9s.11-1.3.31-1.9V6.97H.02a11.95 11.95 0 0 0 0 10.06L4.04 14z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 .02 6.97l4.02 3.23a7.45 7.45 0 0 1 7.96-5.45z"
          />
        </svg>
        <span>Google Account</span>
      </Button>

      <div className={styles.signupPrompt}>
        <span>New to DIU MicroJobs? </span>
        <Link href="/register" className={styles.signupLink}>
          Create an account
        </Link>
      </div>
    </div>
  );
}
