'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './Sidebar.module.css';

/* ─── Types ──────────────────────────────────────────────────────── */

/** A single navigation item inside the sidebar. */
export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional numeric badge (e.g. unread count). */
  badge?: number;
}

/** A labelled group of sidebar items. */
export interface SidebarSection {
  /** Section heading displayed above the items (e.g. "Main", "Account"). */
  title?: string;
  items: SidebarItem[];
}

/** Minimal user info for the bottom user card. */
export interface SidebarUser {
  displayName: string;
  photoURL?: string | null;
  role: string;
}

export interface SidebarProps {
  /** Navigation sections to render. */
  sections: SidebarSection[];
  /** The href of the currently active page — used to highlight the active item. */
  activeHref: string;
  /** User displayed in the bottom mini-card. */
  user?: SidebarUser;
  /** Whether the sidebar is open on mobile. */
  isOpen?: boolean;
  /** Called when the mobile overlay is clicked. */
  onClose?: () => void;
  /** Callback when user logs out. */
  onLogout?: () => void;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

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
 * Fixed left sidebar for dashboard navigation.
 *
 * - Supports grouped sections with optional headings.
 * - Highlights the active item based on `activeHref`.
 * - Shows a user mini-card at the bottom.
 * - Becomes a slide-over overlay on mobile.
 */
export function Sidebar({ sections, activeHref, user, isOpen = false, onClose, onLogout }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        role="navigation"
        aria-label="Sidebar"
      >
        <nav className={styles.nav}>
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <div className={styles.sectionLabel}>{section.title}</div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon size={18} className={styles.itemIcon} />
                    <span className={styles.itemLabel}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={styles.itemBadge}>{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User mini card */}
        {user && (
          <div className={styles.userCard}>
            <span className={styles.userAvatar}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} />
              ) : (
                getInitials(user.displayName)
              )}
            </span>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.displayName}</div>
              <div className={styles.userRole}>{user.role}</div>
            </div>
          </div>
        )}

        {/* Mobile-only actions (Theme Toggle & Logout) */}
        {user && (
          <div className={styles.sidebarActions}>
            <button
              className={styles.sidebarActionBtn}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
            </button>
            {onLogout && (
              <button
                className={`${styles.sidebarActionBtn} ${styles.logoutBtn}`}
                onClick={onLogout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
