'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Input, Textarea, Badge, StarRating, Skeleton, Table, StatusBadge } from '@/components/ui';
import { formatCurrency, formatBudget, formatDate } from '@/lib/utils';
import { Calendar, User, FileText, ArrowLeft, Send, Sparkles } from 'lucide-react';
import styles from './JobDetailPage.module.css';

interface ProposalItem {
  _id: string;
  coverLetter: string;
  bidAmount: number;
  estimatedDuration: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  clientResponse?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  freelancer: any;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface JobDetail {
  _id: string;
  title: string;
  description: string;
  budget: {
    type: 'fixed' | 'range' | 'hourly';
    min: number;
    max?: number;
    currency: string;
  };
  deadline: string;
  urgency: 'low' | 'normal' | 'urgent';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any;
  subcategory?: string;
  status: string;
  skills: string[];
  thumbnail?: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: jobId } = use(params);
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [myProposal, setMyProposal] = useState<ProposalItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal form fields
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load job
        const jobRes = await apiClient<{ job: JobDetail }>(`/api/jobs/${jobId}`);
        if (jobRes.error || !jobRes.data) {
          addToast('Job not found', 'error');
          router.push('/jobs');
          return;
        }
        setJob(jobRes.data.job);

        // Load proposals
        const propRes = await apiClient<{ proposals: ProposalItem[] }>(`/api/jobs/${jobId}/proposals`);
        if (propRes.data) {
          const props = propRes.data.proposals;
          setProposals(props);

          // Find current user's proposal
          const mine = props.find((p) => p.freelancer._id.toString() === userProfile?._id.toString());
          if (mine) {
            setMyProposal(mine);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (userProfile) {
      loadData();
    }
  }, [jobId, userProfile, addToast, router]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverLetter || !bidAmount) {
      addToast('Please fill in cover letter and bid amount', 'warning');
      return;
    }

