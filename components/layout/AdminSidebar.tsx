'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderTree,
  Flag,
  ShieldCheck,
  Settings,
  BarChart3,
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

/* ─── Types ──────────────────────────────────────────────────────── */

/** A single navigation item in the admin sidebar. */
export interface AdminSidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional numeric badge (e.g. pending-review count). */
  badge?: number;
}

/** A labelled group of admin sidebar items. */
export interface AdminSidebarSection {
  title?: string;
  items: AdminSidebarItem[];
}

export interface AdminSidebarProps {
  /** Navigation sections. Defaults to the standard admin menu if omitted. */
  sections?: AdminSidebarSection[];
  /** Currently active page href. */
  activeHref: string;
  /** Whether the sidebar is open on mobile. */
  isOpen?: boolean;
  /** Called when the mobile overlay is clicked. */
  onClose?: () => void;
}

/* ─── Defaults ───────────────────────────────────────────────────── */

/** Standard admin navigation used when no custom sections are passed. */
const DEFAULT_SECTIONS: AdminSidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Reports', href: '/admin/reports', icon: Flag },
    ],
  },
];

/* ─── Component ──────────────────────────────────────────────────── */

/**
 * Admin-specific sidebar navigation.
 *
 * Visually distinct from the regular Sidebar:
 * - Shows an "ADMIN" badge header.
 * - Active items use an error-tinted color with a left-border accent.
 * - Badge counts use a warning-colored background.
 */
export function AdminSidebar({
  sections = DEFAULT_SECTIONS,
  activeHref,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        role="navigation"
        aria-label="Admin sidebar"
      >
        {/* Admin indicator */}
        <div className={styles.adminHeader}>
          <span className={styles.adminBadge}>Admin</span>
          <span className={styles.adminTitle}>Control Panel</span>
        </div>

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
                      <span className={styles.itemBadge}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.version}>DIU MicroJobs v0.1.0</span>
        </div>
      </aside>
    </>
  );
}
