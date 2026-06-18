'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Navbar, type NavbarUser } from './Navbar';
import { Sidebar, type SidebarSection, type SidebarUser } from './Sidebar';
import styles from './DashboardLayout.module.css';

/* ─── Types ──────────────────────────────────────────────────────── */

/** A single breadcrumb segment. */
export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface DashboardLayoutProps {
  /** User passed to both Navbar and Sidebar. */
  user?: NavbarUser & SidebarUser;
  /** Notification count shown in the navbar bell icon. */
  notificationCount?: number;
  /** Sidebar navigation sections. */
  sidebarSections: SidebarSection[];
  /** Currently active sidebar href. */
  activeHref: string;
  /** Breadcrumb trail displayed above the page title. */
  breadcrumbs?: Breadcrumb[];
  /** Page title rendered at the top of the content area. */
  title?: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** Action area rendered to the right of the title (e.g. a button). */
  headerAction?: React.ReactNode;
  /** Callback when user logs out. */
  onLogout?: () => void;
  /** Page content. */
  children: React.ReactNode;
}

/* ─── Component ──────────────────────────────────────────────────── */

/**
 * Full dashboard shell: Navbar + Sidebar + content area.
 *
 * Provides:
 * - Top navbar with auth and notification indicators.
 * - Left sidebar with grouped navigation.
 * - Breadcrumbs and page-title header.
 * - Mobile sidebar toggle via the hamburger menu.
 */
export function DashboardLayout({
  user,
  notificationCount,
  sidebarSections,
  activeHref,
  breadcrumbs,
  title,
  subtitle,
  headerAction,
  onLogout,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar
        user={user}
        notificationCount={notificationCount}
        onLogout={onLogout}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
      />

      <div className={styles.layout}>
        <Sidebar
          sections={sidebarSections}
          activeHref={activeHref}
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={styles.content}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {idx > 0 && (
                      <ChevronRight size={12} className={styles.breadcrumbSeparator} />
                    )}
                    {isLast || !crumb.href ? (
                      <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className={styles.breadcrumbItem}>
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
          )}

          {/* Page header */}
          {(title || headerAction) && (
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              {headerAction}
            </div>
          )}

          {children}
        </main>
      </div>
    </>
  );
}
