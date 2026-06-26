'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { 
  School, 
  Plus, 
  Edit2, 
  Power, 
  Users, 
  Briefcase, 
  Globe, 
  BookOpen, 
  DollarSign, 
  RotateCw 
} from 'lucide-react';
import styles from './universities.module.css';

interface UniversityRecord {
  _id: string;
  name: string;
  shortName: string;
  slug: string;
  domains: string[];
  logo: string;
  departments: string[];
  currency: string;
  isActive: boolean;
  userCount?: number;
  jobCount?: number;
}

export default function UniversitiesManagementPage() {
  const { addToast } = useToast();
  const { adminProfile } = useAuth();
  
  const [universities, setUniversities] = useState<UniversityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<UniversityRecord | null>(null);
  
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [slug, setSlug] = useState('');
  const [domainsText, setDomainsText] = useState('');
  const [departmentsText, setDepartmentsText] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [logo, setLogo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient<{ universities: UniversityRecord[] }>('/api/admin/universities');
      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setUniversities(data.universities);
      }
    } catch {
      addToast('Failed to load universities list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const openAddModal = () => {
    setEditingUni(null);
    setName('');
    setShortName('');
    setSlug('');
    setDomainsText('');
    setDepartmentsText('');
    setCurrency('BDT');
    setLogo('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (uni: UniversityRecord) => {
    setEditingUni(uni);
    setName(uni.name);
    setShortName(uni.shortName);
    setSlug(uni.slug);
    setDomainsText(uni.domains.join(', '));
    setDepartmentsText(uni.departments.join(', '));
    setCurrency(uni.currency || 'BDT');
    setLogo(uni.logo || '');
    setIsActive(uni.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim() || !slug.trim() || !domainsText.trim()) {
      addToast('Name, short name, slug, and domains are required fields', 'error');
      return;
    }

    const domains = domainsText
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d.length > 0);

    const departments = departmentsText
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    setSaving(true);
    try {
      if (editingUni) {
        // PATCH update
        const { error } = await apiClient(`/api/admin/universities/${editingUni._id}`, {
          method: 'PATCH',
          body: {
            name,
            shortName,
            domains,
            logo,
            departments,
            currency,
            isActive,
          },
        });

        if (error) {
          addToast(error, 'error');
        } else {
          addToast('University updated successfully!', 'success');
          setIsModalOpen(false);
          loadUniversities();
        }
      } else {
        // POST create
        const { error } = await apiClient('/api/admin/universities', {
          method: 'POST',
          body: {
            name,
            shortName,
            slug,
            domains,
            logo,
            departments,
            currency,
          },
        });

        if (error) {
          addToast(error, 'error');
        } else {
          addToast('University added successfully!', 'success');
          setIsModalOpen(false);
          loadUniversities();
        }
      }
    } catch {
      addToast('An error occurred during saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (uni: UniversityRecord) => {
    if (!isSuperAdmin) {
      addToast('Only Super Administrators can enable/disable universities', 'error');
      return;
    }

    const targetStatus = !uni.isActive;

    try {
      const { error } = await apiClient(`/api/admin/universities/${uni._id}`, {
        method: 'PATCH',
        body: { isActive: targetStatus },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast(`University ${targetStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        loadUniversities();
      }
    } catch {
      addToast('An error occurred while changing status', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>University Directory CRUD</h1>
          <p>Register new academic campuses, map email domains, configure departments, and view student engagement.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" onClick={loadUniversities} disabled={loading}>
            <RotateCw size={14} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button variant="primary" size="sm" onClick={openAddModal}>
              <Plus size={15} style={{ marginRight: '6px' }} />
              Add University
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner} />
          <span>Syncing university list...</span>
        </div>
      ) : (
        <div className={styles.universitiesGrid}>
          {universities.map((uni) => (
            <Card key={uni._id} className={styles.uniCard}>
              <div>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.logoWrapper}>
                    {uni.logo ? (
                      <img src={uni.logo} alt={uni.shortName} className={styles.logoImage} />
                    ) : (
                      getInitials(uni.shortName)
                    )}
                  </div>
                  <div className={styles.titleWrapper}>
                    <h3 className={styles.uniName}>{uni.name}</h3>
                    <div className={styles.uniShort}>{uni.shortName}</div>
                  </div>
                  <Badge variant={uni.isActive ? 'success' : 'muted'}>
                    {uni.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <Globe size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                      Domains
                    </span>
                    <div className={styles.domainsList}>
                      {uni.domains.map((d) => (
                        <span key={d} className={styles.domainBadge}>{d}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <BookOpen size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                      Departments
                    </span>
                    <span className={styles.infoVal}>
                      {uni.departments?.length || 0} configured
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <Users size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                      Registrants
                    </span>
                    <span className={styles.infoVal}>{uni.userCount || 0} students</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <Briefcase size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                      Jobs Posted
                    </span>
                    <span className={styles.infoVal}>{uni.jobCount || 0} gigs</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <DollarSign size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                      Currency
                    </span>
                    <span className={styles.infoVal}>{uni.currency || 'BDT'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              {isSuperAdmin && (
                <div className={styles.cardActions}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={styles.editBtn} 
                    onClick={() => openEditModal(uni)}
                  >
                    <Edit2 size={12} style={{ marginRight: '6px' }} />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={styles.deactivateBtn} 
                    onClick={() => handleToggleActive(uni)}
                  >
                    <Power size={12} style={{ marginRight: '6px' }} />
                    {uni.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUni ? 'Edit University' : 'Add University'}
      >
        <form onSubmit={handleSave} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <Input
                type="text"
                label="University Full Name"
                placeholder="e.g. Daffodil International University"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <Input
                type="text"
                label="Short / Abbr. Name"
                placeholder="e.g. DIU"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <Input
                type="text"
                label="Slug ID (Unique)"
                placeholder="e.g. diu"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                disabled={saving || !!editingUni}
                helperText="Lowercase, no spaces"
              />
            </div>

            <div className={styles.formGroupFull}>
              <Input
                type="text"
                label="Allowed Email Domains"
                placeholder="e.g. diu.edu.bd, mail.diu.edu.bd (comma separated)"
                value={domainsText}
                onChange={(e) => setDomainsText(e.target.value)}
                required
                disabled={saving}
                helperText="Students must register using these email domains"
              />
            </div>

            <div className={styles.formGroupFull}>
              <Textarea
                label="Departments List"
                placeholder="e.g. CSE, EEE, BBA, Pharmacy, English (comma separated)"
                value={departmentsText}
                onChange={(e) => setDepartmentsText(e.target.value)}
                disabled={saving}
                helperText="Selectable departments during student registration"
              />
            </div>

            <div>
              <Input
                type="text"
                label="Local Currency Code"
                placeholder="e.g. BDT"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div>
              <Input
                type="text"
                label="Logo Image URL (Optional)"
                placeholder="e.g. https://path-to-logo.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                disabled={saving}
              />
            </div>
            
            {editingUni && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={saving}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', color: 'var(--color-text)' }}>
                  University is Active
                </label>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              {editingUni ? 'Save Changes' : 'Create University'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
