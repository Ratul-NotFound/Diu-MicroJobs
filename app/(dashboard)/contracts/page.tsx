'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Card, Table, StatusBadge, Skeleton, EmptyState, Button, Input, Textarea } from '@/components/ui';
import { ClipboardCheck, FileText, ArrowLeft, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './ContractsPage.module.css';

interface ContractItem {
  _id: string;
  agreedAmount: number;
  deadline: string;
  status: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  freelancer: any;
}

function ContractsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const isCreateMode = searchParams.get('create') === 'true';
  const jobId = searchParams.get('jobId');
  const proposalId = searchParams.get('proposalId');

  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Contract creation form state
  const [terms, setTerms] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deliverablesStr, setDeliverablesStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isCreateMode) {
      setLoading(false);
      return;
    }

    async function loadContracts() {
      try {
        const res = await apiClient<{ contracts: ContractItem[] }>('/api/contracts');
        if (res.data) {
          setContracts(res.data.contracts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadContracts();
  }, [isCreateMode]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms || !agreedAmount || !deadline) {
      addToast('Please fill in all fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const deliverables = deliverablesStr
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      const res = await apiClient<{ contract: { _id: string } }>('/api/contracts', {
        method: 'POST',
        body: {
          jobId,
          proposalId,
          terms,
          agreedAmount: parseInt(agreedAmount),
          deadline: new Date(deadline).toISOString(),
          deliverables,
          milestones: [
            {
              title: 'Final Delivery',
              amount: parseInt(agreedAmount),
              deadline: new Date(deadline).toISOString(),
              status: 'pending',
            },
          ],
        },
      });

      if (res.error) {
        addToast(res.error, 'error');
      } else if (res.data) {
        addToast('Contract created successfully! Both parties must sign it.', 'success');
        router.push(`/contracts/${res.data.contract._id}`);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to create contract', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (isCreateMode) {
    return (
      <div className={styles.container}>
        <Link href={`/jobs/${jobId}`} className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to job detail</span>
        </Link>

        <div className={styles.header}>
          <h2 className={styles.title}>Draft Freelance Contract</h2>
          <p className={styles.subtitle}>Define terms, deliverables, and payment release milestones</p>
        </div>

        <Card className={styles.formCard}>
          <form onSubmit={handleCreateContract} className={styles.form}>
            <div className={styles.row}>
              <Input
                type="number"
                label="Agreed Contract Amount (৳)"
                placeholder="e.g. 1500"
                value={agreedAmount}
                onChange={(e) => setAgreedAmount(e.target.value)}
                required
                disabled={submitting}
              />
              <Input
                type="date"
                label="Contract Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <Textarea
              label="Detailed Scope of Work & Terms"
              placeholder="Detail out the exact tasks, code standards, revision policies, and terms..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              required
              rows={5}
              disabled={submitting}
            />

            <Input
              type="text"
              label="Deliverables (comma-separated)"
              placeholder="e.g. source code, high-res photos, figma link"
              value={deliverablesStr}
              onChange={(e) => setDeliverablesStr(e.target.value)}
              disabled={submitting}
            />

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/jobs/${jobId}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save and Create Contract
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  const columns = [
    {
      key: 'job',
      label: 'Job Title',
      render: (row: ContractItem) => (
        <Link href={`/contracts/${row._id}`} className={styles.jobLink}>
          {row.job?.title || 'Job Detail'}
        </Link>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (row: ContractItem) => <span>{row.client?.displayName}</span>,
    },
    {
      key: 'freelancer',
      label: 'Freelancer',
      render: (row: ContractItem) => <span>{row.freelancer?.displayName}</span>,
    },
    {
      key: 'agreedAmount',
      label: 'Agreed Price',
      render: (row: ContractItem) => <span>৳{row.agreedAmount}</span>,
    },
    {
      key: 'deadline',
      label: 'Due Date',
      render: (row: ContractItem) => <span>{formatDate(row.deadline)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: ContractItem) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Contracts</h2>
        <p className={styles.subtitle}>Manage work contracts, submit milestones, and release payments</p>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Contracts Found"
          description="Contracts are created once you accept a proposal for your job or a client accepts your bid."
        />
      ) : (
        <Card className={styles.tableCard}>
          <Table columns={columns} data={contracts} emptyMessage="No contracts found." />
        </Card>
      )}
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<div>Loading contracts page...</div>}>
      <ContractsContent />
    </Suspense>
  );
}
