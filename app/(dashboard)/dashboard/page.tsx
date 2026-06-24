'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Card, Button, Badge, StarRating, Skeleton } from '@/components/ui';
import { PlusCircle, Briefcase, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './DashboardPage.module.css';

interface DashboardStats {
  jobsPosted?: number;
  activeContracts: number;
  completedJobs: number;
  proposalsCount: number;
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentContracts, setRecentContracts] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Load all data in parallel
        const [jobsRes, contractsRes, proposalsRes] = await Promise.all([
          apiClient<{ jobs: [] }>('/api/jobs?limit=3'),
          apiClient<{ contracts: [] }>('/api/contracts'),
          apiClient<{ proposals: [] }>('/api/proposals'),
        ]);

        if (jobsRes.data) {
          setRecentJobs(jobsRes.data.jobs);
        }

        if (contractsRes.data) {
          const allContracts = contractsRes.data.contracts;
          setRecentContracts(allContracts.slice(0, 3));
          
          const proposalsCount = proposalsRes.data?.proposals.length || 0;
          const activeContracts = allContracts.filter((c: { status: string }) => c.status === 'active').length;
          const completedJobs = userProfile?.completedJobs || 0;

          setStats({
            activeContracts,
            completedJobs,
            proposalsCount,
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [userProfile]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Skeleton height="120px" width="100%" borderRadius="var(--radius-xl)" />
        <div className={styles.statsGrid} style={{ marginTop: 'var(--space-6)' }}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
      </div>
    );
  }

  const isClientOnly = userProfile?.role === 'faculty' || userProfile?.role === 'department';

  return (
    <div className={styles.container}>
      {/* Welcome Hero */}
      <div className={styles.welcomeHero}>
        <div className={styles.welcomeText}>
          <h2 className={styles.title}>Hello, {userProfile?.displayName} 👋</h2>
          <p className={styles.subtitle}>
            Welcome to your {userProfile?.university?.name || 'University'} MicroJobs workspace.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/jobs/create">
            <Button variant="primary" className={styles.actionBtn}>
              <PlusCircle size={16} />
              <span>Post a MicroJob</span>
            </Button>
          </Link>
          {!isClientOnly && (
            <Link href="/jobs">
              <Button variant="outline" className={styles.actionBtn}>
                <Briefcase size={16} />
                <span>Find Work</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Briefcase size={20} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Contracts</span>
            <span className={styles.statValue}>{stats?.activeContracts || 0}</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <FileText size={20} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Submissions / Bids</span>
            <span className={styles.statValue}>{stats?.proposalsCount || 0}</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <CheckCircle2 size={20} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Completed Jobs</span>
            <span className={styles.statValue}>{stats?.completedJobs || 0}</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Left Recent Activity, Right Profile Summary */}
      <div className={styles.mainGrid}>
        {/* Left Column: Recent Activity */}
        <div className={styles.activityColumn}>
          <div className={styles.sectionHeader}>
            <h3>Recent Contracts</h3>
            <Link href="/contracts" className={styles.seeAllLink}>
              <span>See All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.list}>
            {recentContracts.length === 0 ? (
              <div className={styles.emptyList}>
                <p>No contracts active at the moment.</p>
                <Link href="/jobs" className={styles.actionLink}>Browse open jobs</Link>
              </div>
            ) : (
              recentContracts.map((contract: { _id: string; job: { title: string }; agreedAmount: number; status: string }) => (
                <div key={contract._id} className={styles.listItem}>
                  <div>
                    <h4 className={styles.itemTitle}>{contract.job.title}</h4>
                    <span className={styles.itemMeta}>Budget: ৳{contract.agreedAmount}</span>
                  </div>
                  <Badge variant={contract.status === 'active' ? 'success' : 'muted'}>
                    {contract.status}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-8)' }}>
            <h3>Explore Open MicroJobs</h3>
            <Link href="/jobs" className={styles.seeAllLink}>
              <span>All Jobs</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.list}>
            {recentJobs.length === 0 ? (
              <div className={styles.emptyList}>
                <p>No jobs found.</p>
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recentJobs.map((job: any) => (
                <div key={job._id} className={styles.listItem}>
                  <div>
                    <h4 className={styles.itemTitle}>{job.title}</h4>
                    <span className={styles.itemMeta}>
                      Budget: ৳{job.budget.min} • Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="primary">{job.category?.name || 'Job'}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: User Info Card */}
        <div className={styles.profileColumn}>
          <Card className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h3 className={styles.profileCardTitle}>Your Profile Summary</h3>
            </div>
            <div className={styles.profileBody}>
              <div className={styles.profileRating}>
                <span className={styles.ratingNumber}>{userProfile?.rating || '0.0'}</span>
                <StarRating rating={userProfile?.rating || 0} size="md" />
                <span className={styles.reviewsCount}>({userProfile?.totalReviews || 0} reviews)</span>
              </div>

              <div className={styles.profileDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Role</span>
                  <Badge variant="primary">{userProfile?.role}</Badge>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Department</span>
                  <span className={styles.detailValue}>{userProfile?.department}</span>
                </div>
                {userProfile?.studentId && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Student ID</span>
                    <span className={styles.detailValue}>{userProfile.studentId}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Verification</span>
                  <Badge variant={userProfile?.isVerified ? 'success' : 'muted'}>
                    {userProfile?.isVerified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </div>
              </div>

              {userProfile?.bio ? (
                <div className={styles.profileBio}>
                  <h4 className={styles.bioTitle}>Bio</h4>
                  <p className={styles.bioText}>{userProfile.bio}</p>
                </div>
              ) : (
                <div className={styles.noBio}>
                  <p>You haven&apos;t set a bio yet.</p>
                  <Link href="/profile" className={styles.editProfileLink}>Edit Profile</Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
