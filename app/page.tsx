'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import {
  Laptop,
  Palette,
  Camera,
  FileText,
  Search,
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Layers,
  GraduationCap
} from 'lucide-react';
import styles from './page.module.css';

/* ─── Static Data ────────────────────────────────────────────────── */

const FEATURED_CATEGORIES = [
  {
    id: 'web-dev',
    name: 'Web & App Development',
    description: 'Custom websites, mobile apps, bug fixes, and portfolio sites.',
    icon: Laptop,
    slug: 'software-web',
    color: '#3b82f6',
  },
  {
    id: 'design',
    name: 'Graphic Design & Branding',
    description: 'Posters, logos, banners, event banners, and UI design.',
    icon: Palette,
    slug: 'graphic-design',
    color: '#ec4899',
  },
  {
    id: 'media',
    name: 'Photography & Video',
    description: 'Event photography, promo videos, and drone shots.',
    icon: Camera,
    slug: 'photography-video',
    color: '#10b981',
  },
  {
    id: 'academic',
    name: 'Academic Slides & Editing',
    description: 'Professional slide decks, poster presentations, and proofreading.',
    icon: FileText,
    slug: 'slides-presentation',
    color: '#f59e0b',
  },
  {
    id: 'research',
    name: 'Research Assistance',
    description: 'Literature review, survey data analysis, and lab reporting.',
    icon: Search,
    slug: 'research-assistant',
    color: '#8b5cf6',
  },
  {
    id: 'projects',
    name: 'Academic & Small Projects',
    description: 'Support for course projects, assignments, and tutorials.',
    icon: GraduationCap,
    slug: 'academic-projects',
    color: '#06b6d4',
  },
] as const;

const KEY_STATS = [
  { value: '500+', label: 'Active Students', icon: Users },
  { value: '1,200+', label: 'MicroJobs Completed', icon: Briefcase },
  { value: '98%', label: 'Job Completion Rate', icon: ShieldCheck },
  { value: '15+', label: 'Departments Engaged', icon: Layers },
] as const;

/* ─── Component ──────────────────────────────────────────────────── */

