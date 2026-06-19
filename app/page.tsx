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
  Briefcase, Layers, GraduationCap, Star, Zap,
  MessageSquare, Clock, Globe2, ChevronRight, ChevronDown,
  PenTool, Cpu, BookOpen,
  ClipboardList, Calendar, Truck,
  Video, Edit, Settings, Package, Film,
} from 'lucide-react';
import styles from './page.module.css';

const ACCENT_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const ICON_MAP: Record<string, any> = {
  // names as stored in MongoDB `icon` field
  code: Laptop,
  palette: Palette,
  camera: Camera,
  video: Video,
  'file-text': FileText,
  'pen-tool': PenTool,
  search: Search,
  book: BookOpen,
  cpu: Cpu,
  briefcase: Briefcase,
  clipboard: ClipboardList,
  calendar: Calendar,
  package: Package,
  edit: Edit,
  settings: Settings,
  film: Film,
  // legacy capitalised names (fallback)
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
  { id: 'web-app-dev',             name: 'Web & App Dev',            icon: Laptop,       color: '#3b82f6', count: '120+', subcategories: ['Portfolio Website Making', 'Landing Page Design', 'React / Next.js Development'] },
  { id: 'design',                  name: 'Design',                   icon: Palette,      color: '#ec4899', count: '85+', subcategories: ['Logo Design', 'Poster Design', 'UI/UX Design (Figma)'] },
  { id: 'photography',             name: 'Photography',              icon: Camera,       color: '#10b981', count: '60+', subcategories: ['Event Photography', 'Portrait Photography', 'Photo Editing & Retouching'] },
  { id: 'videography',             name: 'Videography',              icon: Video,        color: '#f97316', count: '40+', subcategories: ['Video Editing', 'Short-Form Content', 'Animation'] },
  { id: 'slides-docs',             name: 'Slides & Docs',            icon: FileText,     color: '#f59e0b', count: '94+', subcategories: ['PowerPoint Presentation', 'Google Slides', 'Pitch Deck Design'] },
  { id: 'research',                name: 'Research',                 icon: Search,       color: '#8b5cf6', count: '47+', subcategories: ['Literature Review', 'Survey Design', 'Data Collection'] },
  { id: 'tutoring',                name: 'Tutoring',                 icon: GraduationCap,color: '#06b6d4', count: '33+', subcategories: ['Math Tutoring', 'Programming Help', 'Physics Tutoring'] },
  { id: 'drawing-drafting',        name: 'Drawing & Drafting',       icon: PenTool,      color: '#14b8a6', count: '28+', subcategories: ['Architectural Drawing', 'AutoCAD Drafting', 'Floor Plan Design'] },
  { id: 'project-making',          name: 'Project Making',           icon: Cpu,          color: '#a855f7', count: '35+', subcategories: ['IoT Project', 'Arduino Project', 'DLD / Digital Circuit'] },
  { id: 'thesis-academic-writing', name: 'Thesis & Academic Writing',icon: BookOpen,     color: '#0ea5e9', count: '52+', subcategories: ['Thesis Writing Assistance', 'Research Paper Writing', 'Assignment Writing'] },
  { id: 'assignment-lab-help',     name: 'Assignment & Lab Help',    icon: ClipboardList,color: '#84cc16', count: '44+', subcategories: ['Programming Assignment Help', 'Math Assignments', 'Lab Report Help'] },
  { id: 'career-resume-prep',      name: 'Career & Resume Prep',     icon: Briefcase,    color: '#f43f5e', count: '38+', subcategories: ['CV Making', 'Resume Making', 'LinkedIn Profile Optimization'] },
  { id: 'content-writing',         name: 'Content Writing',          icon: Edit,         color: '#fb923c', count: '29+', subcategories: ['Blog / Article Writing', 'Social Media Content', 'Copywriting'] },
  { id: 'event-campus-support',    name: 'Event & Campus Support',   icon: Calendar,     color: '#22d3ee', count: '21+', subcategories: ['Event Host / MC', 'Event Planning', 'Live Streaming Setup'] },
  { id: 'campus-errands-delivery', name: 'Campus Errands & Delivery',icon: Truck,        color: '#4ade80', count: '18+', subcategories: ['Document Printing', 'Campus Food Delivery', 'Library Book Pickup'] },
  { id: 'tech-digital-services',   name: 'Tech & Digital Services',  icon: Settings,     color: '#818cf8', count: '45+', subcategories: ['Laptop Setup', 'OS Installation', 'AI Automation'] },
];

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

