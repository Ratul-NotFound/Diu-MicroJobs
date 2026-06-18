'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import tableStyles from '@/components/ui/Table.module.css';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SearchBar } from '@/components/ui/SearchBar';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  AlertOctagon,
  MoreVertical,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import styles from './users.module.css';

interface UserRecord {
  _id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'student' | 'faculty' | 'alumni' | 'department';
  department: string;
  studentId?: string;
  rating: number;
  completedJobs: number;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'banned';
  suspensionReason?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { addToast } = useToast();
  
  // List states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Action states
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [modalType, setModalType] = useState<'suspend' | 'ban' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`;
      if (role !== 'all') url += `&role=${role}`;
      if (status !== 'all') url += `&status=${status}`;

      const { data, error } = await apiClient<{ users: UserRecord[]; pagination: { pages: number } }>(url);
      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch {
      addToast('Failed to load user records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, role, status]);

  const handleSearchSubmit = () => {
    setPage(1);
    loadUsers();
  };

  const handleAction = async (userId: string, action: 'verify' | 'activate' | 'suspend' | 'ban', reason?: string) => {
    setProcessing(true);
    try {
      const { data, error } = await apiClient('/api/admin/users', {
        method: 'PATCH',
        body: { userId, action, reason },
      });

      if (error) {
        addToast(error, 'error');
      } else if (data) {
        addToast(`User account updated successfully`, 'success');
        // Close modal
        setModalType(null);
        setSelectedUser(null);
        setActionReason('');
        
        // Reload list
        loadUsers();
      }
    } catch {
      addToast('An error occurred during transaction', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (user: UserRecord, type: 'suspend' | 'ban') => {
    setSelectedUser(user);
    setModalType(type);
    setActionReason('');
  };

  const getStatusBadge = (statusValue: UserRecord['status']) => {
    switch (statusValue) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="warning">Suspended</Badge>;
      case 'banned':
        return <Badge variant="error">Banned</Badge>;
      default:
        return <Badge variant="muted">{statusValue}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>User Verification & Moderation</h1>
          <p>Control access privileges, freeze bad actors, and verify academic IDs.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersLayout}>
          <div className={styles.searchBox}>
            <SearchBar
              placeholder="Search by name, email, or student ID..."
              value={search}
              onChange={setSearch}
              onSearch={handleSearchSubmit}
              size="md"
            />
            <Button size="md" variant="secondary" onClick={handleSearchSubmit}>
              Search
            </Button>
          </div>

          <div className={styles.selectsRow}>
            <div className={styles.selectGroup}>
              <label htmlFor="role-filter">Role</label>
              <Select
                id="role-filter"
                value={role}
                onChange={(e) => { setRole(e.target.value); setPage(1); }}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'student', label: 'Students' },
                  { value: 'faculty', label: 'Faculty' },
                  { value: 'alumni', label: 'Alumni' },
                  { value: 'department', label: 'Departments' },
                ]}
              />
            </div>

            <div className={styles.selectGroup}>
              <label htmlFor="status-filter">Status</label>
              <Select
                id="status-filter"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'banned', label: 'Banned' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className={styles.tableCard}>
        <div className={tableStyles.container}>
          <table className={tableStyles.table}>
            <thead>
              <tr className={tableStyles.headerRow}>
                <th className={tableStyles.headerCell}>User Details</th>
                <th className={tableStyles.headerCell}>Student ID / Dept</th>
                <th className={tableStyles.headerCell}>Role</th>
                <th className={tableStyles.headerCell}>Finished Gigs</th>
                <th className={tableStyles.headerCell}>Verification</th>
                <th className={tableStyles.headerCell}>Status</th>
                <th className={tableStyles.headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.tableLoading}>
                    <div className={styles.spinner} />
                    <span>Loading records...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.tableEmpty}>
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className={tableStyles.row}>
                    <td className={tableStyles.cell}>
                      <div className={styles.userDetails}>
                        <div className={styles.avatar}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} />
                          ) : (
                            user.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.name}>{user.displayName}</span>
                          <span className={styles.email}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={tableStyles.cell}>
                      <div className={styles.idInfo}>
                        <span className={styles.studentIdVal}>{user.studentId || 'N/A'}</span>
                        <span className={styles.deptVal}>{user.department}</span>
                      </div>
                    </td>
                    <td className={tableStyles.cell}>
                      <span className={styles.roleTag}>{user.role.toUpperCase()}</span>
                    </td>
                    <td className={tableStyles.cell}>
                      <span className={styles.completedCount}>
                        {user.completedJobs} jobs ({user.rating.toFixed(1)}★)
                      </span>
                    </td>
                    <td className={tableStyles.cell}>
                      {user.isVerified ? (
                        <Badge variant="success" className={styles.verifyBadge}>
                          <ShieldCheck size={12} />
                          Verified
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(user._id, 'verify')}
                        >
                          Verify
                        </Button>
                      )}
                    </td>
                    <td className={tableStyles.cell}>{getStatusBadge(user.status)}</td>
                    <td className={tableStyles.cell}>
                      <div className={styles.actionsCell}>
                        {user.status === 'active' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className={styles.suspendBtn}
                              onClick={() => openActionModal(user, 'suspend')}
                            >
                              <Lock size={12} />
                              Suspend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={styles.banBtn}
                              onClick={() => openActionModal(user, 'ban')}
                            >
                              <UserX size={12} />
                              Ban
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className={styles.activateBtn}
                            onClick={() => handleAction(user._id, 'activate')}
                          >
                            <Unlock size={12} />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <span className={styles.pageText}>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Moderation reason input Modal */}
      {modalType && selectedUser && (
        <Modal
          title={modalType === 'suspend' ? 'Suspend Account' : 'Permanently Ban User'}
          onClose={() => { setModalType(null); setSelectedUser(null); }}
        >
          <div className={styles.modalContent}>
            <div className={styles.warningAlert}>
              <AlertOctagon size={24} />
              <div>
                <h4>Confirm Actions for {selectedUser.displayName}</h4>
                <p>
                  This will revoke their access to DIU MicroJobs immediately. Any active gigs 
                  and drafts associated with this user will be suspended.
                </p>
              </div>
            </div>

            <div className={styles.modalFormGroup}>
              <label htmlFor="moderation-reason">Reason for {modalType === 'suspend' ? 'suspension' : 'permanent ban'}</label>
              <textarea
                id="moderation-reason"
                className={styles.modalTextarea}
                placeholder="Describe why this disciplinary action is being taken (shown to the user)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => { setModalType(null); setSelectedUser(null); }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={processing}
                disabled={!actionReason.trim()}
                onClick={() => handleAction(selectedUser._id, modalType, actionReason)}
              >
                Confirm {modalType === 'suspend' ? 'Suspension' : 'Ban'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
