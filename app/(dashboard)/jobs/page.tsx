'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Card, Button, Input, Select, SearchBar, Skeleton, EmptyState, Badge } from '@/components/ui';
import { getStatusColor, formatStatus, formatBudget, formatDate } from '@/lib/utils';
import { Briefcase, AlertTriangle, Calendar, PlusCircle } from 'lucide-react';
import styles from './BrowseJobsPage.module.css';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface JobItem {
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
  category: CategoryItem;
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('');
  const [minBudget, setMinBudget] = useState('');

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'open');
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (urgency) params.append('urgency', urgency);
      if (minBudget) params.append('minBudget', minBudget);

      const res = await apiClient<{ jobs: JobItem[] }>(`/api/jobs?${params.toString()}`);
      if (res.data) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, urgency, minBudget]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiClient<{ categories: CategoryItem[] }>('/api/categories');
        if (res.data) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const urgencyOptions = [
    { value: '', label: 'All Urgencies' },
    { value: 'low', label: 'Low Urgency' },
    { value: 'normal', label: 'Normal Urgency' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Browse MicroJobs</h2>
          <p className={styles.subtitle}>Discover micro-projects, tasks, and assistant roles around campus</p>
        </div>
        <Link href="/jobs/create">
          <Button variant="primary">
            <PlusCircle size={16} style={{ marginRight: '8px' }} />
            Post a Job
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <Card className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, skills or keywords..."
            className={styles.searchBar}
          />
          <div className={styles.selectsWrapper}>
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className={styles.filterSelect}
            />
            <Select
              options={urgencyOptions}
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              placeholder="Urgency"
              className={styles.filterSelect}
            />
            <Input
              type="number"
              placeholder="Min Budget (৳)"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className={styles.budgetInput}
            />
          </div>
        </div>
      </Card>

      {/* Jobs Grid */}
      {loading ? (
        <div className={styles.grid}>
          <Skeleton height="200px" />
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No MicroJobs Found"
          description="Try modifying your search or filters to see other listings."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearch('');
              setCategory('');
              setUrgency('');
              setMinBudget('');
            },
          }}
        />
      ) : (
        <div className={styles.grid}>
          {jobs.map((job) => (
            <Card key={job._id} variant="interactive" className={styles.jobCard}>
              <div className={styles.cardHeader}>
                <Badge variant={job.urgency === 'urgent' ? 'error' : job.urgency === 'normal' ? 'primary' : 'muted'}>
                  {job.urgency}
                </Badge>
                <span className={styles.budget}>{formatBudget(job.budget)}</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.jobDescription}>
                  {job.description.length > 120
                    ? job.description.substring(0, 120) + '...'
                    : job.description}
                </p>
                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <Calendar size={14} />
                    <span>Due {formatDate(job.deadline)}</span>
                  </div>
                  <span className={styles.categoryName}>
                    {job.category?.name || 'General'}
                  </span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.clientName}>
                  By {job.client?.displayName || 'DIU Member'}
                </span>
                <Link href={`/jobs/${job._id}`} className={styles.detailsLink}>
                  View Details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
