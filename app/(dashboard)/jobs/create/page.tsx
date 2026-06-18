'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Input, Select, Textarea } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft, Send, Save } from 'lucide-react';
import styles from './CreateJobPage.module.css';

interface CategoryItem {
  _id: string;
  name: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'range' | 'hourly'>('fixed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'urgent'>('normal');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiClient<{ categories: CategoryItem[] }>('/api/categories');
        if (res.data) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (submitStatus: 'draft' | 'pending_review') => {
    if (!title || !category || !budgetMin || !deadline || !description) {
      addToast('Please fill in all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const skills = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const body = {
        title,
        description,
        category,
        budget: {
          type: budgetType,
          min: parseInt(budgetMin),
          max: budgetMax ? parseInt(budgetMax) : undefined,
          currency: 'BDT',
        },
        deadline: new Date(deadline).toISOString(),
        skills,
        urgency,
        status: submitStatus,
      };

      const res = await apiClient<{ job: { _id: string } }>('/api/jobs', {
        method: 'POST',
        body,
      });

      if (res.error) {
        addToast(res.error, 'error');
      } else {
        addToast(
          submitStatus === 'draft'
            ? 'Job saved as draft successfully!'
            : 'Job submitted for review successfully!',
          'success'
        );
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to create job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  const budgetTypeOptions = [
    { value: 'fixed', label: 'Fixed Budget (৳)' },
    { value: 'range', label: 'Budget Range (৳)' },
    { value: 'hourly', label: 'Hourly Rate (৳/hr)' },
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low Urgency' },
    { value: 'normal', label: 'Normal Urgency' },
    { value: 'urgent', label: 'Urgent task (requires quick response)' },
  ];

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to dashboard</span>
      </Link>

      <div className={styles.header}>
        <h2 className={styles.title}>Post a MicroJob</h2>
        <p className={styles.subtitle}>
          Hire Daffodil students/alumni for projects, graphic design, slide decks, and assistant tasks
        </p>
      </div>

      <Card className={styles.card}>
        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <div className={styles.formSection}>
            <Input
              type="text"
              label="Job Title"
              placeholder="e.g. Need photographer for SWE department event"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
            />

            <div className={styles.row}>
              <Select
                label="Job Category"
                options={categoryOptions}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={loading ? 'Loading categories...' : 'Select a Category'}
                required
                disabled={submitting || loading}
              />

              <Input
                type="date"
                label="Submission Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.row}>
              <Select
                label="Budget Structure"
                options={budgetTypeOptions}
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value as typeof budgetType)}
                required
                disabled={submitting}
              />

              <Input
                type="number"
                label={budgetType === 'range' ? 'Minimum Budget (৳)' : budgetType === 'hourly' ? 'Rate (৳/hr)' : 'Budget Amount (৳)'}
                placeholder="e.g. 1500"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                required
                disabled={submitting}
              />

              {budgetType === 'range' && (
                <Input
                  type="number"
                  label="Maximum Budget (৳)"
                  placeholder="e.g. 3000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  disabled={submitting}
                />
              )}
            </div>

            <Select
              label="Urgency Level"
              options={urgencyOptions}
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as typeof urgency)}
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.formSection}>
            <Textarea
              label="Job Description"
              placeholder="Provide a detailed description of the task, deliverables, and expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              disabled={submitting}
            />

            <Input
              type="text"
              label="Skills Required (comma-separated)"
              placeholder="e.g. photography, photo editing, lightroom"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              disabled={submitting}
              helperText="Press comma to separate skills tags"
            />
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
            >
              <Save size={16} style={{ marginRight: '8px' }} />
              Save Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit('pending_review')}
              loading={submitting}
            >
              <Send size={16} style={{ marginRight: '8px' }} />
              Submit for Moderation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
