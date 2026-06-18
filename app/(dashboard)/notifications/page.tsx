'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/lib/api-client';
import {
  Bell,
  Check,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Briefcase,
  Award,
  Star,
  Shield,
  Eye
} from 'lucide-react';
import styles from './notifications.module.css';

interface NotificationItem {
  _id: string;
  type:
    | 'proposal_received'
    | 'proposal_accepted'
    | 'proposal_rejected'
    | 'new_message'
    | 'contract_ready'
    | 'job_completed'
    | 'review_received'
    | 'admin_action';
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (unread: boolean) => {
    try {
      setLoading(true);
      const { data, error } = await apiClient<{ notifications: NotificationItem[] }>(
        `/api/notifications?unreadOnly=${unread}&limit=50`
      );

      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setNotifications(data.notifications);
      }
    } catch {
      addToast('Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchNotifications(unreadOnly);
    }
  }, [userProfile, unreadOnly]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const { error } = await apiClient('/api/notifications', {
        method: 'PATCH',
        body: { all: true },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('All notifications marked as read', 'success');
        // Update local state
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
      }
    } catch {
      addToast('Failed to mark all as read', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      // Optimistic state update
      setNotifications(
        notifications.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );

      // Send to server
      try {
        await apiClient('/api/notifications', {
          method: 'PATCH',
          body: { ids: [item._id] },
        });
      } catch (err) {
        console.error('Failed to mark notification read on server', err);
      }
    }

    if (item.link) {
      router.push(item.link);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'proposal_received':
        return <FileText size={18} className={styles.proposalIcon} />;
      case 'proposal_accepted':
        return <CheckCircle size={18} className={styles.successIcon} />;
      case 'proposal_rejected':
        return <XCircle size={18} className={styles.errorIcon} />;
      case 'new_message':
        return <MessageSquare size={18} className={styles.messageIcon} />;
      case 'contract_ready':
        return <Briefcase size={18} className={styles.contractIcon} />;
      case 'job_completed':
        return <Award size={18} className={styles.awardIcon} />;
      case 'review_received':
        return <Star size={18} className={styles.starIcon} />;
      case 'admin_action':
        return <Shield size={18} className={styles.adminIcon} />;
      default:
        return <Bell size={18} className={styles.defaultIcon} />;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on your active jobs, proposals, and chats.</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
          >
            <Check size={14} style={{ marginRight: '6px' }} />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterTab} ${!unreadOnly ? styles.active : ''}`}
          onClick={() => setUnreadOnly(false)}
        >
          All Notifications
        </button>
        <button
          className={`${styles.filterTab} ${unreadOnly ? styles.active : ''}`}
          onClick={() => setUnreadOnly(true)}
        >
          Unread
          {notifications.some((n) => !n.read) && (
            <span className={styles.unreadCountBadge}>
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* List Container */}
      <Card className={styles.listCard}>
        {loading ? (
          <div className={styles.skeletons}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="60px" />
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              title={unreadOnly ? 'No Unread Notifications' : 'No Notifications'}
              description={
                unreadOnly
                  ? 'You are all caught up! There are no unread notifications.'
                  : 'You do not have any notifications yet. Alerts will appear here when you receive messages, proposals, or contracts.'
              }
              icon={Bell}
            />
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`${styles.item} ${!item.read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleNotificationClick(item);
                  }
                }}
              >
                <div className={styles.iconContainer}>{getIcon(item.type)}</div>
                <div className={styles.content}>
                  <div className={styles.itemHeader}>
                    <h4 className={styles.title}>{item.title}</h4>
                    <span className={styles.time}>
                      {new Date(item.createdAt).toLocaleDateString()}{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={styles.body}>{item.body}</p>
                </div>
                {item.link && (
                  <div className={styles.actionIndicator} title="View Details">
                    <Eye size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
