'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import tableStyles from '@/components/ui/Table.module.css';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Plus, Edit2, Trash2, FolderTree, Save, X } from 'lucide-react';
import styles from './categories.module.css';

interface CategoryRecord {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  subcategories: string[];
  order: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const { addToast } = useToast();

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('briefcase');
  const [description, setDescription] = useState('');
  const [subText, setSubText] = useState('');
  const [order, setOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Fetch public categories (returns active ones)
      const { data, error } = await apiClient<{ categories: CategoryRecord[] }>('/api/categories');
      if (error) {
        addToast(error, 'error');
      } else if (data) {
        setCategories(data.categories);
      }
    } catch {
      addToast('Failed to fetch categories list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIcon('briefcase');
    setDescription('');
    setSubText('');
    setOrder(0);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryRecord) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setIcon(category.icon || 'briefcase');
    setDescription(category.description || '');
    setSubText(category.subcategories.join(', '));
    setOrder(category.order || 0);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      addToast('Name and Slug are required fields', 'error');
      return;
    }

    const subcategories = subText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSaving(true);
    try {
      if (editingCategory) {
        // Edit category
        const { error } = await apiClient('/api/admin/categories', {
          method: 'PATCH',
          body: {
            categoryId: editingCategory._id,
            name,
            slug,
            icon,
            description,
            subcategories,
            order,
          },
        });

        if (error) {
          addToast(error, 'error');
        } else {
          addToast('Category updated successfully!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        // Add new category
        const { error } = await apiClient('/api/admin/categories', {
          method: 'POST',
          body: {
            name,
            slug,
            icon,
            description,
            subcategories,
            order,
          },
        });

        if (error) {
          addToast(error, 'error');
        } else {
          addToast('Category created successfully!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch {
      addToast('An error occurred while saving the category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const confirm = window.confirm('Are you sure you want to deactivate this category?');
    if (!confirm) return;

    try {
      const { error } = await apiClient(`/api/admin/categories?categoryId=${categoryId}`, {
        method: 'DELETE',
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('Category deactivated successfully', 'success');
        fetchCategories();
      }
    } catch {
      addToast('Failed to deactivate category', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Category Settings</h1>
          <p>Configure primary job sections and tag structures for DIU MicroJobs.</p>
        </div>
        <Button variant="primary" onClick={openAddModal}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          Add Category
        </Button>
      </div>

      {/* Table Card */}
      <Card className={styles.tableCard}>
        <div className={tableStyles.container}>
          <table className={tableStyles.table}>
            <thead>
              <tr className={tableStyles.headerRow}>
                <th className={tableStyles.headerCell} style={{ width: '60px' }}>Order</th>
                <th className={tableStyles.headerCell}>Name</th>
                <th className={tableStyles.headerCell}>Slug / Icon</th>
                <th className={tableStyles.headerCell}>Description</th>
                <th className={tableStyles.headerCell}>Subcategories</th>
                <th className={tableStyles.headerCell} style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.tableLoading}>
                    <div className={styles.spinner} />
                    <span>Loading categories...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.tableEmpty}>
                    No active categories configured. Click &quot;Add Category&quot; to define one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className={tableStyles.row}>
                    <td className={tableStyles.cell}>
                      <span className={styles.orderNumber}>{cat.order}</span>
                    </td>
                    <td className={tableStyles.cell}>
                      <strong className={styles.categoryName}>{cat.name}</strong>
                    </td>
                    <td className={tableStyles.cell}>
                      <div className={styles.slugRow}>
                        <span className={styles.iconTag}>{cat.icon || 'briefcase'}</span>
                        <span className={styles.slugTag}>/{cat.slug}</span>
                      </div>
                    </td>
                    <td className={tableStyles.cell}>
                      <p className={styles.descriptionText}>{cat.description || '—'}</p>
                    </td>
                    <td className={tableStyles.cell}>
                      <div className={styles.subTags}>
                        {cat.subcategories && cat.subcategories.length > 0 ? (
                          cat.subcategories.map((sub, idx) => (
                            <Badge key={idx} variant="secondary" className={styles.subBadge}>
                              {sub}
                            </Badge>
                          ))
                        ) : (
                          <span className={styles.noSubs}>No subcategories</span>
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.cell}>
                      <div className={styles.actions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(cat)}
                        >
                          <Edit2 size={12} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(cat._id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <Modal
          title={editingCategory ? 'Edit Category' : 'Create New Category'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSave} className={styles.modalContent}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="cat-name">Category Name</label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                    }
                  }}
                  placeholder="e.g., Graphic Design"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cat-slug">URL Slug</label>
                <Input
                  id="cat-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., graphic-design"
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="cat-icon">Lucide Icon Name</label>
                <Input
                  id="cat-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g., camera, laptop, search"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cat-order">Sort Order Index</label>
                <Input
                  id="cat-order"
                  type="number"
                  value={order.toString()}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 0, 1, 2"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cat-desc">Description</label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what jobs fit in this category..."
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cat-subs">Subcategories (comma separated)</label>
              <Textarea
                id="cat-subs"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                placeholder="e.g., Logos, Posters, Flyers, Slide Deck"
                rows={2}
              />
            </div>

            <div className={styles.modalActions}>
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                <Save size={14} style={{ marginRight: '6px' }} />
                Save Category
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
