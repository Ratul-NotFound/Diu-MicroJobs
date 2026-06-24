'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, Bell, ChevronDown, LayoutDashboard, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

/* ─── Types ──────────────────────────────────────────────────────── */

/** Minimal user object for rendering auth-aware navbar states. */
export interface NavbarUser {
  displayName: string;
  photoURL?: string | null;
  role: string;
}

export interface NavbarProps {
  /** Current authenticated user. When undefined the navbar shows Log In / Sign Up. */
  user?: NavbarUser;
  /** Number of unread notifications. Shows a dot when > 0. */
  notificationCount?: number;
  /** Callback fired when the user clicks "Log Out". */
  onLogout?: () => void;
  /** Callback fired when the hamburger or mobile‑sidebar toggle is clicked. */
  onMenuToggle?: () => void;
}

/* ─── Constants ──────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: '/jobs', label: 'Find Jobs' },
  { href: '/jobs/create', label: 'Post a Job' },
  { href: '/#how-it-works', label: 'How it Works' },
] as const;

/* ─── Helpers ────────────────────────────────────────────────────── */

/** Return first letter(s) for the avatar fallback. */
function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ─── Component ──────────────────────────────────────────────────── */

/**
 * Top-level navigation bar.
 *
 * - Fixed to the top of the viewport.
 * - Shows logo, desktop nav links, and auth actions.
 * - Collapses to a hamburger menu on mobile with a slide-out panel.
 */
export function Navbar({ user, notificationCount = 0, onLogout, onMenuToggle }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  /* Close dropdown on outside click */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  /* Lock scroll when mobile panel is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Primary">
      {/* ── Left: Logo ── */}
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Micro</span>
          <span className={styles.logoTextAccent}>Jobs</span>
        </Link>
        <span className={styles.badge}>Beta</span>
      </div>

      {/* ── Center: Desktop navigation ── */}
      <div className={styles.center}>
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.navLink}>
            {label}
          </Link>
        ))}
      </div>

      {/* ── Right: Auth actions ── */}
      <div className={styles.right}>
        {/* Theme Toggle (Desktop Only) */}
        <button
          className={`${styles.themeToggle} ${styles.desktopOnly}`}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {user ? (
          <>
            {/* Notifications */}
            <Link href="/notifications" className={`${styles.iconButton} ${styles.desktopOnly}`}>
              <Bell size={18} />
              {notificationCount > 0 && <span className={styles.notificationDot} />}
            </Link>

            {/* Avatar dropdown */}
            <div className={styles.dropdownWrapper} ref={dropdownRef}>
              <button
                className={styles.avatarButton}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span className={styles.avatar}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    getInitials(user.displayName)
                  )}
                </span>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown} role="menu">
                  <Link
                    href="/dashboard"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard size={15} />
                    My Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={15} />
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={styles.dropdownItemDanger}
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout?.();
                    }}
                  >
                    <LogOut size={15} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.desktopOnly} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link href="/login" className={styles.ghostButton}>
              Log In
            </Link>
            <Link href="/register" className={styles.primaryButton}>
              Sign Up
            </Link>
          </div>
        )}

        {/* Hamburger (mobile only) */}
        <button
          className={styles.hamburger}
          onClick={() => {
            if (onMenuToggle) {
              onMenuToggle();
            } else {
              setMobileOpen(true);
            }
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile slide-out panel ── */}
      {mobileOpen && (
        <>
          <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
          <div className={styles.mobilePanel}>
            <div className={styles.mobileHeader}>
              <span className={styles.logo} style={{ fontSize: 'var(--text-md)' }}>
                <span className={styles.logoText}>Micro</span>
                <span className={styles.logoTextAccent}>Jobs</span>
              </span>
              <button
                className={styles.mobileClose}
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.mobileNav}>
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={styles.mobileNavLink}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className={styles.mobileActions}>
              {/* Theme Toggle (Mobile) */}
              <button
                className={styles.mobileThemeToggle}
                onClick={() => {
                  toggleTheme();
                }}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === 'light' ? (
                  <>
                    <Moon size={18} />
                    <span>Dark Theme</span>
                  </>
                ) : (
                  <>
                    <Sun size={18} />
                    <span>Light Theme</span>
                  </>
                )}
              </button>

              {user ? (
                <>
                  <Link href="/dashboard" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/notifications" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
                    Notifications{notificationCount > 0 ? ` (${notificationCount})` : ''}
                  </Link>
                  <button
                    className={styles.mobileNavLink}
                    onClick={() => {
                      setMobileOpen(false);
                      onLogout?.();
                    }}
                    style={{ textAlign: 'left', color: 'var(--color-error)' }}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.ghostButton} onClick={() => setMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/register" className={styles.primaryButton} onClick={() => setMobileOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