    setSubmittingProposal(true);
    try {
      const res = await apiClient<{ proposal: ProposalItem }>(`/api/jobs/${jobId}/proposals`, {
        method: 'POST',
        body: {
          coverLetter,
          bidAmount: parseInt(bidAmount),
          estimatedDuration,
        },
      });

      if (res.error) {
        addToast(res.error, 'error');
      } else if (res.data) {
        addToast('Proposal submitted successfully!', 'success');
        setMyProposal(res.data.proposal);
        setProposals((prev) => [res.data!.proposal, ...prev]);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to submit proposal', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleProposalAction = async (proposalId: string, action: 'accepted' | 'rejected') => {
    try {
      const res = await apiClient<{ proposal: ProposalItem }>(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        body: { status: action },
      });

      if (res.error) {
        addToast(res.error, 'error');
      } else {
        addToast(`Proposal ${action === 'accepted' ? 'accepted' : 'rejected'} successfully`, 'success');
        // Reload page data
        router.refresh();
        // Refresh local state
        setProposals((prev) =>
          prev.map((p) => (p._id === proposalId ? { ...p, status: action } : p))
        );
        if (action === 'accepted' && job) {
          // If accepted, redirect to contract creation
          router.push(`/contracts?create=true&jobId=${job._id}&proposalId=${proposalId}`);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Action failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Skeleton height="40px" width="30%" />
        <Skeleton height="300px" width="100%" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  if (!job) return null;

  const isOwner = job.client._id.toString() === userProfile?._id.toString();
  const isFreelancerEligible = userProfile?.role === 'student' || userProfile?.role === 'alumni';

  return (
    <div className={styles.container}>
      <Link href="/jobs" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to browse jobs</span>
      </Link>

      <div className={styles.layout}>
        {/* Left Column: Job Details */}
        <div className={styles.detailsColumn}>
          <Card className={styles.jobCard}>
            {job.thumbnail && (
              <div className={styles.jobDetailThumbnailWrapper}>
                <img src={job.thumbnail} alt={job.title} className={styles.jobDetailThumbnail} />
              </div>
            )}
            <div className={styles.jobHeader}>
              <div className={styles.headerTitleRow}>
                <h2 className={styles.jobTitle}>{job.title}</h2>
                <Badge variant={job.urgency === 'urgent' ? 'error' : job.urgency === 'normal' ? 'primary' : 'muted'}>
                  {job.urgency}
                </Badge>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.categoryBadge}>
                  {job.category?.name}
                  {job.subcategory && ` • ${job.subcategory}`}
                </span>
                <span className={styles.metaText}>Posted on {formatDate(job.deadline)}</span>
                <span className={styles.jobStatus}>
                  <StatusBadge status={job.status} />
                </span>
              </div>
            </div>

            <div className={styles.jobSection}>
              <h4 className={styles.sectionTitle}>Job Description</h4>
              <p className={styles.descriptionText}>{job.description}</p>
            </div>

            {job.skills.length > 0 && (
              <div className={styles.jobSection}>
                <h4 className={styles.sectionTitle}>Required Skills</h4>
                <div className={styles.skillsList}>
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="muted" className={styles.skillBadge}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Proposals section */}
          {isOwner ? (
            <Card className={styles.proposalsCard}>
              <h3 className={styles.cardSectionTitle}>Submitted Proposals ({proposals.length})</h3>
              
              {proposals.length === 0 ? (
                <p className={styles.emptyText}>No proposals submitted yet.</p>
              ) : (
                <div className={styles.proposalsList}>
                  {proposals.map((prop) => (
                    <div key={prop._id} className={styles.proposalItem}>
                      <div className={styles.proposalHeader}>
                        <div className={styles.freelancerMeta}>
                          <span className={styles.freelancerName}>{prop.freelancer.displayName}</span>
                          <span className={styles.freelancerDept}>{prop.freelancer.department}</span>
                          <span className={styles.freelancerRating}>⭐ {prop.freelancer.rating}</span>
                        </div>
                        <div className={styles.bidMeta}>
                          <span className={styles.bidAmount}>Bid: ৳{prop.bidAmount}</span>
                          <span className={styles.duration}>Est. {prop.estimatedDuration || 'N/A'}</span>
                        </div>
                      </div>
                      <p className={styles.proposalText}>{prop.coverLetter}</p>
                      
                      {prop.status === 'pending' ? (
                        <div className={styles.proposalActions}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProposalAction(prop._id, 'accepted')}
                          >
                            Accept & Setup Contract
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleProposalAction(prop._id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className={styles.proposalStatusLabel}>
                          Status: <StatusBadge status={prop.status} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            myProposal && (
              <Card className={styles.myProposalCard}>
                <h3 className={styles.cardSectionTitle}>Your Submitted Proposal</h3>
                <div className={styles.proposalStatusBadge}>
                  <StatusBadge status={myProposal.status} />
                </div>
                <div className={styles.myProposalDetails}>
                  <p><strong>Your Bid:</strong> ৳{myProposal.bidAmount}</p>
                  <p><strong>Estimated Duration:</strong> {myProposal.estimatedDuration || 'Not specified'}</p>
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <strong>Cover Letter:</strong>
                    <p className={styles.proposalText} style={{ marginTop: 'var(--space-2)' }}>{myProposal.coverLetter}</p>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>

        {/* Right Column: Client details & Application panel */}
        <div className={styles.sidebarColumn}>
          {/* Budget and Deadline panel */}
          <Card className={styles.budgetCard}>
            <div className={styles.budgetValue}>{formatBudget(job.budget)}</div>
            <div className={styles.budgetLabel}>{job.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}</div>
            
            <div className={styles.sidebarMetaItem} style={{ marginTop: 'var(--space-4)' }}>
              <Calendar size={16} />
              <div>
                <span className={styles.sidebarMetaLabel}>Deadline</span>
                <span className={styles.sidebarMetaValue}>{formatDate(job.deadline)}</span>
              </div>
            </div>
          </Card>

          {/* Client profile panel */}
          <Card className={styles.clientCard}>
            <h4 className={styles.sidebarSectionHeader}>Job Creator</h4>
            <div className={styles.clientHeader}>
              <div className={styles.clientInitials}>
                {job.client.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className={styles.clientDisplayName}>{job.client.displayName}</div>
                <div className={styles.clientRole}>{job.client.role.toUpperCase()}</div>
              </div>
            </div>
            <div className={styles.clientDetails}>
              <p><strong>Department:</strong> {job.client.department}</p>
              <p><strong>Rating:</strong> ⭐ {job.client.rating || 'No ratings'}</p>
              <p><strong>Completed Jobs:</strong> {job.client.completedJobs || 0}</p>
            </div>
          </Card>

          {/* Apply Panel (If not client, hasn't applied, job is open, and eligible) */}
          {!isOwner && !myProposal && job.status === 'open' && isFreelancerEligible && (
            <Card className={styles.applyCard}>
              <h3 className={styles.sidebarSectionHeader}>Apply for this MicroJob</h3>
              <form onSubmit={handleApply} className={styles.applyForm}>
                <Input
                  type="number"
                  label="Your Bid Amount (৳)"
                  placeholder="e.g. 500"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  label="Estimated Duration"
                  placeholder="e.g. 2 days, 1 week"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  required
                />
                <Textarea
                  label="Cover Letter"
                  placeholder="Introduce yourself and explain why you are the best fit for this micro-task..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={submittingProposal}
                >
                  <Send size={16} style={{ marginRight: '8px' }} />
                  Submit Proposal
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
