'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, Button, Input, Select, SearchBar, Skeleton, EmptyState, Badge } from '@/components/ui';
import { getStatusColor, formatStatus, formatBudget, formatDate } from '@/lib/utils';
import { Briefcase, AlertTriangle, Calendar, PlusCircle } from 'lucide-react';
import styles from './BrowseJobsPage.module.css';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories?: string[];
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
  subcategory?: string;
  thumbnail?: string;
}

function BrowseJobsContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [urgency, setUrgency] = useState('');
  const [minBudgetVal, setMinBudgetVal] = useState('');
  const [minBudget, setMinBudget] = useState('');

  // Debounce searchVal -> search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchVal);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchVal]);

  // Debounce minBudgetVal -> minBudget
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinBudget(minBudgetVal);
    }, 400);
    return () => clearTimeout(timer);
  }, [minBudgetVal]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'open');
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
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
  }, [search, category, subcategory, urgency, minBudget]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiClient<{ categories: CategoryItem[] }>('/api/categories');
        if (res.data) {
          const cats = res.data.categories;
          setCategories(cats);

          const urlCategory = searchParams.get('category');
          if (urlCategory) {
            const found = cats.find((c) => c.slug === urlCategory || c._id === urlCategory);
            if (found) {
              setCategory(found._id);
              const urlSubcategory = searchParams.get('subcategory');
              if (urlSubcategory && found.subcategories?.includes(urlSubcategory)) {
                setSubcategory(urlSubcategory);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }

    loadCategories();
  }, [searchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchVal(urlSearch);
      setSearch(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setSubcategory('');
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const activeCategoryDoc = categories.find((c) => c._id === category);
  const subcategoryOptions = activeCategoryDoc && activeCategoryDoc.subcategories
    ? activeCategoryDoc.subcategories.map((sub) => ({ value: sub, label: sub }))
    : [];

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
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search by title, skills or keywords..."
            className={styles.searchBar}
          />
          <div className={styles.selectsWrapper}>
            <Select
              options={categoryOptions}
              value={category}
              onChange={handleCategoryChange}
              className={styles.filterSelect}
            />
            {category && subcategoryOptions.length > 0 && (
              <Select
                options={[
                  { value: '', label: 'All Subcategories' },
                  ...subcategoryOptions
                ]}
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className={styles.filterSelect}
              />
            )}
            <Select
              options={urgencyOptions}
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className={styles.filterSelect}
            />
            <Input
              type="number"
              placeholder="Min Budget (৳)"
              value={minBudgetVal}
              onChange={(e) => setMinBudgetVal(e.target.value)}
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
              setSearchVal('');
              setSearch('');
              setCategory('');
              setSubcategory('');
              setUrgency('');
              setMinBudgetVal('');
              setMinBudget('');
            },
          }}
        />
      ) : (
        <div className={styles.grid}>
          {jobs.map((job) => (
            <Card key={job._id} variant="interactive" className={styles.jobCard}>
              <div className={styles.cardThumbnailWrapper}>
                {job.thumbnail ? (
                  <img src={job.thumbnail} alt={job.title} className={styles.cardThumbnail} />
                ) : (
                  <div className={`${styles.cardThumbnailPlaceholder} ${styles[job.category?.slug || 'general']}`}>
                    <span className={styles.placeholderCategoryIcon}>
                      {job.category?.icon === 'code' ? '💻' : job.category?.icon === 'palette' ? '🎨' : job.category?.icon === 'camera' ? '📷' : job.category?.icon === 'video' ? '🎥' : job.category?.icon === 'presentation' ? '📊' : job.category?.icon === 'search' ? '🔍' : job.category?.icon === 'book' ? '📚' : job.category?.icon === 'pen-tool' ? '📐' : job.category?.icon === 'cpu' ? '⚙️' : job.category?.icon === 'file-text' ? '📝' : job.category?.icon === 'clipboard' ? '📋' : '💼'}
                    </span>
                    <span className={styles.placeholderCategoryName}>
                      {job.category?.name || 'DIU Job'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles.cardContentWrapper}>
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
                      {job.subcategory && ` • ${job.subcategory}`}
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowseJobsPage() {
  return (
    <Suspense fallback={<div className={styles.container} style={{ padding: 'var(--space-6)' }}><Skeleton height="40px" width="100%" /><div style={{ marginTop: 'var(--space-6)' }}><Skeleton height="300px" width="100%" /></div></div>}>
      <BrowseJobsContent />
    </Suspense>
  );
}
