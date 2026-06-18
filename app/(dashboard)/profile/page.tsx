'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { apiClient } from '@/lib/api-client';
import {
  User as UserIcon,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Tag,
  Briefcase
} from 'lucide-react';
import styles from './profile.module.css';

interface PortfolioItem {
  title: string;
  imageUrl: string;
  description: string;
  link: string;
}

export default function EditProfilePage() {
  const { userProfile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'skills' | 'portfolio'>('general');
  const [saving, setSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // Initialize form states when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDepartment(userProfile.department || '');
      setPhotoURL(userProfile.photoURL || '');
      setBio(userProfile.bio || '');
      setSkillsText(userProfile.skills?.join(', ') || '');
      setPortfolio(userProfile.portfolio || []);
    }
  }, [userProfile]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('Display name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await apiClient('/api/users', {
        method: 'PATCH',
        body: { displayName, department, photoURL, bio },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('General profile updated successfully!', 'success');
        await refreshProfile();
      }
    } catch {
      addToast('An error occurred while saving profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSaving(true);
    try {
      const { error } = await apiClient('/api/users', {
        method: 'PATCH',
        body: { skills },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('Skills updated successfully!', 'success');
        await refreshProfile();
      }
    } catch {
      addToast('An error occurred while saving skills', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolio = () => {
    setPortfolio([
      ...portfolio,
      { title: '', imageUrl: '', description: '', link: '' },
    ]);
  };

  const handleRemovePortfolio = (index: number) => {
    const updated = portfolio.filter((_, i) => i !== index);
    setPortfolio(updated);
  };

  const handlePortfolioChange = (
    index: number,
    field: keyof PortfolioItem,
    value: string
  ) => {
    const updated = portfolio.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setPortfolio(updated);
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    for (const item of portfolio) {
      if (!item.title.trim()) {
        addToast('Portfolio item title is required', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await apiClient('/api/users', {
        method: 'PATCH',
        body: { portfolio },
      });

      if (error) {
        addToast(error, 'error');
      } else {
        addToast('Portfolio updated successfully!', 'success');
        await refreshProfile();
      }
    } catch {
      addToast('An error occurred while saving portfolio', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!userProfile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1>Edit Profile</h1>
          <p>Update your public information to stand out for campus jobs.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open(`/profile/${userProfile._id}`, '_blank')}
        >
          <ExternalLink size={15} style={{ marginRight: '8px' }} />
          View Public Profile
        </Button>
      </div>

      <div className={styles.layout}>
        {/* Navigation Sidebar */}
        <aside className={styles.sidebar}>
          <Card className={styles.navCard}>
            <nav className={styles.navMenu}>
              <button
                className={`${styles.navItem} ${activeTab === 'general' ? styles.active : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <UserIcon size={18} />
                <span>General Info</span>
              </button>
              <button
                className={`${styles.navItem} ${activeTab === 'skills' ? styles.active : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                <Tag size={18} />
                <span>Skills & Tags</span>
              </button>
              <button
                className={`${styles.navItem} ${activeTab === 'portfolio' ? styles.active : ''}`}
                onClick={() => setActiveTab('portfolio')}
              >
                <Briefcase size={18} />
                <span>Portfolio Gigs</span>
              </button>
            </nav>
          </Card>

          {/* Profile Card Preview */}
          <Card className={styles.previewCard}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                {photoURL ? (
                  <img src={photoURL} alt={displayName} />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <h3 className={styles.previewName}>{displayName || 'Your Name'}</h3>
            <p className={styles.previewMeta}>
              {userProfile.role.toUpperCase()} • {department || 'Department'}
            </p>
            <div className={styles.previewRating}>
              <span>★ {userProfile.rating.toFixed(1)}</span>
              <span className={styles.previewCount}>({userProfile.totalReviews} reviews)</span>
            </div>
          </Card>
        </aside>

        {/* Content Area */}
        <main className={styles.content}>
          {activeTab === 'general' && (
            <Card className={styles.formCard}>
              <div className={styles.cardHeader}>
                <UserIcon size={20} className={styles.cardHeaderIcon} />
                <h2>General Information</h2>
              </div>
              <form onSubmit={handleSaveGeneral} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="displayName">Display Name</label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Anik Rahman"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="department">Department</label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., CSE, SWE, EEE"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="photoURL">Avatar Image URL</label>
                  <Input
                    id="photoURL"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className={styles.helpText}>
                    Provide a direct URL to a profile photo of yourself.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bio">Professional Bio</label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell prospective clients about your experience, interests, and what services you offer on campus..."
                    rows={6}
                  />
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" loading={saving}>
                    <Save size={16} style={{ marginRight: '8px' }} />
                    Save General Info
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'skills' && (
            <Card className={styles.formCard}>
              <div className={styles.cardHeader}>
                <Tag size={20} className={styles.cardHeaderIcon} />
                <h2>Skills & Tags</h2>
              </div>
              <form onSubmit={handleSaveSkills} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="skills">My Skills</label>
                  <Textarea
                    id="skills"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g., Web Development, React, UI Design, Photoshop, Video Editing, Presentation Slides"
                    rows={4}
                  />
                  <p className={styles.helpText}>
                    Separate skills with commas. These tags help clients search for you as a freelancer.
                  </p>
                </div>

                <div className={styles.tagPreviewWrapper}>
                  <h3>Tag Preview:</h3>
                  <div className={styles.tagList}>
                    {skillsText
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0)
                      .map((skill, idx) => (
                        <span key={idx} className={styles.skillTag}>
                          {skill}
                        </span>
                      ))}
                    {skillsText.trim() === '' && (
                      <span className={styles.emptyTags}>No tags entered yet.</span>
                    )}
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" loading={saving}>
                    <Save size={16} style={{ marginRight: '8px' }} />
                    Save Skills
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'portfolio' && (
            <Card className={styles.formCard}>
              <div className={styles.cardHeader}>
                <Briefcase size={20} className={styles.cardHeaderIcon} />
                <h2>Portfolio Projects</h2>
              </div>
              <form onSubmit={handleSavePortfolio} className={styles.form}>
                <div className={styles.portfolioIntro}>
                  <p>
                    Showcase past work, academic slide designs, software websites, or event photography 
                    gigs you have completed. It gives campus clients confidence in hiring you.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPortfolio}
                  >
                    <Plus size={15} style={{ marginRight: '6px' }} />
                    Add Project
                  </Button>
                </div>

                {portfolio.map((item, index) => (
                  <div key={index} className={styles.portfolioItemForm}>
                    <div className={styles.portfolioItemHeader}>
                      <h4>Project #{index + 1}</h4>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleRemovePortfolio(index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor={`port-title-${index}`}>Project Title</label>
                        <Input
                          id={`port-title-${index}`}
                          value={item.title}
                          onChange={(e) =>
                            handlePortfolioChange(index, 'title', e.target.value)
                          }
                          placeholder="e.g., DIU CSE Fest Poster Design"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor={`port-link-${index}`}>Project Link (optional)</label>
                        <Input
                          id={`port-link-${index}`}
                          value={item.link}
                          onChange={(e) =>
                            handlePortfolioChange(index, 'link', e.target.value)
                          }
                          placeholder="e.g., https://github.com/... or Behance link"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor={`port-image-${index}`}>Image URL (optional)</label>
                      <Input
                        id={`port-image-${index}`}
                        value={item.imageUrl}
                        onChange={(e) =>
                          handlePortfolioChange(index, 'imageUrl', e.target.value)
                        }
                        placeholder="https://example.com/project-screenshot.jpg"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor={`port-desc-${index}`}>Description</label>
                      <Textarea
                        id={`port-desc-${index}`}
                        value={item.description}
                        onChange={(e) =>
                          handlePortfolioChange(index, 'description', e.target.value)
                        }
                        placeholder="Briefly describe what you did, technologies or tools used, and what was achieved..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}

                {portfolio.length === 0 && (
                  <div className={styles.emptyPortfolio}>
                    <p>No portfolio items added yet. Click &quot;Add Project&quot; to begin showcase.</p>
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button type="submit" loading={saving}>
                    <Save size={16} style={{ marginRight: '8px' }} />
                    Save Portfolio
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
