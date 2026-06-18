'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  Briefcase,
  FolderTree,
  Flag,
  Shield,
  ArrowUpRight,
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  CheckCircle,
  FileCheck,
  RotateCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import styles from './admin-dashboard.module.css';

interface AnalyticsData {
  metrics: {
    totalUsers: number;
    totalJobs: number;
    totalCompletedJobs: number;
    totalActiveJobs: number;
    newUsersThisMonth: number;
    jobsThisMonth: number;
  };
  usersByRole: {
    student?: number;
    faculty?: number;
    alumni?: number;
    department?: number;
  };
  categoryDistribution: Array<{
    categoryId: string;
    name: string;
    count: number;
  }>;
}

const COLORS = ['#034ea2', '#00a651', '#f59e0b', '#ec4899'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function loadStats() {
      try {
        const { data: statsData, error } = await apiClient<AnalyticsData>('/api/admin/analytics');
        if (error) {
          addToast(error, 'error');
        } else if (statsData) {
          setData(statsData);
        }
      } catch {
        addToast('Failed to fetch admin stats', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [addToast]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.header}>
          <Skeleton width={200} height={32} />
          <Skeleton width={400} height={16} />
        </div>
        <div className={styles.metricsGrid}>
          <Skeleton height={120} />
          <Skeleton height={120} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
        <div className={styles.chartsGrid}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load analytics dashboard.</p>
      </div>
    );
  }

  // Format Recharts data
  const rolesChartData = [
    { name: 'Students', value: data.usersByRole.student || 0 },
    { name: 'Faculty', value: data.usersByRole.faculty || 0 },
    { name: 'Alumni', value: data.usersByRole.alumni || 0 },
    { name: 'Departments', value: data.usersByRole.department || 0 },
  ].filter((item) => item.value > 0);

  const categoryChartData = data.categoryDistribution.map((item) => ({
    name: item.name,
    Jobs: item.count,
  }));

  return (
    <div className={styles.dashboardContainer}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>DIU MicroJobs Command Centre</h1>
          <p>Real-time analytics, user validation control, and platform monitoring statistics.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RotateCw size={14} style={{ marginRight: '6px' }} />
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsGrid}>
        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={`${styles.iconBox} ${styles.usersIcon}`}>
              <Users size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Registrants</span>
              <h3 className={styles.metricValue}>{data.metrics.totalUsers}</h3>
              <span className={styles.metricDelta}>
                +{data.metrics.newUsersThisMonth} this month
              </span>
            </div>
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={`${styles.iconBox} ${styles.jobsIcon}`}>
              <Briefcase size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Jobs Posted</span>
              <h3 className={styles.metricValue}>{data.metrics.totalJobs}</h3>
              <span className={styles.metricDelta}>
                +{data.metrics.jobsThisMonth} this month
              </span>
            </div>
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={`${styles.iconBox} ${styles.activeIcon}`}>
              <Zap size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Active Gigs</span>
              <h3 className={styles.metricValue}>{data.metrics.totalActiveJobs}</h3>
              <span className={styles.metricDelta}>In-progress on campus</span>
            </div>
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={`${styles.iconBox} ${styles.completedIcon}`}>
              <Award size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Completed Tasks</span>
              <h3 className={styles.metricValue}>{data.metrics.totalCompletedJobs}</h3>
              <span className={styles.metricDelta}>
                {((data.metrics.totalCompletedJobs / (data.metrics.totalJobs || 1)) * 100).toFixed(0)}% finish rate
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className={styles.chartsGrid}>
        {/* User Roles Pie Chart */}
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Community Role Distribution</h3>
            <span className={styles.chartHeaderSub}>Students, Faculty, and Alumni counts</span>
          </div>
          <div className={styles.chartWrapper}>
            {isMounted && rolesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={rolesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rolesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noChartData}>No distribution data available</div>
            )}
          </div>
        </Card>

        {/* Jobs by Category Bar Chart */}
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Jobs by Category</h3>
            <span className={styles.chartHeaderSub}>Quantity of gigs posted across academic streams</span>
          </div>
          <div className={styles.chartWrapper}>
            {isMounted && categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryChartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
                    axisLine={{ stroke: 'var(--color-border-light)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
                    axisLine={{ stroke: 'var(--color-border-light)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    cursor={{ fill: 'var(--color-border-light)' }}
                  />
                  <Bar dataKey="Jobs" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noChartData}>No category distribution data available</div>
            )}
          </div>
        </Card>
      </div>

      {/* Moderation quick actions shortcuts */}
      <div className={styles.actionsPanel}>
        <h2>Moderator Tasks & Operations</h2>
        <div className={styles.actionsGrid}>
          <div className={styles.actionBlock} onClick={() => router.push('/admin/jobs')}>
            <div className={styles.blockIcon}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.blockInfo}>
              <h4>Moderate Job Queue</h4>
              <p>Approve pending job requests and screen tasks for guidelines compliance.</p>
            </div>
            <ArrowUpRight size={18} className={styles.blockArrow} />
          </div>

          <div className={styles.actionBlock} onClick={() => router.push('/admin/users')}>
            <div className={styles.blockIcon}>
              <Users size={22} />
            </div>
            <div className={styles.blockInfo}>
              <h4>User Validation panel</h4>
              <p>Verify newly registered students, de-escalate bans, or freeze accounts.</p>
            </div>
            <ArrowUpRight size={18} className={styles.blockArrow} />
          </div>

          <div className={styles.actionBlock} onClick={() => router.push('/admin/reports')}>
            <div className={styles.blockIcon}>
              <Flag size={22} />
            </div>
            <div className={styles.blockInfo}>
              <h4>Review Flagged Reports</h4>
              <p>Inspect chat transcripts and resolve project contract disputes.</p>
            </div>
            <ArrowUpRight size={18} className={styles.blockArrow} />
          </div>

          <div className={styles.actionBlock} onClick={() => router.push('/admin/categories')}>
            <div className={styles.blockIcon}>
              <FolderTree size={22} />
            </div>
            <div className={styles.blockInfo}>
              <h4>Category CRUD Settings</h4>
              <p>Adjust subcategories, add new fields, or modify order indexes.</p>
            </div>
            <ArrowUpRight size={18} className={styles.blockArrow} />
          </div>
        </div>
      </div>
    </div>
  );
}