const FAQS = [
  {
    q: "Who can register on DIU MicroJobs?",
    a: "Only active students, faculty members, departments, and alumni of Daffodil International University can register. A verified @diu.edu.bd or @s.diu.edu.bd email address is strictly required."
  },
  {
    q: "How do payments work?",
    a: "All transactions are priced in BDT. Clients and freelancers agree on a budget and project terms directly. There are zero platform fees or middleman charges."
  },
  {
    q: "What kind of tasks can I post?",
    a: "Any campus-related task! From software development, UI/UX design, and presentation slides to event photography, videography, tutoring, and library book pickups."
  },
  {
    q: "How does verification work?",
    a: "We verify every account using DIU's official Google Workspace email verification. This ensures zero fake profiles and a highly secure campus marketplace."
  }
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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    registeredStudents: '500+',
    completedJobs: '1,200+',
    satisfactionRate: '98%',
    departmentsCount: '15+',
  });
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
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

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    const handleHashScroll = () => {
      if (!window.location.hash) return;
      const id = decodeURIComponent(window.location.hash.replace('#', ''));
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Delay slightly to allow full browser layout calculations after mounting
    const timer = setTimeout(handleHashScroll, 100);

    // Listen for hash changes dynamically (e.g. clicking the nav link while on the home page)
    window.addEventListener('hashchange', handleHashScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, [isMounted]);

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
        id: (cat as any).slug || cat._id,
        name: cat.name,
        icon: getCategoryIcon(cat.icon),
        color: ACCENT_COLORS[idx % ACCENT_COLORS.length],
        count: `${(cat as any).jobCount || 0}+`,
        subcategories: (cat as any).subcategories || [],
      }))
    : CATEGORIES;

  const displayedCategories = showAllCategories
    ? activeCategories
    : activeCategories.slice(0, 8);

  const activeTestimonials = testimonials.length > 0
    ? testimonials
    : TESTIMONIALS;

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Navbar user={navbarUser} onLogout={logout} />

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className={styles.hero} aria-label="Hero">
        <div className={styles.heroBgImage} />
        <div className={styles.heroBgOverlay} />
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
                {['CV Making', 'Resume Making', 'Portfolio Website', 'Logo Design', 'Video Editing'].map((t) => (
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

            {/* Right — Hero Image and Floating Stats */}
            <div className={styles.heroRight}>
              <div className={styles.heroImageWrapper}>
                <img
                  src="/images/campus_freelance_hero.png"
                  alt="Diu MicroJobs Student Freelancing"
                  className={styles.heroImage}
                />
                <div className={styles.heroOverlayGradient} />
              </div>

              {/* Floating stats card 1 */}
              <div className={`${styles.floatingCard} ${styles.floatCard1}`}>
                <div className={styles.floatingCardTop}>
                  <div className={styles.floatingCardIcon}>
                    <TrendingUp size={20} />
                  </div>
                  <span className={styles.floatingCardLabel}>Completed Jobs</span>
                </div>
                <div className={styles.floatingCardValue}>1,200+</div>
                <div className={styles.floatingCardSub}>Student tasks completed this semester</div>
              </div>

              {/* Floating stats card 2 */}
              <div className={`${styles.floatingCard} ${styles.floatCard2}`}>
                <div className={styles.floatingCardTop}>
                  <div className={styles.floatingCardIcon} style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    <Star size={20} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                  </div>
                  <span className={styles.floatingCardLabel}>Rating</span>
                </div>
                <div className={styles.floatingCardValue} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  4.9 <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}>/ 5.0</span>
                </div>
                <div className={styles.floatingCardSub}>Average student review</div>
              </div>

              {/* Floating stats card 3 */}
              <div className={`${styles.floatingCard} ${styles.floatCard3}`} style={{ background: 'rgba(29,192,113,0.12)', borderColor: 'rgba(29,192,113,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} style={{ color: '#1dc071' }} />
                  <div>
                    <div style={{ color: '#6ee7b7', fontSize: '0.8125rem', fontWeight: 600 }}>100% DIU Verified</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6875rem', marginTop: '2px' }}>Exclusively for Daffodil Students</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BRAND TRUST BAR ────────────────────────────────────────────── */}
      <section className={styles.brandBar} aria-label="Campus trust partners">
        <div className={styles.container}>
          <div className={styles.brandBarInner}>
            <span className={styles.brandTrustLabel}>Trusted by campus groups:</span>
            <div className={styles.brandLogos}>
              <div className={styles.brandLogo}>DIU CSE Department</div>
              <div className={styles.brandLogo}>DIU Business Club</div>
              <div className={styles.brandLogo}>SWE Association</div>
              <div className={styles.brandLogo}>DIU Robotics Club</div>
              <div className={styles.brandLogo}>IEEE Student Branch</div>
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
            {displayedCategories.map(({ id, name, icon: Icon, color, count, subcategories }) => (
              <div
                key={id}
                className={styles.categoryCard}
                style={{ '--card-color': color } as React.CSSProperties}
                onClick={() => router.push(`/jobs?category=${id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/jobs?category=${id}`); }}
              >
                <div className={styles.catHeader}>
                  <div className={styles.catIconWrap}>
                    <Icon size={18} />
                  </div>
                  <div className={styles.catName}>{name}</div>
                </div>
                
                {subcategories && subcategories.length > 0 && (
                  <div className={styles.catSubList}>
                    {subcategories.slice(0, 4).map((sub: string) => (
                      <span
                        key={sub}
                        className={styles.catSubItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/jobs?category=${id}&subcategory=${encodeURIComponent(sub)}`);
                        }}
                      >
                        <ChevronRight size={12} className={styles.catSubChevron} />
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className={styles.catCount}>{count} jobs</div>
              </div>
            ))}
          </div>

          {activeCategories.length > 8 && (
            <div className={styles.moreCategoriesWrap}>
              <button
                className={styles.moreCategoriesBtn}
                onClick={() => setShowAllCategories((prev) => !prev)}
                aria-expanded={showAllCategories}
              >
                {showAllCategories ? 'Show Less' : 'Show More'}
                <ChevronDown
                  size={16}
                  style={{
                    transform: showAllCategories ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className={styles.howSection} aria-label="How it works">
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

      {/* ─── FAQ SECTION ────────────────────────────────────────────────── */}
      <section className={styles.faqSection} aria-label="Frequently Asked Questions">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}><MessageSquare size={12} /> FAQ</div>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about DIU MicroJobs platform.</p>
          </div>

          <div className={styles.faqGrid}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div className={styles.faqQuestion}>
                    <h4>{faq.q}</h4>
                    <ChevronRight
                      size={18}
                      className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                    />
                  </div>
                  <div className={styles.faqAnswer}>
                    <p>{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} aria-label="Call to action">
        <div className={styles.ctaBgImage} />
        <div className={styles.ctaBgOverlay} />
        <div className={styles.container}>
          <div className={styles.ctaHeaderSection}>
            <h2>Ready to join DIU's freelance economy?</h2>
            <p>Select your path and get started in under 2 minutes with your official DIU email.</p>
          </div>

          <div className={styles.ctaSplitGrid}>
            {/* Card 1: For Clients */}
            <div className={styles.ctaSplitCard}>
              <div className={styles.ctaCardBadge}>For Clients</div>
              <h3>Hire verified student talent</h3>
              <p>Post your project, receive proposals from skilled students, review portfolios, and pay securely in BDT.</p>
              <div className={styles.ctaCardBenefits}>
                <span className={styles.ctaBenefit}><ShieldCheck size={14} /> 100% DIU Email Verified</span>
                <span className={styles.ctaBenefit}><ShieldCheck size={14} /> BDT Pricing & Secure deals</span>
              </div>
              <Link href={firebaseUser ? "/jobs/create" : "/register"} className={styles.ctaCardBtn}>
                Post a MicroJob <ArrowRight size={16} />
              </Link>
            </div>

            {/* Card 2: For Freelancers */}
            <div className={`${styles.ctaSplitCard} ${styles.ctaSplitCardFreelancer}`}>
              <div className={styles.ctaCardBadge} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>For Students</div>
              <h3>Earn money doing campus tasks</h3>
              <p>Create your portfolio, apply to open jobs, collaborate with clients, and grow your campus freelance reputation.</p>
              <div className={styles.ctaCardBenefits}>
                <span className={styles.ctaBenefit}><ShieldCheck size={14} style={{ color: '#60a5fa' }} /> Keep 100% of your earnings</span>
                <span className={styles.ctaBenefit}><ShieldCheck size={14} style={{ color: '#60a5fa' }} /> Build your final-year portfolio</span>
              </div>
              <Link href={firebaseUser ? "/jobs" : "/register"} className={`${styles.ctaCardBtn} ${styles.ctaCardBtnSecondary}`}>
                Find Freelance Work <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className={styles.ctaNote}>
            <ShieldCheck size={13} />
            Requires an official @diu.edu.bd or @s.diu.edu.bd email address
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
