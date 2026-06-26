'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Bell,
  User,
  Settings,
  Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

export default function AppDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, userProfile, adminProfile, loading, profileChecked, logout, isAdmin } = useAuth();

  // Dynamic badge states
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!firebaseUser || !userProfile) return;

    const fetchCounts = async () => {
      try {
        const [notifRes, convRes] = await Promise.all([
          apiClient<{ pagination: { total: number } }>('/api/notifications?unreadOnly=true&limit=1'),
          apiClient<{ conversations: Array<{ unreadCount: Record<string, number> }> }>('/api/messages/conversations'),
        ]);

        if (notifRes.data) {
          setUnreadNotifications(notifRes.data.pagination.total);
        }

        if (convRes.data) {
          const totalUnreadMsg = convRes.data.conversations.reduce((sum, conv) => {
            return sum + (conv.unreadCount[userProfile._id] || 0);
          }, 0);
          setUnreadMessages(totalUnreadMsg);
        }
      } catch (err) {
        console.error('Failed to sync notification counts:', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [firebaseUser, userProfile]);

  useEffect(() => {
    if (!loading && profileChecked) {
      if (!firebaseUser) {
        router.push('/login');
      } else if (!userProfile) {
        router.push('/register');
      }
    }
  }, [firebaseUser, userProfile, loading, profileChecked, router]);

  // Show skeleton while loading session or fetching profile
  if (loading || !profileChecked) {
    return (
      <div style={{ padding: 'var(--space-12)', maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <Skeleton height="64px" width="100%" borderRadius="var(--radius-lg)" />
        <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-6)', minHeight: '60vh' }}>
          <Skeleton height="100%" width="260px" borderRadius="var(--radius-lg)" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton height="40px" width="40%" />
            <Skeleton height="200px" width="100%" />
            <Skeleton height="200px" width="100%" />
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return null;
  }

  // Handle suspended/banned users
  if (userProfile.status === 'suspended' || userProfile.status === 'banned') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        padding: 'var(--space-6)'
      }}>
        <div style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h1 style={{ color: 'var(--color-error)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
            Account {userProfile.status === 'banned' ? 'Banned' : 'Suspended'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            Your access to Microjobs has been disabled by the administrators.
          </p>
          {userProfile.status === 'suspended' && (
            <div style={{
              backgroundColor: 'var(--color-error-light)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontSize: 'var(--text-sm)',
              textAlign: 'left',
              marginBottom: 'var(--space-6)'
            }}>
              <strong>Reason:</strong> {userProfile.status || 'Violation of terms of service.'}
            </div>
          )}
          <button
            onClick={() => logout().then(() => router.push('/login'))}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer'
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Define sidebar navigation segments
  const clientItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse Jobs', href: '/jobs', icon: Briefcase },
    { label: 'My Proposals', href: '/proposals', icon: FileText },
    { label: 'My Contracts', href: '/contracts', icon: ClipboardCheck },
    { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadMessages },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadNotifications },
  ];

  const adminItem = isAdmin ? [{ label: 'Admin Panel', href: '/admin', icon: Shield }] : [];

  const footerItems = [
    { label: 'My Profile', href: `/profile/${userProfile._id}`, icon: User },
    { label: 'Edit Profile', href: '/profile', icon: Settings },
  ];

  const sidebarSections = [
    { title: 'Overview', items: [...clientItems, ...adminItem] },
    { title: 'Account', items: footerItems },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <DashboardLayout
      user={{
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
        role: userProfile.role.toUpperCase(),
      }}
      notificationCount={unreadNotifications}
      sidebarSections={sidebarSections}
      activeHref={pathname}
      onLogout={handleLogout}
    >
      {children}
    </DashboardLayout>
  );
}
