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
  subcategories?: string[];
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2d context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export default function CreateJobPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [thumbnailName, setThumbnailName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file', 'warning');
      return;
    }

    setCompressing(true);
    try {
      const compressedBase64 = await compressImage(file);
      setThumbnail(compressedBase64);
      setThumbnailName(file.name);
      addToast('Thumbnail optimized successfully!', 'success');
    } catch (err) {
      console.error('Image compression error:', err);
      addToast('Failed to optimize image, using original', 'warning');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnail(event.target?.result as string);
        setThumbnailName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

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
        subcategory: subcategory || undefined,
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
        thumbnail: thumbnail || undefined,
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

  const activeCategoryDoc = categories.find((c) => c._id === category);
  const subcategoryOptions = activeCategoryDoc && activeCategoryDoc.subcategories
    ? activeCategoryDoc.subcategories.map((sub) => ({ value: sub, label: sub }))
    : [];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setSubcategory('');
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
                onChange={handleCategoryChange}
                placeholder={loading ? 'Loading categories...' : 'Select a Category'}
                required
                disabled={submitting || loading}
              />

              {category && subcategoryOptions.length > 0 && (
                <Select
                  label="Job Subcategory"
                  options={subcategoryOptions}
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="Select a Subcategory"
                  required
                  disabled={submitting}
                />
              )}

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
            <div className={styles.thumbnailHeader}>
              <span className={styles.label}>Job Thumbnail (Optional)</span>
              <span className={styles.helperText}>
                Upload a cover image. It will be compressed automatically for fast loading.
              </span>
            </div>
            
            <div className={styles.uploadContainer}>
              {thumbnail ? (
                <div className={styles.previewWrapper}>
                  <img src={thumbnail} alt="Job thumbnail preview" className={styles.previewImage} />
                  <div className={styles.previewActions}>
                    <span className={styles.imageName}>{thumbnailName || 'thumbnail.jpg'}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setThumbnail('');
                        setThumbnailName('');
                      }}
                      disabled={submitting}
                    >
                      Remove Thumbnail
                    </Button>
                  </div>
                </div>
              ) : (
                <label className={styles.uploadArea}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className={styles.fileInput}
                    disabled={submitting || compressing}
                  />
                  <div className={styles.uploadPlaceholder}>
                    <div className={styles.uploadIcon}>
                      {compressing ? '⚙️' : '📷'}
                    </div>
                    <span className={styles.uploadText}>
                      {compressing ? 'Optimizing image...' : 'Click to upload job thumbnail'}
                    </span>
                    <span className={styles.uploadSubtext}>
                      PNG, JPG (Auto-compressed to ~20KB for fast loads)
                    </span>
                  </div>
                </label>
              )}
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
