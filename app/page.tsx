'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';
import {
  Laptop, Palette, Camera, FileText, Search,
  Users, Award, ShieldCheck, TrendingUp, ArrowRight,
  Briefcase, Layers, GraduationCap, Star, Check, Zap,
  MessageSquare, Clock, Globe2, ChevronRight,
  PenTool, Cpu, BookOpen,
  ClipboardList, Calendar, Truck
} from 'lucide-react';
import styles from './page.module.css';

const ACCENT_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const ICON_MAP: Record<string, any> = {
  Laptop,
  Palette,
  Camera,
  FileText,
  Search,
  GraduationCap,
  Briefcase,
  PenTool,
  Cpu,
  BookOpen,
  ClipboardList,
  Calendar,
  Truck,
  Award,
};

function getCategoryIcon(iconName: string) {
  return ICON_MAP[iconName] || Briefcase;
}

/* ─── Static Data ────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'web', name: 'Web & App Dev', icon: Laptop,    color: '#3b82f6', count: '120+' },
  { id: 'design', name: 'Design',       icon: Palette,  color: '#ec4899', count: '85+' },
  { id: 'photo',  name: 'Photography',  icon: Camera,   color: '#10b981', count: '60+' },
  { id: 'docs',   name: 'Slides & Docs',icon: FileText, color: '#f59e0b', count: '94+' },
  { id: 'research',name: 'Research',    icon: Search,   color: '#8b5cf6', count: '47+' },
  { id: 'courses', name: 'Tutoring',    icon: GraduationCap, color: '#06b6d4', count: '33+' },
] as const;

const STATS = [
  { value: '500+',  label: 'Registered Students' },
  { value: '1,200+',label: 'Jobs Completed' },
  { value: '98%',   label: 'Satisfaction Rate' },
  { value: '15+',   label: 'Departments' },
] as const;

const HOW_STEPS = [
  {
    step: '01',
    title: 'Post Your MicroJob',
    desc: 'Describe your project, set a BDT budget, and add a deadline. Takes under 2 minutes.',
    icon: Zap,
  },
  {
    step: '02',
    title: 'Receive Proposals',
    desc: 'Skilled DIU students and alumni submit proposals with cover letters and bids.',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: 'Hire & Collaborate',
    desc: 'Accept a proposal, sign a digital contract, and communicate through our messenger.',
    icon: Users,
  },
] as const;

const TESTIMONIALS = [
  {
    text: "Got my final-year project presentation slides done in 24 hours. Absolutely stunning quality. Will hire again!",
    author: 'Md. Rafiqul Islam',
    role: 'CSE Faculty — DIU',
    rating: 5,
    initials: 'RI',
  },
  {
    text: "As a student, earning BDT 8,000 in one week by developing a landing page for a department was amazing.",
    author: 'Nusrat Jahan',
    role: 'Student Freelancer — SWE',
    rating: 5,
    initials: 'NJ',
  },
  {
    text: "We needed event photos urgently. Found a talented student photographer within hours. Campus is full of talent!",
    author: 'Business Club DIU',
    role: 'Department Client',
    rating: 5,
    initials: 'BC',
  },
] as const;

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'DIU Email Verified',
    desc: 'All accounts require an official @diu.edu.bd or @s.diu.edu.bd email — zero fake profiles.',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    desc: 'Students are on campus — get proposals within hours and work delivered same-day.',
  },
  {
    icon: Globe2,
    title: 'BDT Pricing',
    desc: 'All payments in BDT, campus-friendly rates. No international platform fees.',
  },
  {
    icon: Star,
    title: 'Rated & Reviewed',
    desc: 'Every job ends with a review. Build your campus reputation and portfolio.',
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Home() {
  const router = useRouter();
  const { firebaseUser, userProfile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    registeredStudents: '500+',
    completedJobs: '1,200+',
    satisfactionRate: '98%',
    departmentsCount: '15+',
  });
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, statsRes, testRes] = await Promise.all([
          apiClient<{ categories: any[] }>('/api/categories'),
          apiClient<any>('/api/public/stats'),
          apiClient<{ reviews: any[] }>('/api/public/testimonials')
        ]);

        if (catRes.data) setCategories(catRes.data.categories);
        if (statsRes.data) setStats(statsRes.data);
        if (testRes.data) setTestimonials(testRes.data.reviews);
      } catch (err) {
        console.error('Failed to load dynamic landing data:', err);
      }
    }
    loadData();
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    router.push(q ? `/jobs?search=${encodeURIComponent(q)}` : '/jobs');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const navbarUser = userProfile
    ? { displayName: userProfile.displayName, photoURL: userProfile.photoURL, role: userProfile.role }
    : undefined;

  const statsList = [
    { value: stats?.registeredStudents ?? '500+', label: 'Registered Students' },
    { value: stats?.completedJobs ?? '1,200+', label: 'Jobs Completed' },
    { value: stats?.satisfactionRate ?? '98%', label: 'Satisfaction Rate' },
    { value: stats?.departmentsCount ?? '15+', label: 'Departments' },
  ];

  const activeCategories = categories.length > 0
    ? categories.map((cat, idx) => ({
        id: cat._id,
        name: cat.name,
        icon: getCategoryIcon(cat.icon),
        color: ACCENT_COLORS[idx % ACCENT_COLORS.length],
        count: `${cat.jobCount || 0}+`
      }))
    : CATEGORIES;

  const activeTestimonials = testimonials.length > 0
    ? testimonials
    : TESTIMONIALS;

  return (
    <div className={styles.wrapper}>
      <Navbar user={navbarUser} onLogout={logout} />

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className={styles.hero} aria-label="Hero">
        <div className={styles.container}>
          <div className={styles.heroInner}>
            {/* Left */}
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span className={styles.badgeDot} />
                Exclusively for Daffodil International University
              </div>

              <h1 className={styles.heroTitle}>
                Find Trusted{' '}
                <span className={styles.heroTitleHighlight}>Student Talent</span>
                {' '}for Any Campus Task
              </h1>

              <p className={styles.heroSubtitle}>
                DIU MicroJobs connects university clients with skilled student 
                freelancers — developers, designers, photographers & more. 
                Fast, affordable, and campus-verified.
              </p>

              {/* Search */}
              <div className={styles.heroSearch}>
                <input
                  className={styles.heroSearchInput}
                  type="text"
                  placeholder='Try "logo design" or "website"…'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className={styles.heroSearchBtn} onClick={handleSearch}>
                  <Search size={15} />
                  Search
                </button>
              </div>

              <div className={styles.searchTags}>
                <span className={styles.searchTagLabel}>Popular:</span>
                {['Slide Deck', 'Logo Design', 'WordPress', 'Photography'].map((t) => (
                  <button
                    key={t}
                    className={styles.searchTag}
                    onClick={() => { setSearchQuery(t); router.push(`/jobs?search=${encodeURIComponent(t)}`); }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Trusted bar */}
              <div className={styles.trustedBar}>
                <div className={styles.trustedAvatars}>
                  {['NJ', 'RI', 'MH', 'SK', 'FT'].map((init, i) => (
                    <div key={i} className={styles.trustedAvatar}>{init}</div>
                  ))}
                </div>
                <p className={styles.trustedText}>
                  Join <strong>500+ DIU students</strong> already earning on campus
                </p>
              </div>
            </div>

            {/* Right — Floating cards */}
            <div className={styles.heroRight}>
              <div className={styles.floatingCard}>
                <div className={styles.floatingCardTop}>
                  <div className={styles.floatingCardIcon}>
                    <TrendingUp size={20} />
                  </div>
                  <span className={styles.floatingCardLabel}>Platform Growth</span>
                </div>
                <div className={styles.floatingCardValue}>1,200+</div>
                <div className={styles.floatingCardSub}>MicroJobs completed this semester</div>
              </div>

              <div className={styles.floatingCardRow}>
                <div className={styles.floatingCard}>
                  <div className={styles.floatingCardLabel} style={{ marginBottom: '8px' }}>Avg. Response</div>
                  <div className={styles.floatingCardValue} style={{ fontSize: '1.5rem' }}>2.4h</div>
                  <div className={styles.floatingCardSub}>Proposal received</div>
                </div>
                <div className={styles.floatingCard}>
                  <div className={styles.floatingCardLabel} style={{ marginBottom: '8px' }}>Rating</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className={styles.floatingCardValue} style={{ fontSize: '1.5rem' }}>4.9</div>
                    <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  </div>
                  <div className={styles.floatingCardSub}>Avg. freelancer rating</div>
                </div>
              </div>

              <div className={styles.floatingCard} style={{ background: 'rgba(29,192,113,0.12)', borderColor: 'rgba(29,192,113,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} style={{ color: '#1dc071' }} />
                  <div>
                    <div style={{ color: '#6ee7b7', fontSize: '0.875rem', fontWeight: 600 }}>100% DIU Verified</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: '2px' }}>Every account uses official DIU email</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ──────────────────────────────────────────────────── */}
      <section className={styles.statsBar} aria-label="Platform statistics">
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {statsList.map(({ value, label }) => (
              <div key={label} className={styles.statItem}>
                <div className={styles.statNumber}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────────────────────────── */}
      <section className={styles.categories} aria-label="Job Categories">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}>
              <Layers size={12} />
              Browse Categories
            </div>
            <h2>What do you need help with?</h2>
            <p>Explore jobs across every department and skill set at DIU.</p>
          </div>

          <div className={styles.categoryGrid}>
            {activeCategories.map(({ id, name, icon: Icon, color, count }) => (
              <div
                key={id}
                className={styles.categoryCard}
                style={{ '--card-color': color } as React.CSSProperties}
                onClick={() => router.push(`/jobs?category=${id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/jobs?category=${id}`); }}
              >
                <div className={styles.catIconWrap}>
                  <Icon size={22} />
                </div>
                <div className={styles.catName}>{name}</div>
                <div className={styles.catCount}>{count} jobs</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className={styles.howSection} aria-label="How it works">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}>
              <Zap size={12} />
              Simple Process
            </div>
            <h2>Get work done in 3 easy steps</h2>
            <p>Post a job, choose a freelancer, and get results — all within the DIU campus network.</p>
          </div>

          <div className={styles.howGrid}>
            {HOW_STEPS.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} className={styles.howCard} style={{ position: 'relative' }}>
                <div className={styles.howStepNum}>{step}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
                {i < HOW_STEPS.length - 1 && (
                  <ChevronRight size={20} className={styles.howConnector} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE BULLETS ────────────────────────────────────────────── */}
      <section className={styles.features} aria-label="Why DIU MicroJobs">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}><Award size={12} /> Why DIU MicroJobs</div>
            <h2>Built for the DIU community</h2>
            <p>No external platforms, no middlemen — just trusted peers doing great work.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)', marginTop: 'var(--space-12)' }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <Icon size={20} />
                </div>
                <h4 className={styles.featureCardTitle}>{title}</h4>
                <p className={styles.featureCardDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section className={styles.testimonials} aria-label="Testimonials">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}><Star size={12} /> Testimonials</div>
            <h2>Loved by the DIU Community</h2>
            <p>Real reviews from students, faculty, and departments.</p>
          </div>

          <div className={styles.testimonialGrid}>
            {activeTestimonials.map(({ text, author, role, rating, initials }) => (
              <div key={author} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className={styles.starFilled} fill="#f59e0b" />
                  ))}
                </div>
                <p className={styles.testimonialText}>"{text}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{initials}</div>
                  <div>
                    <div className={styles.testimonialName}>{author}</div>
                    <div className={styles.testimonialRole}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} aria-label="Call to action">
        <div className={styles.container}>
          <div className={styles.ctaInner}>
            <h2>Ready to join DIU's freelance economy?</h2>
            <p>
              Whether you're posting a job or looking for work, get started in 
              under 2 minutes with your official DIU email.
            </p>
            <div className={styles.ctaButtons}>
              {!firebaseUser ? (
                <>
                  <Link href="/register" className={styles.ctaPrimary}>
                    Create Free Account <ArrowRight size={16} />
                  </Link>
                  <Link href="/jobs" className={styles.ctaSecondary}>
                    Browse Open Jobs
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className={styles.ctaPrimary}>
                  Go to My Dashboard <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className={styles.ctaNote}>
              <ShieldCheck size={13} />
              Requires an official @diu.edu.bd or @s.diu.edu.bd email address
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
