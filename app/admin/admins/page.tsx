'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import tableStyles from '@/components/ui/Table.module.css';
import { 
  Shield, 
  ShieldAlert, 
  UserPlus, 
  Check, 
  Copy, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  RotateCw 
} from 'lucide-react';
import styles from './admins.module.css';

interface AdminRecord {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'moderator' | 'support';
  permissions: string[];
  createdBy?: {
    displayName: string;
    email: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AdminsManagementPage() {
  const { addToast } = useToast();
  const { adminProfile } = useAuth();
  
  // List states
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'super_admin' | 'moderator' | 'support'>('moderator');
  const [submitting, setSubmitting] = useState(false);
  
  // Success states
  const [createdAdmin, setCreatedAdmin] = useState<AdminRecord | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient<{ admins: AdminRecord[] }>('/api/admin/admins');
      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setAdmins(data.admins);
      }
    } catch {
      addToast('Failed to fetch admin users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !role) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    setSubmitting(true);
    setCreatedAdmin(null);
    setTempPassword(null);
    setCopied(false);

    try {
      const { data, error } = await apiClient<{ admin: AdminRecord; tempPassword: string | null }>('/api/admin/admins', {
        method: 'POST',
        body: { displayName, email, role },
      });

      if (error) {
        addToast(error, 'error');
      } else if (data) {
        addToast('Admin account provisioned successfully', 'success');
        setCreatedAdmin(data.admin);
        setTempPassword(data.tempPassword);
        
        // Reset form
        setDisplayName('');
        setEmail('');
        setRole('moderator');
        
        // Reload list
        loadAdmins();
      }
    } catch {
      addToast('An error occurred while creating admin', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminRecord: AdminRecord) => {
    if (!isSuperAdmin) {
      addToast('Only Super Administrators can modify admin status', 'error');
      return;
    }

    // Prevent demoting/deactivating themselves
    if (adminRecord.firebaseUid === adminProfile?.firebaseUid) {
      addToast('You cannot deactivate your own account', 'warning');
      return;
    }

    const newStatus = adminRecord.status === 'active' ? 'inactive' : 'active';
    const originalStatus = adminRecord.status;

    // Optimistic update
    setAdmins(prev => prev.map(a => a._id === adminRecord._id ? { ...a, status: newStatus } : a));

    try {
      const { data, error } = await apiClient<{ admin: AdminRecord }>('/api/admin/admins', {
        method: 'PATCH',
        body: { adminId: adminRecord._id, status: newStatus },
      });

      if (error) {
        addToast(error, 'error');
        // Rollback
        setAdmins(prev => prev.map(a => a._id === adminRecord._id ? { ...a, status: originalStatus } : a));
      } else if (data) {
        addToast(`Admin account ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
      }
    } catch {
      addToast('Failed to update admin status', 'error');
      // Rollback
      setAdmins(prev => prev.map(a => a._id === adminRecord._id ? { ...a, status: originalStatus } : a));
    }
  };

  const handleCopyCredentials = () => {
    if (!createdAdmin || !tempPassword) return;
    const text = `Email: ${createdAdmin.email}\nPassword: ${tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Credentials copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getRoleBadge = (role: AdminRecord['role']) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="error">Super Admin</Badge>;
      case 'moderator':
        return <Badge variant="warning">Moderator</Badge>;
      case 'support':
        return <Badge variant="muted">Support</Badge>;
      default:
        return <Badge variant="muted">{role}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Admin User Management</h1>
          <p>Control platform control panel access, add moderators, and manage administrative privileges.</p>
        </div>
      </div>

      <div className={styles.contentLayout}>
        {/* Left: Admins List */}
        <Card className={styles.listSection}>
          <div className={tableStyles.tableHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                System Administrators
              </h3>
            </div>
            <Button variant="outline" size="sm" onClick={loadAdmins} disabled={loading}>
              <RotateCw size={12} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
          </div>

          <div className={tableStyles.container}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added By</th>
                  <th>Added Date</th>
                  {isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className={styles.tableLoading}>
                      <span className={styles.spinner} /> Loading administrators...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className={styles.tableEmpty}>
                      No administrators found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin._id}>
                      <td>
                        <div className={styles.adminDetails}>
                          <div className={styles.avatar}>
                            {getInitials(admin.displayName)}
                          </div>
                          <div className={styles.adminInfo}>
                            <span className={styles.name}>{admin.displayName}</span>
                            <span className={styles.email}>{admin.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(admin.role)}</td>
                      <td>
                        <Badge variant={admin.status === 'active' ? 'success' : 'muted'}>
                          {admin.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {admin.createdBy?.displayName || 'System'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          {admin.firebaseUid !== adminProfile?.firebaseUid && (
                            <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(admin)}
                                className={admin.status === 'active' ? styles.deactivateBtn : styles.toggleBtn}
                                title={admin.status === 'active' ? 'Deactivate access' : 'Activate access'}
                              >
                                {admin.status === 'active' ? (
                                  <>
                                    <UserX size={12} style={{ marginRight: '4px' }} /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={12} style={{ marginRight: '4px' }} /> Activate
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right: Add Admin Form */}
        <Card className={styles.formSection}>
          <h2>Add Panel Staff</h2>
          
          {isSuperAdmin ? (
            <form onSubmit={handleCreateAdmin} className={styles.form}>
              <div className={styles.formGroup}>
                <Input
                  type="text"
                  label="Display Name"
                  placeholder="e.g. John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.formGroup}>
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="e.g. moderator@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className={styles.formGroup}>
                <Select
                  label="Administrative Role"
                  options={[
                    { value: 'super_admin', label: 'Super Admin (Full access)' },
                    { value: 'moderator', label: 'Moderator (Moderate content)' },
                    { value: 'support', label: 'Support Agent (Read reports)' },
                  ]}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  required
                  disabled={submitting}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
              >
                <UserPlus size={16} style={{ marginRight: '8px' }} />
                Provision Access
              </Button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <ShieldAlert size={36} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Only Super Administrators can create or invite administrative roles.
              </p>
            </div>
          )}

          {/* Provisioning Success Box */}
          {createdAdmin && tempPassword && (
            <div className={styles.successBox}>
              <h4>🔐 Credentials Generated</h4>
              <p>
                A new Firebase account has been created for this email. Share these login details safely:
              </p>
              <div className={styles.passwordDisplay}>
                {tempPassword}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyCredentials}
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {copied ? (
                    <>
                      <Check size={12} style={{ marginRight: '4px' }} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} style={{ marginRight: '4px' }} /> Copy Email & Pass
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
