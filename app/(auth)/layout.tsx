'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './AuthLayout.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.backLinkWrapper}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
      <div className={styles.cardWrapper}>
        <div className={styles.branding}>
          <div className={styles.logo}>MicroJobs</div>
          <p className={styles.tagline}>The student freelancing & micro-jobs marketplace</p>
        </div>
        {children}
      </div>
    </div>
  );
}
