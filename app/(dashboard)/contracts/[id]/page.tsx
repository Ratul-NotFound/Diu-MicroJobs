'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Badge, StatusBadge, Skeleton } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Check, Clipboard, MessageSquare, AlertCircle } from 'lucide-react';
import styles from './ContractDetailPage.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ContractDetail {
  _id: string;
  terms: string;
  agreedAmount: number;
  deadline: string;
  deliverables: string[];
  clientSigned: boolean;
  freelancerSigned: boolean;
  status: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  freelancer: any;
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: contractId } = use(params);
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        setLoading(true);
        const res = await apiClient<{ contract: ContractDetail }>(`/api/contracts/${contractId}`);
        if (res.error || !res.data) {
          addToast('Contract not found', 'error');
          router.push('/contracts');
          return;
        }
        setContract(res.data.contract);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (userProfile) {
      loadContract();
    }
  }, [contractId, userProfile, addToast, router]);

  const handleAction = async (action: 'sign' | 'deliver' | 'approve' | 'requestRevision') => {
    setActionLoading(true);
    try {
      const res = await apiClient<{ contract: ContractDetail }>(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        body: { action },
      });

      if (res.error) {
        addToast(res.error, 'error');
      } else {
        addToast('Action completed successfully!', 'success');
        // Reload details
        const updatedRes = await apiClient<{ contract: ContractDetail }>(`/api/contracts/${contractId}`);
        if (updatedRes.data) {
          setContract(updatedRes.data.contract);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessagePartner = async () => {
    if (!contract || !userProfile) return;
    const partnerId =
      userProfile._id.toString() === contract.client._id.toString()
        ? contract.freelancer._id
        : contract.client._id;

    try {
      const res = await apiClient<{ conversation: { _id: string } }>('/api/messages/conversations', {
        method: 'POST',
        body: { participantId: partnerId, jobId: contract.job._id },
      });

      if (res.data) {
        router.push('/messages');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to start chat', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Skeleton height="40px" width="30%" />
        <Skeleton height="260px" width="100%" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  if (!contract) return null;

  const isClient = contract.client._id.toString() === userProfile?._id.toString();
  const isFreelancer = contract.freelancer._id.toString() === userProfile?._id.toString();

  const isPendingSignature = contract.status === 'pending_signatures';
  const isActive = contract.status === 'active';
  
  // Signature checks
  const mySignaturePending = isPendingSignature && (
    (isClient && !contract.clientSigned) ||
    (isFreelancer && !contract.freelancerSigned)
  );

  return (
    <div className={styles.container}>
      <Link href="/contracts" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to contracts</span>
      </Link>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Contract Detail</h2>
          <p className={styles.subtitle}>Reference ID: {contract._id}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={handleMessagePartner}>
            <MessageSquare size={16} style={{ marginRight: '8px' }} />
            Message {isClient ? 'Freelancer' : 'Client'}
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left Column: Scope & Terms */}
        <div className={styles.mainColumn}>
          <Card className={styles.termsCard}>
            <h3 className={styles.sectionTitle}>Scope of Work & Terms</h3>
            <p className={styles.termsText}>{contract.terms}</p>

            {contract.deliverables.length > 0 && (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <h4 className={styles.subSectionTitle}>Deliverables</h4>
                <ul className={styles.deliverablesList}>
                  {contract.deliverables.map((item, idx) => (
                    <li key={idx} className={styles.deliverableItem}>
                      <Check size={14} className={styles.checkIcon} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Sidebar Actions & Info */}
        <div className={styles.sidebarColumn}>
          {/* Status & Actions Card */}
          <Card className={styles.statusCard}>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Contract Status</span>
              <StatusBadge status={contract.status} />
            </div>

            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Agreed Amount</span>
              <span className={styles.priceValue}>৳{contract.agreedAmount}</span>
            </div>

            <div className={styles.deadlineRow}>
              <span className={styles.deadlineLabel}>Deadline</span>
              <span className={styles.deadlineValue}>{formatDate(contract.deadline)}</span>
            </div>

            {/* Action Triggers */}
            {mySignaturePending && (
              <Button
                variant="primary"
                fullWidth
                loading={actionLoading}
                onClick={() => handleAction('sign')}
                className={styles.actionBtn}
              >
                Sign Contract
              </Button>
            )}

            {isActive && isFreelancer && (
              <Button
                variant="primary"
                fullWidth
                loading={actionLoading}
                onClick={() => handleAction('deliver')}
                className={styles.actionBtn}
              >
                Deliver Work / Complete task
              </Button>
            )}

            {isActive && isClient && (
              <div className={styles.clientActionsGroup}>
                <Button
                  variant="secondary"
                  fullWidth
                  loading={actionLoading}
                  onClick={() => handleAction('approve')}
                  className={styles.actionBtn}
                >
                  Approve & Release Payment
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  loading={actionLoading}
                  onClick={() => handleAction('requestRevision')}
                  className={styles.actionBtn}
                >
                  Request Revision
                </Button>
              </div>
            )}
          </Card>

          {/* Signatures Card */}
          <Card className={styles.signaturesCard}>
            <h4 className={styles.sidebarSectionHeader}>Signatures</h4>
            <div className={styles.signatureRow}>
              <span>Client ({contract.client.displayName})</span>
              <Badge variant={contract.clientSigned ? 'success' : 'muted'}>
                {contract.clientSigned ? 'Signed' : 'Pending'}
              </Badge>
            </div>
            <div className={styles.signatureRow} style={{ marginTop: 'var(--space-3)' }}>
              <span>Freelancer ({contract.freelancer.displayName})</span>
              <Badge variant={contract.freelancerSigned ? 'success' : 'muted'}>
                {contract.freelancerSigned ? 'Signed' : 'Pending'}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