export default function Home() {
  const router = useRouter();
  const { firebaseUser, userProfile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push('/jobs');
    }
  };

  const handleCategoryClick = (slug: string) => {
    router.push(`/jobs?category=${slug}`);
  };

  // Convert MongoDB user details to NavbarUser type
  const navbarUser = userProfile
    ? {
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
        role: userProfile.role,
      }
    : undefined;

  return (
    <div className={styles.wrapper}>
      {/* Navbar */}
      <Navbar user={navbarUser} onLogout={logout} />

      {/* Hero Section */}
      <section className={styles.hero} aria-label="Introduction">
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <GraduationCap size={14} className={styles.badgeIcon} />
              <span>Exclusively for Daffodil International University</span>
            </div>
            <h1 className={styles.heroTitle}>
              Hire Top Student Talent for Your <span>DIU MicroJobs</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Connect with skilled student freelancers, developers, designers, photographers, 
              and research assistants from our university community. Trusted, fast, and local.
            </p>

            {/* Search Bar Wrapper */}
            <div className={styles.searchWrapper}>
              <SearchBar
                placeholder="What project do you need help with? (e.g., presentation slide, website)"
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                size="lg"
                className={styles.heroSearch}
              />
              <div className={styles.searchTags}>
                <span>Popular:</span>
                <button onClick={() => setSearchQuery('presentation slide')}>Slide Deck</button>
                <button onClick={() => setSearchQuery('photography')}>Photography</button>
                <button onClick={() => setSearchQuery('wordpress')}>WordPress</button>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.heroActions}>
              <Button size="lg" variant="primary" onClick={() => router.push('/jobs/create')}>
                Post a MicroJob
                <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/jobs')}>
                Find Work
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats} aria-label="Stats & Metrics">
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {KEY_STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className={styles.statCard}>
                <div className={styles.statIconWrapper}>
                  <Icon size={24} className={styles.statIcon} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className={styles.categories} aria-label="Job Categories">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Popular DIU MicroJob Categories</h2>
            <p>Explore specialized services and support categories available from Daffodil students.</p>
          </div>

          <div className={styles.categoryGrid}>
            {FEATURED_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={styles.categoryCard}
                  onClick={() => handleCategoryClick(cat.slug)}
                  style={{ '--card-accent': cat.color } as React.CSSProperties}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCategoryClick(cat.slug);
                    }
                  }}
                >
                  <div className={styles.catIconWrapper}>
                    <IconComp size={24} className={styles.catIcon} />
                  </div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                  <span className={styles.catLink}>
                    Browse Jobs <ArrowRight size={14} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks} aria-label="How DIU MicroJobs Works">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>How DIU MicroJobs Works</h2>
            <p>A simple, safe, and convenient ecosystem for clients and student freelancers.</p>
          </div>

          <div className={styles.howGrid}>
            {/* Column 1: For Clients */}
            <div className={styles.howColumn}>
              <div className={styles.howHeader}>
                <span className={styles.howBadge}>For Clients</span>
                <h3>Need something done?</h3>
              </div>
              <ol className={styles.howList}>
                <li>
                  <div className={styles.howNum}>1</div>
                  <div>
                    <h4>Post a Job for Free</h4>
                    <p>Describe the tasks, set a deadline, and propose a BDT budget (fixed or range).</p>
                  </div>
                </li>
                <li>
                  <div className={styles.howNum}>2</div>
                  <div>
                    <h4>Receive Student Proposals</h4>
                    <p>Interested student freelancers will submit bids and cover letters within hours.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.howNum}>3</div>
                  <div>
                    <h4>Sign Contract & Verify</h4>
                    <p>Approve a proposal, sign the digital contract, and track deliverables via messaging.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.howNum}>4</div>
                  <div>
                    <h4>Release Payment & Review</h4>
                    <p>Once you verify the final deliverables, complete the job and write a review.</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Column 2: For Students */}
            <div className={styles.howColumn}>
              <div className={styles.howHeader}>
                <span className={`${styles.howBadge} ${styles.studentBadge}`}>For Students</span>
                <h3>Want to earn on campus?</h3>
              </div>
              <ol className={styles.howList}>
                <li>
                  <div className={styles.howNum}>1</div>
                  <div>
                    <h4>Verify with DIU Email</h4>
                    <p>Sign up securely using your official `@s.diu.edu.bd` or alumni account.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.howNum}>2</div>
                  <div>
                    <h4>Apply to Local Listings</h4>
                    <p>Browse photography gigs, slide creation, development tasks, and write proposals.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.howNum}>3</div>
                  <div>
                    <h4>Perform Outstanding Work</h4>
                    <p>Chat directly with clients, deliver files on-time, and request revisions if needed.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.howNum}>4</div>
                  <div>
                    <h4>Build Your Campus Portfolio</h4>
                    <p>Get paid, receive 5-star ratings, and showcase your work on your profile.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta} aria-label="Join Community">
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <h2>Ready to Join DIU's Freelance Economy?</h2>
            <p>
              Whether you need to outsource a project or want to earn money using your skills, 
              get started instantly with your DIU account.
            </p>
            <div className={styles.ctaVerification}>
              <ShieldCheck size={16} />
              <span>Only accessible using official `@diu.edu.bd`, `@daffodilvarsity.edu.bd` or `@s.diu.edu.bd` emails.</span>
            </div>
            <div className={styles.ctaButtons}>
              {!firebaseUser ? (
                <>
                  <Button size="lg" variant="primary" onClick={() => router.push('/register')}>
                    Create Your Account
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push('/login')} className={styles.ctaOutlineBtn}>
                    Log In
                  </Button>
                </>
              ) : (
                <Button size="lg" variant="primary" onClick={() => router.push('/dashboard')}>
                  Go to My Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
