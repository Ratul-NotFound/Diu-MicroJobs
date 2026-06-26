'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  Shield,
  Moon,
  Sun,
  Mail,
  User,
  AlertTriangle,
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { userProfile, resetPassword, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  
  const [sendingReset, setSendingReset] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleSendResetEmail = async () => {
    if (!userProfile?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(userProfile.email);
      addToast('Password reset email sent to your inbox!', 'success');
    } catch {
      addToast('Failed to send password reset email', 'error');
    } finally {
      setSendingReset(false);
    }
  };

  const handleDeactivate = async () => {
    // Show a warning and ask for confirmation
    const confirm = window.confirm(
      'Are you sure you want to deactivate your account? You will lose access to all active proposals and messaging history. This action requires admin approval to reverse.'
    );
    if (!confirm) return;

    setDeactivating(true);
    // Mimic account deactivation - send a request to admin or log out
    setTimeout(async () => {
      setDeactivating(false);
      addToast('Your deactivation request has been logged. Logging you out...', 'info');
      await logout();
    }, 1500);
  };

  if (!userProfile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Settings size={28} className={styles.headerIcon} />
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences, security settings, and interface theme.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Account Details & Security */}
        <div className={styles.mainColumn}>
          {/* Section: Account Information */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <User size={18} />
              <h2>Account Information</h2>
            </div>
            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email Address</span>
                <span className={styles.detailValue}>
                  {userProfile.email}
                  <span className={styles.readOnlyBadge}>Verified Domain</span>
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Platform Role</span>
                <span className={styles.detailValue}>
                  {userProfile.role.toUpperCase()}
                </span>
              </div>
              {userProfile.studentId && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Student ID</span>
                  <span className={styles.detailValue}>{userProfile.studentId}</span>
                </div>
              )}
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Verification Status</span>
                <span className={styles.detailValue}>
                  {userProfile.isVerified ? (
                    <span className={styles.statusVerified}>Verified Member</span>
                  ) : (
                    <span className={styles.statusUnverified}>Pending Moderation</span>
                  )}
                </span>
              </div>
            </div>
            <div className={styles.infoAlert}>
              <Info size={16} />
              <p>
                To change your registered email, role, or student ID, please submit a support ticket 
                via email to contact the Microjobs administration team.
              </p>
            </div>
          </Card>

          {/* Section: Password & Security */}
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <Lock size={18} />
              <h2>Password & Security</h2>
            </div>
            <p className={styles.sectionDescription}>
              Update your account password. Since authentication is powered by Firebase, we will send 
              a secure link to your email to perform the change safely.
            </p>
            <div className={styles.securityAction}>
              <div className={styles.securityText}>
                <h4>Reset Your Password</h4>
                <p>Sends a recovery and update link to {userProfile.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleSendResetEmail}
                loading={sendingReset}
              >
                Send Reset Email
              </Button>
            </div>
          </Card>

          {/* Section: Danger Zone */}
          <Card className={`${styles.sectionCard} ${styles.dangerZone}`}>
            <div className={styles.cardHeader}>
              <AlertTriangle size={18} />
              <h2>Danger Zone</h2>
            </div>
            <p className={styles.sectionDescription}>
              Deactivating your account will freeze your listings and active proposals. Your public 
              profile will no longer be visible on the university board.
            </p>
            <div className={styles.dangerAction}>
              <Button
                variant="danger"
                onClick={handleDeactivate}
                loading={deactivating}
              >
                Deactivate My Account
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Preference Toggles */}
        <div className={styles.sideColumn}>
          <Card className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <Shield size={18} />
              <h2>Preferences</h2>
            </div>
            
            {/* Theme Toggle Option */}
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h4>Interface Theme</h4>
                <p>Toggle between Light mode and Dark mode layouts.</p>
              </div>
              <button
                className={styles.themeToggleBtn}
                onClick={toggleTheme}
                aria-label="Toggle layout theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={16} />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* University Resource links */}
            <div className={styles.linksSection}>
              <h3>Helpful Links</h3>
              <a
                href={`https://www.${userProfile.email.split('@')[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sidebarLink}
              >
                <span>{userProfile.university?.shortName || 'University'} Portal</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="mailto:support@microjobs.com"
                className={styles.sidebarLink}
              >
                <span>Support Desk</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
