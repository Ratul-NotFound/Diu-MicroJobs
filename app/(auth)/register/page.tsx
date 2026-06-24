'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Input, Select } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import styles from './RegisterPage.module.css';

interface UniversityInfo {
  _id: string;
  name: string;
  shortName: string;
  slug: string;
  departments: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, userProfile, firebaseUser, loading, profileChecked } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'alumni' | 'department'>('student');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [universityInfo, setUniversityInfo] = useState<UniversityInfo | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!loading && profileChecked && userProfile) {
      router.push('/dashboard');
    }
  }, [loading, profileChecked, userProfile, router]);

  useEffect(() => {
    if (!loading && profileChecked && firebaseUser && !userProfile) {
      // For Google sign-in users, validate their email and skip to step 2
      const email = firebaseUser.email;
      if (email) {
        setIsValidating(true);
        apiClient<{ valid: boolean; university?: UniversityInfo; error?: string }>('/api/auth/validate-email', {
          method: 'POST',
          body: { email },
        }).then(({ data }) => {
          if (data?.valid && data.university) {
            setUniversityInfo(data.university);
            setStep(2);
          }
        }).finally(() => setIsValidating(false));
      } else {
        setStep(2);
      }
    }
  }, [loading, profileChecked, firebaseUser, userProfile]);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    // Validate university email via API
    setIsValidating(true);
    try {
      const { data } = await apiClient<{ valid: boolean; university?: UniversityInfo; error?: string }>('/api/auth/validate-email', {
        method: 'POST',
        body: { email },
      });

      if (!data?.valid) {
        addToast(data?.error || 'Your university is not registered on this platform', 'error');
        return;
      }

      setUniversityInfo(data.university || null);
      setStep(2);
    } catch {
      addToast('Failed to validate email. Please try again.', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !department) {
      addToast('Please fill in all required profile fields', 'warning');
      return;
    }

    if (role === 'student' && !studentId) {
      addToast('Student ID is required for students', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, {
        displayName,
        role,
        department,
        studentId: role === 'student' || role === 'alumni' ? studentId : undefined,
      });
      addToast('Account created successfully!', 'success');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : 'Registration failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic departments from matched university, with fallback
  const departmentOptions = universityInfo?.departments?.length
    ? universityInfo.departments.map((d) => ({ value: d, label: d }))
    : [
        { value: 'CSE', label: 'Computer Science & Engineering' },
        { value: 'EEE', label: 'Electrical & Electronic Engineering' },
        { value: 'BBA', label: 'Business Administration' },
        { value: 'English', label: 'Department of English' },
        { value: 'Other', label: 'Other' },
      ];

  const roleOptions = [
    { value: 'student', label: 'Student (Freelancer & Client)' },
    { value: 'alumni', label: 'Alumni (Freelancer & Client)' },
    { value: 'faculty', label: 'Faculty / Teacher (Client only)' },
    { value: 'department', label: 'Department Office (Client only)' },
  ];

  if (loading || isValidating) {
    return (
      <div className={styles.container}>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Account</h2>
      <p className={styles.subtitle}>
        {step === 1 ? 'Step 1: Sign up details' : `Step 2: ${universityInfo?.shortName || 'University'} profile details`}
      </p>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className={styles.form}>
          <Input
            type="email"
            label="University Email Address"
            placeholder="e.g. yourname@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting || isValidating}
            helperText="Use your official university email to sign up"
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
          <Input
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Button type="submit" variant="primary" fullWidth loading={isValidating}>
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className={styles.form}>
          {universityInfo && (
            <p style={{ textAlign: 'center', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              🏫 {universityInfo.name} ({universityInfo.shortName})
            </p>
          )}

          <Input
            type="text"
            label="Full Name"
            placeholder="e.g. Anisur Rahman"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Select
            label="I am a..."
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            required
            disabled={isSubmitting}
          />

          <Select
            label="Department / Office"
            options={departmentOptions}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Select Department / Office"
            required
            disabled={isSubmitting}
          />

          {(role === 'student' || role === 'alumni') && (
            <Input
              type="text"
              label="Student ID"
              placeholder="e.g. 221-15-1234"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required={role === 'student'}
              disabled={isSubmitting}
            />
          )}

          <div className={styles.buttonGroup}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!firebaseUser) {
                  setStep(1);
                }
              }}
              disabled={isSubmitting || !!firebaseUser}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className={styles.registerBtn}
            >
              Create Account
            </Button>
          </div>
        </form>
      )}

      <div className={styles.loginPrompt}>
        <span>Already have an account? </span>
        <Link href="/login" className={styles.loginLink}>
          Log In
        </Link>
      </div>
    </div>
  );
}
