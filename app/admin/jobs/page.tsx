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
  Briefcase,
  User,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  FolderOpen,
  DollarSign
} from 'lucide-react';
import styles from './jobs.module.css';

interface JobRecord {
  _id: string;
  title: string;
  description: string;
  category: {
    _id: string;
    name: string;
    icon?: string;
  } | null;
  subcategory?: string;
  budget: {
    type: 'fixed' | 'range' | 'hourly';
    min?: number;
    max?: number;
  };
  deadline: string;
  client: {
    _id: string;
    displayName: string;
    photoURL: string | null;
    email: string;
    department: string;
    role: string;
  };
  status: string;
  urgency: 'low' | 'normal' | 'urgent';
  rejectionReason?: string;
  createdAt: string;
}

export default function AdminJobsPage() {
  const { addToast } = useToast();

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_review');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Rejection modal states
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient<{ jobs: JobRecord[]; pagination: { pages: number } }>(
        `/api/admin/jobs?status=${activeTab}&page=${page}&limit=10`
      );

      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setJobs(data.jobs);
        setTotalPages(data.pagination.pages);
      }
    } catch {
      addToast('Failed to fetch job list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeTab, page]);

  const handleApprove = async (jobId: string) => {
    setProcessing(true);
    try {
      const { error } = await apiClient('/api/admin/jobs', {
        method: 'PATCH',
        body: { jobId, action: 'approve' },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('Job approved successfully and is now live!', 'success');
        fetchJobs();
      }
    } catch {
      addToast('An error occurred during approval', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!rejectionReason.trim()) {
      addToast('Rejection reason is required', 'error');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await apiClient('/api/admin/jobs', {
        method: 'PATCH',
        body: { jobId: selectedJob._id, action: 'reject', rejectionReason },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('Job rejected and removed from queue', 'success');
        setSelectedJob(null);
        setRejectionReason('');
        fetchJobs();
      }
    } catch {
      addToast('An error occurred during rejection', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectionModal = (job: JobRecord) => {
    setSelectedJob(job);
    setRejectionReason('');
  };

  const getBudgetText = (budget: JobRecord['budget']) => {
    if (budget.type === 'fixed') {
      return `${budget.min || 0} BDT (Fixed)`;
    }
    if (budget.type === 'range') {
      return `${budget.min || 0} - ${budget.max || 0} BDT (Range)`;
    }
    return `${budget.min || 0} BDT/hr (Hourly)`;
  };

  const getUrgencyBadge = (urgency: JobRecord['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="error">Urgent</Badge>;
      case 'normal':
        return <Badge variant="primary">Normal</Badge>;
      default:
        return <Badge variant="muted">Low</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Job Board Moderation</h1>
          <p>Review and moderate job postings submitted by faculty, students, and departments.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'open', label: 'Live / Open' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
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
            <Skeleton height={150} />
            <Skeleton height={150} />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="Moderation Queue Empty"
            description={`There are no jobs currently under the "${activeTab.replace('_', ' ')}" status.`}
            icon={Briefcase}
          />
        ) : (
          <div className={styles.jobList}>
            {jobs.map((job) => (
              <Card key={job._id} className={styles.jobCard}>
                <div className={styles.jobGrid}>
                  {/* Job Main Information */}
                  <div className={styles.jobInfo}>
                    <div className={styles.jobTitleRow}>
                      <h3>{job.title}</h3>
                      {getUrgencyBadge(job.urgency)}
                    </div>
                    <p className={styles.categoryLine}>
                      <span>Category: {job.category?.name || 'Uncategorized'}</span>
                      {job.subcategory && (
                        <>
                          <span className={styles.dot}>•</span>
                          <span>{job.subcategory}</span>
                        </>
                      )}
                    </p>
                    <p className={styles.description}>{job.description}</p>

                    <div className={styles.jobMeta}>
                      <div className={styles.metaItem}>
                        <DollarSign size={14} />
                        <span>{getBudgetText(job.budget)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Calendar size={14} />
                        <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {job.rejectionReason && (
                      <div className={styles.rejectionBox}>
                        <AlertTriangle size={15} />
                        <div>
                          <strong>Rejection Reason:</strong> {job.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Client Info & Moderation Action Box */}
                  <div className={styles.moderationPanel}>
                    <div className={styles.clientBox}>
                      <div className={styles.clientAvatar}>
                        {job.client.photoURL ? (
                          <img src={job.client.photoURL} alt={job.client.displayName} />
                        ) : (
                          job.client.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className={styles.clientDetails}>
                        <span className={styles.clientName}>{job.client.displayName}</span>
                        <span className={styles.clientRole}>
                          {job.client.role.toUpperCase()} • {job.client.department}
                        </span>
                        <span className={styles.clientEmail}>{job.client.email}</span>
                      </div>
                    </div>

                    {activeTab === 'pending_review' && (
                      <div className={styles.actions}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(job._id)}
                          loading={processing}
                          fullWidth
                        >
                          <CheckCircle size={14} style={{ marginRight: '6px' }} />
                          Approve Listing
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.rejectBtn}
                          onClick={() => openRejectionModal(job)}
                          disabled={processing}
                          fullWidth
                        >
                          <XCircle size={14} style={{ marginRight: '6px' }} />
                          Reject Listing
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

      {/* Rejection Reason Modal */}
      {selectedJob && (
        <Modal
          title="Reject Job Listing"
          onClose={() => setSelectedJob(null)}
        >
          <form onSubmit={handleRejectSubmit} className={styles.modalContent}>
            <p className={styles.modalDescription}>
              Please describe why the job posting was rejected. This explanation will be sent 
              to the client freelancer so they can adjust their description and resubmit.
            </p>
            <div className={styles.modalFormGroup}>
              <label htmlFor="rejection-reason">Rejection Reason</label>
              <textarea
                id="rejection-reason"
                className={styles.modalTextarea}
                placeholder="e.g., Budget is below campus guidelines, details are too vague, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setSelectedJob(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="submit"
                loading={processing}
                disabled={!rejectionReason.trim()}
              >
                Reject Listing
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
