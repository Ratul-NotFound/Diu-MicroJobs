'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ShieldAlert, 
  LogOut, 
  LayoutDashboard, 
  Menu,
  Users,
  Briefcase,
  FolderTree,
  Flag,
  ShieldCheck,
  School,
  Receipt
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import styles from './admin-layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { adminProfile, loading, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Live admin counts states
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchCounts = async () => {
      try {
        const [jobsRes, reportsRes] = await Promise.all([
          apiClient<{ pagination: { total: number } }>('/api/admin/jobs?status=pending_review&limit=1'),
          apiClient<{ pagination: { total: number } }>('/api/admin/reports?status=pending&limit=1'),
        ]);

        if (jobsRes.data) {
          setPendingJobsCount(jobsRes.data.pagination.total);
        }
        if (reportsRes.data) {
          setPendingReportsCount(reportsRes.data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to fetch admin sidebar counts:', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [isAdmin]);

  // If loading auth state, show a clean loading view
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Verifying administrator credentials...</p>
      </div>
    );
  }

  // If not an admin, render the Access Denied screen
  if (!isAdmin) {
    return (
      <div className={styles.accessDeniedContainer}>
        <Card className={styles.deniedCard}>
          <ShieldAlert size={48} className={styles.deniedIcon} />
          <h2>Access Denied</h2>
          <p>
            This area is restricted to Microjobs platform administrators. 
            If you think this is a mistake, please contact support.
          </p>
          <div className={styles.deniedActions}>
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              <LayoutDashboard size={16} style={{ marginRight: '8px' }} />
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={async () => { await logout(); router.push('/login'); }}>
              <LogOut size={16} style={{ marginRight: '8px' }} />
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const adminSections = [
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
        { label: 'Jobs', href: '/admin/jobs', icon: Briefcase, badge: pendingJobsCount },
        { label: 'Universities', href: '/admin/universities', icon: School },
        { label: 'Escrow & Gigs', href: '/admin/contracts', icon: Receipt },
        { label: 'Categories', href: '/admin/categories', icon: FolderTree },
        { label: 'Reports', href: '/admin/reports', icon: Flag, badge: pendingReportsCount },
        { label: 'Admins', href: '/admin/admins', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <div className={styles.layoutWrapper}>
      {/* Sidebar for Admin */}
      <AdminSidebar
        sections={adminSections}
        activeHref={pathname}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Panel */}
      <div className={styles.mainPanel}>
        {/* Admin Header */}
        <header className={styles.header}>
          <button
            className={styles.menuToggle}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className={styles.headerTitle}>
            <span className={styles.adminTag}>Portal Admin</span>
            <span className={styles.roleName}>
              {adminProfile?.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className={styles.userSection}>
            <span className={styles.userName}>{adminProfile?.displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className={styles.logoutBtn}
            >
              <LogOut size={15} />
              <span className={styles.logoutText}>Exit</span>
            </Button>
          </div>
        </header>

        {/* Admin Page Content */}
        <main className={styles.content}>
          <div className={styles.container}>{children}</div>
        </main>
      </div>
    </div>
  );
}
