import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';
import styles from './Footer.module.css';

/* ─── Types ──────────────────────────────────────────────────────── */

export interface FooterProps {
  /** Optional extra className applied to the root element. */
  className?: string;
}

/* ─── Constants ──────────────────────────────────────────────────── */

const QUICK_LINKS = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/jobs/create', label: 'Post a Job' },
  { href: '/#how-it-works', label: 'How it Works' },
] as const;

/* ─── Component ──────────────────────────────────────────────────── */

/**
 * Public-facing footer for landing and informational pages.
 *
 * - 3-column responsive layout: brand + quick links + contact.
 * - Dark background with light text.
 * - Stacks to single-column on mobile.
 */
export function Footer({ className }: FooterProps) {
  return (
    <footer className={`${styles.footer} ${className ?? ''}`}>
      <div className={styles.container}>
        <div className={styles.columns}>
          {/* Column 1: Brand */}
          <div className={styles.brand}>
            <span className={styles.brandLogo}>Microjobs</span>
            <p className={styles.brandDescription}>
              The trusted student freelancing and micro-jobs marketplace.
              Connect with talented students, faculty, and alumni for your next project.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className={styles.columnTitle}>Quick Links</h4>
            <div className={styles.links}>
              {QUICK_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={styles.link}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className={styles.columnTitle}>Contact</h4>
            <div className={styles.contactItem}>
              <MapPin size={16} className={styles.contactIcon} />
              <span>Registered University Campuses, Dhaka, Bangladesh</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <span>support@microjobs.com</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <span>+880 1234-567890</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={`${styles.container} ${styles.bottomContent}`}>
          <span className={styles.copyright}>
            © 2025 Microjobs. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
