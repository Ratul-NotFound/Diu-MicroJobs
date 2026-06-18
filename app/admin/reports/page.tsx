'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/lib/api-client';
import {
  Flag,
  User,
  ShieldCheck,
  AlertOctagon,
  Check,
  X,
  FileText,
  Calendar,
  MessageSquare,
  Scale
} from 'lucide-react';
import styles from './reports.module.css';

interface ReportRecord {
  _id: string;
  reporter: {
    _id: string;
    displayName: string;
    email: string;
    studentId?: string;
    role: string;
  } | null;
  targetType: 'job' | 'user' | 'message' | 'review';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: {
    displayName: string;
    role: string;
  };
  resolution?: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const { addToast } = useToast();

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Resolution Modal states
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [modalType, setModalType] = useState<'resolve' | 'dismiss' | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient<{ reports: ReportRecord[]; pagination: { pages: number } }>(
        `/api/admin/reports?status=${activeTab}&page=${page}&limit=10`
      );

      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setReports(data.reports);
        setTotalPages(data.pagination.pages);
      }
    } catch {
      addToast('Failed to fetch reports list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, page]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !modalType) return;
    if (!resolutionText.trim()) {
      addToast('Resolution notes are required', 'error');
      return;
    }

    setProcessing(true);
    const targetStatus = modalType === 'resolve' ? 'resolved' : 'dismissed';

    try {
      const { error } = await apiClient('/api/admin/reports', {
        method: 'PATCH',
        body: {
          reportId: selectedReport._id,
          status: targetStatus,
          resolution: resolutionText,
        },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast(`Report ${targetStatus} successfully!`, 'success');
        setModalType(null);
        setSelectedReport(null);
        setResolutionText('');
        fetchReports();
      }
    } catch {
      addToast('An error occurred during transaction', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (report: ReportRecord, type: 'resolve' | 'dismiss') => {
    setSelectedReport(report);
    setModalType(type);
    setResolutionText(
      type === 'dismiss'
        ? 'Dismissed after evaluation: No violations found.'
        : ''
    );
  };

  const getTargetTypeBadge = (type: ReportRecord['targetType']) => {
    switch (type) {
      case 'job':
        return <Badge variant="primary">Job Post</Badge>;
      case 'user':
        return <Badge variant="warning">User Profile</Badge>;
      case 'message':
        return <Badge variant="secondary">Message</Badge>;
      case 'review':
        return <Badge variant="muted">Review</Badge>;
      default:
        return <Badge variant="muted">{type}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Flagged Reports & Disputes</h1>
          <p>Review complaints and resolve contract issues within the DIU community.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'pending', label: 'Pending Reports' },
          { id: 'resolved', label: 'Resolved' },
          { id: 'dismissed', label: 'Dismissed' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => {
              setActiveTab(tab.id as 'pending' | 'resolved' | 'dismissed');
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.skeletons}>
            <Skeleton height={120} />
            <Skeleton height={120} />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="All Clear!"
            description={`No reports found in the "${activeTab}" queue.`}
            icon={Flag}
          />
        ) : (
          <div className={styles.reportList}>
            {reports.map((report) => (
              <Card key={report._id} className={styles.reportCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.reportHeaderLeft}>
                    {getTargetTypeBadge(report.targetType)}
                    <span className={styles.targetIdText}>ID: {report.targetId}</span>
                  </div>
                  <span className={styles.dateText}>
                    <Calendar size={12} />
                    {new Date(report.createdAt).toLocaleDateString()}{' '}
                    {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={styles.grid}>
                  {/* Left Column: Complaint details */}
                  <div className={styles.complaintInfo}>
                    <div className={styles.reasonRow}>
                      <strong>Reason:</strong> <span>{report.reason}</span>
                    </div>
                    {report.description && (
                      <p className={styles.description}>
                        <strong>Details:</strong> {report.description}
                      </p>
                    )}

                    {/* Resolution detail render */}
                    {(report.status === 'resolved' || report.status === 'dismissed') && (
                      <div className={styles.resolutionBox}>
                        <Scale size={16} />
                        <div>
                          <strong>
                            {report.status.toUpperCase()} BY:{' '}
                            {report.reviewedBy?.displayName || 'Admin'} (
                            {report.reviewedBy?.role.replace('_', ' ').toUpperCase()})
                          </strong>
                          <p className={styles.resolutionNotes}>{report.resolution}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Reporter and Action buttons */}
                  <div className={styles.reporterPanel}>
                    <div className={styles.reporterTitle}>Flagged By:</div>
                    {report.reporter ? (
                      <div className={styles.reporterBox}>
                        <div className={styles.reporterDetails}>
                          <span className={styles.reporterName}>
                            {report.reporter.displayName}
                          </span>
                          <span className={styles.reporterRole}>
                            {report.reporter.role.toUpperCase()} • {report.reporter.email}
                          </span>
                          {report.reporter.studentId && (
                            <span className={styles.reporterId}>
                              ID: {report.reporter.studentId}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className={styles.anonymousReporter}>Anonymous User</span>
                    )}

                    {report.status === 'pending' && (
                      <div className={styles.actions}>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.resolveBtn}
                          onClick={() => openActionModal(report, 'resolve')}
                        >
                          <Check size={14} style={{ marginRight: '4px' }} />
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.dismissBtn}
                          onClick={() => openActionModal(report, 'dismiss')}
                        >
                          <X size={14} style={{ marginRight: '4px' }} />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

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
      </div>

      {/* Action / Resolution Notes input Modal */}
      {selectedReport && modalType && (
        <Modal
          title={modalType === 'resolve' ? 'Resolve Flagged Report' : 'Dismiss Flagged Report'}
          onClose={() => { setSelectedReport(null); setModalType(null); }}
        >
          <form onSubmit={handleActionSubmit} className={styles.modalContent}>
            <div className={styles.modalAlert}>
              <AlertOctagon size={22} />
              <div>
                <h4>
                  {modalType === 'resolve'
                    ? 'Take Action on Complaint'
                    : 'Dismiss Complaint Without Action'}
                </h4>
                <p>
                  Reason: &quot;{selectedReport.reason}&quot;. Flagged target type:{' '}
                  {selectedReport.targetType.toUpperCase()}.
                </p>
              </div>
            </div>

            <div className={styles.modalFormGroup}>
              <label htmlFor="resolution-notes">Resolution Notes</label>
              <textarea
                id="resolution-notes"
                className={styles.modalTextarea}
                placeholder={
                  modalType === 'resolve'
                    ? 'Describe what actions have been taken (e.g. suspended target user, removed violating review)...'
                    : 'Describe why this complaint is being dismissed...'
                }
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="outline"
                type="button"
                onClick={() => { setSelectedReport(null); setModalType(null); }}
              >
                Cancel
              </Button>
              <Button
                variant={modalType === 'resolve' ? 'primary' : 'danger'}
                type="submit"
                loading={processing}
                disabled={!resolutionText.trim()}
              >
                {modalType === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
