'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Input, Select } from '@/components/ui';
import { isDiuEmail } from '@/lib/utils';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register, userProfile, firebaseUser, loading } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'alumni' | 'department'>('student');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only redirect to dashboard if the user profile is completely registered in MongoDB
    if (!loading && userProfile) {
      router.push('/dashboard');
    }
  }, [userProfile, loading, router]);

  useEffect(() => {
    // If user is authenticated on Firebase but profile is not created in MongoDB (e.g. Google Login),
    // skip step 1 and show the profile details form (step 2) directly.
    if (firebaseUser && !userProfile) {
      setStep(2);
    }
  }, [firebaseUser, userProfile]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    if (!isDiuEmail(email)) {
      addToast('Please use your official DIU email address (@diu.edu.bd, @daffodilvarsity.edu.bd or @s.diu.edu.bd)', 'error');
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

    setStep(2);
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

  const departmentOptions = [
    { value: 'CSE', label: 'Computer Science & Engineering' },
    { value: 'SWE', label: 'Software Engineering' },
    { value: 'EEE', label: 'Electrical & Electronic Engineering' },
    { value: 'TE', label: 'Textile Engineering' },
    { value: 'Pharmacy', label: 'Department of Pharmacy' },
    { value: 'English', label: 'Department of English' },
    { value: 'BBA', label: 'Business Administration' },
    { value: 'ESD', label: 'Enterprise Systems Development' },
    { value: 'Administration', label: 'University Administration / Offices' },
  ];

  const roleOptions = [
    { value: 'student', label: 'Student (Freelancer & Client)' },
    { value: 'alumni', label: 'Alumni (Freelancer & Client)' },
    { value: 'faculty', label: 'Faculty / Teacher (Client only)' },
    { value: 'department', label: 'Department Office (Client only)' },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Account</h2>
      <p className={styles.subtitle}>
        {step === 1 ? 'Step 1: Sign up details' : 'Step 2: University profile details'}
      </p>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className={styles.form}>
          <Input
            type="email"
            label="DIU Email Address"
            placeholder="e.g. yourname.cse@diu.edu.bd"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            helperText="Requires a valid @diu.edu.bd, @daffodilvarsity.edu.bd, or @s.diu.edu.bd email"
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

          <Button type="submit" variant="primary" fullWidth>
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className={styles.form}>
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
              onClick={() => setStep(1)}
              disabled={isSubmitting}
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
