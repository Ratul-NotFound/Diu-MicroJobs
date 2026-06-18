'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Card, Table, StatusBadge, Skeleton, EmptyState, Button } from '@/components/ui';
import { FileText, Briefcase } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './ProposalsPage.module.css';

interface ProposalItem {
  _id: string;
  bidAmount: number;
  estimatedDuration: string;
  status: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job: any;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProposals() {
      try {
        const res = await apiClient<{ proposals: ProposalItem[] }>('/api/proposals');
        if (res.data) {
          setProposals(res.data.proposals);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProposals();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ marginBottom: '16px' }}>
          <Skeleton height="40px" width="30%" />
        </div>
        <Skeleton height="300px" width="100%" />
      </div>
    );
  }

  const columns = [
    {
      key: 'job',
      label: 'Job Title',
      render: (row: ProposalItem) => (
        <Link href={`/jobs/${row.job?._id}`} className={styles.jobLink}>
          {row.job?.title || 'Unknown Job'}
        </Link>
      ),
    },
    {
      key: 'bidAmount',
      label: 'Bid Amount',
      render: (row: ProposalItem) => <span>৳{row.bidAmount}</span>,
    },
    {
      key: 'estimatedDuration',
      label: 'Est. Duration',
      render: (row: ProposalItem) => <span>{row.estimatedDuration || 'N/A'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Applied On',
      render: (row: ProposalItem) => <span>{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: ProposalItem) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Proposals</h2>
        <p className={styles.subtitle}>Track your submitted applications, shortlists, and accepted bids</p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Proposals Yet"
          description="You haven't submitted any job proposals yet. Browse open jobs to find opportunities."
          action={{
            label: 'Find MicroJobs',
            onClick: () => {
              window.location.href = '/jobs';
            },
          }}
        />
      ) : (
        <Card className={styles.tableCard}>
          <Table columns={columns} data={proposals} emptyMessage="No proposals found." />
        </Card>
      )}
    </div>
  );
}
