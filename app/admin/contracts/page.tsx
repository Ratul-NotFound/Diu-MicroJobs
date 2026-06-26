'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import tableStyles from '@/components/ui/Table.module.css';
import { 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Info, 
  Scale, 
  RotateCw 
} from 'lucide-react';
import styles from './contracts.module.css';

interface Participant {
  _id: string;
  displayName: string;
  email: string;
}

interface ContractRecord {
  _id: string;
  job: {
    _id: string;
    title: string;
    status: string;
    university?: {
      name: string;
      shortName: string;
    };
  };
  client: Participant;
  freelancer: Participant;
  agreedAmount: number;
  deadline: string;
  status: 'pending_signatures' | 'active' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
  updatedAt: string;
}

export default function AdminContractsPage() {
  const { addToast } = useToast();
  const { adminProfile } = useAuth();
  
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [modalType, setModalType] = useState<'release' | 'refund' | null>(null);
  const [processing, setProcessing] = useState(false);

  const isModeratorOrAbove = adminProfile?.role === 'super_admin' || adminProfile?.role === 'moderator';

  const loadContracts = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/contracts?status=${statusFilter}`;
      const { data, error } = await apiClient<{ contracts: ContractRecord[] }>(url);
      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setContracts(data.contracts);
      }
    } catch {
      addToast('Failed to retrieve contract records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const handleOverride = async () => {
    if (!selectedContract || !modalType) return;
    
    setProcessing(true);
    try {
      const action = modalType === 'release' ? 'release' : 'refund';
      const { error } = await apiClient('/api/admin/contracts', {
        method: 'PATCH',
        body: { contractId: selectedContract._id, action },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast(`Contract successfully resolved: escrow ${action === 'release' ? 'released' : 'refunded'}`, 'success');
        setModalType(null);
        setSelectedContract(null);
        loadContracts();
      }
    } catch {
      addToast('An error occurred during escrow override execution', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: ContractRecord['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active (In Escrow)</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'disputed':
        return <Badge variant="error">Disputed</Badge>;
      case 'cancelled':
        return <Badge variant="muted">Cancelled / Refunded</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  // Compute metrics from current visible/cached state
  const totalEscrowed = contracts
    .filter(c => c.status === 'active' || c.status === 'disputed')
    .reduce((sum, c) => sum + c.agreedAmount, 0);

  const totalSettled = contracts
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + c.agreedAmount, 0);

  const disputedCount = contracts.filter(c => c.status === 'disputed').length;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Escrow Audits & Disputes</h1>
          <p>Audit project milestones, monitor active escrow funds, and resolve contract disputes with override actions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadContracts} disabled={loading}>
          <RotateCw size={14} style={{ marginRight: '6px' }} />
          Refresh Stats
        </Button>
      </div>

      {/* Metrics Section */}
      <div className={styles.metricsGrid}>
        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={styles.iconBox} style={{ backgroundColor: '#ecfeff', color: '#0891b2' }}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total In Escrow</span>
              <h3 className={styles.metricValue}>৳{totalEscrowed.toLocaleString()}</h3>
              <span className={styles.metricDelta}>Active & Disputed funds held</span>
            </div>
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={styles.iconBox} style={{ backgroundColor: '#f0fdf4', color: 'var(--color-secondary)' }}>
              <Award size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Platform Settled</span>
              <h3 className={styles.metricValue}>৳{totalSettled.toLocaleString()}</h3>
              <span className={styles.metricDelta}>Completed contract payouts</span>
            </div>
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricLayout}>
            <div className={styles.iconBox} style={{ backgroundColor: '#fef2f2', color: 'var(--color-error)' }}>
              <ShieldAlert size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Active Disputes</span>
              <h3 className={styles.metricValue}>{disputedCount}</h3>
              <span className={styles.metricDelta}>Contracts requiring arbitration</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Options */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersLayout}>
          <div className={styles.selectGroup}>
            <label htmlFor="statusFilter">Filter By Status</label>
            <Select
              id="statusFilter"
              options={[
                { value: 'all', label: 'All Contracts' },
                { value: 'active', label: 'Active (In Escrow)' },
                { value: 'disputed', label: 'Disputed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled / Refunded' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Contracts Audit Table */}
      <Card className={styles.tableCard}>
        <div className={tableStyles.container}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Job / University</th>
                <th>Client</th>
                <th>Freelancer</th>
                <th>Budget</th>
                <th>Deadline</th>
                <th>Status</th>
                {isModeratorOrAbove && <th style={{ textAlign: 'right' }}>Dispute Resolution</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.tableLoading}>
                    <span className={styles.spinner} /> Syncing contract audits...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.tableEmpty}>
                    No contract records found.
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract._id}>
                    <td>
                      <div className={styles.contractInfo}>
                        <span className={styles.jobTitle}>
                          {contract.job?.title || 'Unknown Gig'}
                        </span>
                        <span className={styles.uniTag}>
                          🏫 {contract.job?.university?.name || 'Registered Campus'} ({contract.job?.university?.shortName || 'Uni'})
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.partyDetails}>
                        <span className={styles.partyLabel}>Client</span>
                        <span className={styles.partyName}>{contract.client?.displayName}</span>
                        <span className={styles.partyEmail}>{contract.client?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.partyDetails}>
                        <span className={styles.partyLabel}>Freelancer</span>
                        <span className={styles.partyName}>{contract.freelancer?.displayName}</span>
                        <span className={styles.partyEmail}>{contract.freelancer?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                        ৳{contract.agreedAmount.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {new Date(contract.deadline).toLocaleDateString()}
                      </span>
                    </td>
                    <td>{getStatusBadge(contract.status)}</td>
                    {isModeratorOrAbove && (
                      <td style={{ textAlign: 'right' }}>
                        {(contract.status === 'active' || contract.status === 'disputed') && (
                          <div className={styles.actionsCell}>
                            <Button
                              variant="outline"
                              size="sm"
                              className={styles.releaseBtn}
                              onClick={() => { setSelectedContract(contract); setModalType('release'); }}
                              title="Release funds to freelancer"
                            >
                              <CheckCircle size={12} style={{ marginRight: '4px' }} />
                              Release
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={styles.refundBtn}
                              onClick={() => { setSelectedContract(contract); setModalType('refund'); }}
                              title="Refund funds to client"
                            >
                              <XCircle size={12} style={{ marginRight: '4px' }} />
                              Refund
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

      {/* Override Resolution Modal */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => { setModalType(null); setSelectedContract(null); }}
        title={modalType === 'release' ? 'Arbitration: Release Escrow' : 'Arbitration: Refund Escrow'}
      >
        <div className={styles.modalContent}>
          <div className={styles.warningBox}>
            <ShieldAlert size={24} style={{ flexShrink: 0 }} />
            <div>
              <h4>⚠️ Administrative Override Notice</h4>
              <p>
                You are executing an absolute escrow override. This action will bypass regular freelancer/client validation steps and finalizes the transaction.
              </p>
            </div>
          </div>

          {selectedContract && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div><strong>Project:</strong> {selectedContract.job?.title}</div>
              <div><strong>Budget:</strong> BDT {selectedContract.agreedAmount}</div>
              <div><strong>Client:</strong> {selectedContract.client?.displayName}</div>
              <div><strong>Freelancer:</strong> {selectedContract.freelancer?.displayName}</div>
              
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {modalType === 'release' ? (
                  <span>
                    👉 <strong>freelancer payout</strong>: Escrowed funds will be immediately released to the freelancer. The project will be marked completed.
                  </span>
                ) : (
                  <span>
                    👉 <strong>client refund</strong>: Escrowed funds will be cancelled and returned to the client's wallet. The project will be marked cancelled.
                  </span>
                )}
              </div>
            </div>
          )}

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => { setModalType(null); setSelectedContract(null); }}
              disabled={processing}
            >
              Back
            </Button>
            <Button
              variant="primary"
              loading={processing}
              onClick={handleOverride}
              style={modalType === 'refund' ? { backgroundColor: 'var(--color-warning)' } : {}}
            >
              <Scale size={14} style={{ marginRight: '6px' }} />
              Confirm Override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
