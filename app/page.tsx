'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
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

/* ─── Framer Motion Variants ────────────────────────────────────────────────────────── */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  }
};

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.96, 
    filter: "blur(6px)", 
    willChange: "transform, opacity, filter" 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: { 
      type: "spring", 
      stiffness: 90, 
      damping: 18, 
      mass: 0.8 
    }
  }
};

const heroContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 120, damping: 20 }
  }
};

const heroTitleVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03
    }
  }
};

const titleWordVariants: Variants = {
  hidden: { y: "115%", rotate: 2 },
  visible: {
    y: 0,
    rotate: 0,
    transition: { type: "spring", stiffness: 100, damping: 16, mass: 0.7 }
  }
};


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

const CLIENT_STEPS = [
  {
    step: '01',
    title: 'Post Your Gig Requirements',
    desc: 'Define your task, specify a BDT budget range, and select a target delivery date. Takes under 2 minutes.',
    icon: Zap,
  },
  {
    step: '02',
    title: 'Review Student Proposals',
    desc: 'Skilled university freelancers submit personalized cover letters and custom bids.',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: 'Approve & Release Escrow',
    desc: 'Sign a secure digital contract. Funds are held safely in escrow and only released when you verify the work.',
    icon: Award,
  },
];

const FREELANCER_STEPS = [
  {
    step: '01',
    title: 'Browse Available Gigs',
    desc: 'Filter tasks by category, skills required, or budget to find gigs matching your expertise.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Submit Your Best Proposal',
    desc: 'Write a quick pitch, attach portfolio links, and bid your price. Chat directly with the client.',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: 'Complete Work & Get Paid',
    desc: 'Deliver project files, get your submission approved, and receive contract payouts directly in BDT.',
    icon: TrendingUp,
  },
];

const SHOWCASE_UNIVERSITIES = [
  {
    name: 'Dhaka University',
    shortName: 'DU',
    domains: 'du.ac.bd',
    bgLogo: '🎓',
    color: '#06b6d4',
    students: '1.2k+',
    gigs: '450+',
  },
  {
    name: 'Bangladesh University of Engineering and Technology',
    shortName: 'BUET',
    domains: 'buet.ac.bd',
    bgLogo: '🛠️',
    color: '#3b82f6',
    students: '900+',
    gigs: '380+',
  },
  {
    name: 'Daffodil International University',
    shortName: 'DIU',
    domains: 'diu.edu.bd',
    bgLogo: '🏫',
    color: '#10b981',
    students: '2.4k+',
    gigs: '820+',
  },
  {
    name: 'North South University',
    shortName: 'NSU',
    domains: 'northsouth.edu',
    bgLogo: '🌐',
    color: '#f59e0b',
    students: '1.5k+',
    gigs: '540+',
  },
  {
    name: 'BRAC University',
    shortName: 'BRACU',
    domains: 'g.bracu.ac.bd',
    bgLogo: '📚',
    color: '#ec4899',
    students: '1.1k+',
    gigs: '390+',
  },
];

const TESTIMONIALS = [
  {
    text: "Got my final-year project presentation slides done in 24 hours. Absolutely stunning quality. Will hire again!",
    author: 'Md. Rafiqul Islam',
    role: 'CSE Faculty',
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
    author: 'Business Club',
    role: 'Department Client',
    rating: 5,
    initials: 'BC',
  },
] as const;

const FAQS = [
  {
    q: "Who can register on Microjobs?",
    a: "Only active students, faculty members, departments, and alumni of registered universities can register. A verified official university email address is strictly required."
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
    a: "We verify every account using your university's official email domain. This ensures zero fake profiles and a highly secure campus marketplace."
  }
] as const;

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'University Email Verified',
    desc: 'All accounts require an official university email domain — zero fake profiles.',
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
  const [howToggle, setHowToggle] = useState<'client' | 'freelancer'>('client');

  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    registeredStudents: '500+',
    completedJobs: '1,200+',
    satisfactionRate: '98%',
    departmentsCount: '15+',
  });
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [showcaseUniversities, setShowcaseUniversities] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    async function loadData() {
      try {
        const [catRes, statsRes, testRes, uniRes] = await Promise.all([
          apiClient<{ categories: any[] }>('/api/categories'),
          apiClient<any>('/api/public/stats'),
          apiClient<{ reviews: any[] }>('/api/public/testimonials'),
          apiClient<{ universities: any[] }>('/api/public/universities')
        ]);

        if (catRes.data) setCategories(catRes.data.categories);
        if (statsRes.data) setStats(statsRes.data);
        if (testRes.data) setTestimonials(testRes.data.reviews);
        if (uniRes.data) setShowcaseUniversities(uniRes.data.universities);
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

  // IntersectionObserver removed in favor of Framer Motion whileInView

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



  return (
    <div className={styles.wrapper}>
      <Navbar user={navbarUser} onLogout={logout} />

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className={styles.hero} aria-label="Hero">
        <div className={styles.heroBgImage} />
        <div className={styles.heroBgOverlay} />
        <div className={styles.container}>
          <motion.div 
            className={styles.heroCentered}
            initial="hidden"
            animate="visible"
            variants={heroContainerVariants}
          >
            <motion.div className={styles.heroBadge} variants={heroItemVariants}>
              <span className={styles.badgeDot} />
              Exclusively for University Students
            </motion.div>

            <motion.h1 className={styles.heroTitle} variants={heroTitleVariants}>
              <div style={{ display: "block" }}>
                {[
                  { text: "Find", highlight: false },
                  { text: "Trusted", highlight: false },
                  { text: "Campus Talent", highlight: true }
                ].map((part, partIdx) => {
                  const words = part.text.split(" ");
                  return words.map((word, wordIdx) => (
                    <span key={`l1-${partIdx}-${wordIdx}`} className={styles.wordMask} style={{ marginRight: "0.22em" }}>
                      <motion.span
                        className={part.highlight ? styles.heroTitleHighlight : undefined}
                        style={{ display: "inline-block" }}
                        variants={titleWordVariants}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ));
                })}
              </div>
              <div style={{ display: "block" }}>
                {[
                  { text: "For", highlight: false },
                  { text: "Any", highlight: false },
                  { text: "Project.", highlight: false }
                ].map((part, partIdx) => {
                  const words = part.text.split(" ");
                  return words.map((word, wordIdx) => (
                    <span key={`l2-${partIdx}-${wordIdx}`} className={styles.wordMask} style={{ marginRight: "0.22em" }}>
                      <motion.span
                        className={part.highlight ? styles.heroTitleHighlight : undefined}
                        style={{ display: "inline-block" }}
                        variants={titleWordVariants}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ));
                })}
              </div>
            </motion.h1>

            <motion.p className={styles.heroSubtitle} variants={heroItemVariants}>
              Join the elite network of university freelancers. Get top-tier development, design, and writing done quickly by verified students.
            </motion.p>

            {/* Centered Search */}
            <motion.div className={styles.heroSearchCentered} variants={heroItemVariants}>
              <div className={styles.heroSearchInputWrap}>
                <Search className={styles.heroSearchIcon} size={20} />
                <input
                  className={styles.heroSearchInput}
                  type="text"
                  placeholder='Try "logo design", "website", or "video editing"…'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button className={styles.heroSearchBtn} onClick={handleSearch}>
                Search Talent
              </button>
            </motion.div>

            <motion.div className={styles.searchTagsCentered} variants={heroItemVariants}>
              <span className={styles.searchTagLabel}>Popular:</span>
              {['Website Dev', 'UI/UX Design', 'Video Editing', 'Thesis Help'].map((t) => (
                <button
                  key={t}
                  className={styles.searchTag}
                  onClick={() => { setSearchQuery(t); router.push(`/jobs?search=${encodeURIComponent(t)}`); }}
                >
                  {t}
                </button>
              ))}
            </motion.div>
            
            {/* Embedded Trust Stats */}
            <motion.div className={styles.heroTrustStats} variants={heroItemVariants}>
              <div className={styles.trustStat}>
                <strong>{stats?.completedJobs || '1,200+'}</strong>
                <span>Jobs Done</span>
              </div>
              <div className={styles.trustStatDivider} />
              <div className={styles.trustStat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <strong>{stats?.avgRating || '4.9'}/5</strong>
                </div>
                <span>Avg Rating</span>
              </div>
              <div className={styles.trustStatDivider} />
              <div className={styles.trustStat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <ShieldCheck size={16} color="#1dc071" />
                  <strong>100%</strong>
                </div>
                <span>Verified Students</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* ─── UNIVERSITY SHOWCASE ────────────────────────────────────────── */}
      <motion.section 
        className={styles.uniShowcase} 
        aria-label="Supported Universities"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}>
              <GraduationCap size={12} />
              Connected Campus Network
            </div>
            <h2>Active Student Communities</h2>
            <p>Collaborate with verified students and faculty across leading universities in Bangladesh.</p>
          </div>

          <div className={styles.uniMarquee}>
            <div className={styles.uniMarqueeTrack}>
              {[...Array(2)].map((_, groupIdx) => (
                <div key={`group-${groupIdx}`} className={styles.uniMarqueeGroup}>
                  {(showcaseUniversities.length > 0 ? showcaseUniversities : SHOWCASE_UNIVERSITIES).map((uni, idx) => {
                    const domainsStr = Array.isArray(uni.domains) ? uni.domains[0] : uni.domains;
                    const colorDisplay = uni.color || ACCENT_COLORS[idx % ACCENT_COLORS.length];

                    // Compute initials from shortName or full name fallback
                    const initials = uni.shortName || uni.name.split(' ').map((n: string) => n[0]).join('').slice(0, 3);
                    const initialsFontSize = initials.length > 3 ? '9px' : '11px';

                    const logoDisplay = uni.logo ? (
                      <img src={uni.logo} alt={uni.shortName} className={styles.uniLogoImage} />
                    ) : (
                      <div 
                        className={styles.uniLogoInitials} 
                        style={{ 
                          background: `linear-gradient(135deg, ${colorDisplay}, ${colorDisplay}cc)`,
                          fontSize: initialsFontSize
                        }}
                      >
                        {initials}
                      </div>
                    );

                    return (
                      <motion.div 
                        key={uni.shortName || uni._id} 
                        className={styles.uniPill}
                        style={{ 
                          '--uni-color': colorDisplay,
                          '--uni-color-light': `${colorDisplay}10`,
                          '--uni-color-border': `${colorDisplay}25`
                        } as React.CSSProperties}
                        variants={cardVariants}
                        whileHover={{ 
                          y: -4, 
                          scale: 1.02,
                          transition: { type: "spring", stiffness: 300, damping: 20 }
                        }}
                        whileTap={{ scale: 0.985 }}
                      >
                        <div className={styles.uniLogoBox}>
                          {logoDisplay}
                        </div>
                        <div className={styles.uniIdentity}>
                          <h4 title={uni.name}>{uni.shortName || uni.name}</h4>
                          <span className={styles.uniDomain}>@{domainsStr}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── CATEGORIES ─────────────────────────────────────────────────── */}
      <motion.section 
        className={styles.categories} 
        aria-label="Job Categories"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}>
              <Layers size={12} />
              Browse Categories
            </div>
            <h2>What do you need help with?</h2>
            <p>Explore jobs across every department and skill set at your university.</p>
          </div>

          <div className={styles.categoryGrid}>
            {displayedCategories.map(({ id, name, icon: Icon, color, count, subcategories }, idx) => (
              <motion.div
                key={id}
                className={styles.categoryCard}
                style={{ '--card-color': color } as React.CSSProperties}
                variants={cardVariants}
                whileHover={{ 
                  y: -6, 
                  scale: 1.015,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.985 }}
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
              </motion.div>
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
      </motion.section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <motion.section 
        id="how-it-works" 
        className={styles.howSection} 
        aria-label="How it works"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}>
              <Zap size={12} />
              Simple Process
            </div>
            <h2>Get work done in 3 easy steps</h2>
            <p>Choose your pathway to get started on the campus network.</p>

            <div className={styles.howToggleWrapper}>
              <div 
                className={styles.howToggleSlider} 
                style={{
                  transform: howToggle === 'client' ? 'translateX(0)' : 'translateX(100%)',
                }}
              />
              <button
                className={`${styles.howToggleButton} ${howToggle === 'client' ? styles.howToggleActive : ''}`}
                onClick={() => setHowToggle('client')}
              >
                Hire Student Talent
              </button>
              <button
                className={`${styles.howToggleButton} ${howToggle === 'freelancer' ? styles.howToggleActive : ''}`}
                onClick={() => setHowToggle('freelancer')}
              >
                Earn on Campus
              </button>
            </div>
          </div>

          <div className={styles.howGrid}>
            {(howToggle === 'client' ? CLIENT_STEPS : FREELANCER_STEPS).map(({ step, title, desc, icon: Icon }, i) => (
              <motion.div 
                key={step} 
                className={styles.howCard}
                variants={cardVariants}
                whileHover={{ 
                  y: -6, 
                  scale: 1.015,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.985 }}
              >
                <div className={styles.howCardTop}>
                  <div className={styles.howStepNum}>{step}</div>
                  <div className={styles.howIconBox}>
                    <Icon size={22} />
                  </div>
                </div>
                <h4>{title}</h4>
                <p>{desc}</p>
                {i < 2 && (
                  <ChevronRight size={20} className={styles.howConnector} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── FEATURE BULLETS ────────────────────────────────────────────── */}
      <motion.section 
        className={styles.featuresDark} 
        aria-label="Why Microjobs"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}><Award size={12} /> Why Microjobs</div>
            <h2>Built for the campus community</h2>
            <p>No external platforms, no middlemen — just trusted peers doing great work.</p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div 
                key={title} 
                className={styles.featureCard}
                variants={cardVariants}
                whileHover={{ 
                  y: -6, 
                  scale: 1.015,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.985 }}
              >
                <div className={styles.featureCardIcon}>
                  <Icon size={20} />
                </div>
                <h4 className={styles.featureCardTitle}>{title}</h4>
                <p className={styles.featureCardDesc}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────────────── */}
      <motion.section 
        className={styles.testimonials} 
        aria-label="Testimonials"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}><Star size={12} /> Testimonials</div>
            <h2>Loved by the Campus Community</h2>
            <p>Real reviews from students, faculty, and departments.</p>
          </div>

          <div className={styles.testimonialGrid}>
            {activeTestimonials.map(({ text, author, role, rating, initials }, idx) => (
              <motion.div 
                key={author} 
                className={styles.testimonialCard}
                variants={cardVariants}
                whileHover={{ 
                  y: -6, 
                  scale: 1.015,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.985 }}
              >
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
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── FAQ SECTION ────────────────────────────────────────────────── */}
      <motion.section 
        className={styles.faqSection} 
        aria-label="Frequently Asked Questions"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}><MessageSquare size={12} /> FAQ</div>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about Microjobs platform.</p>
          </div>

          <div className={styles.faqGrid}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <motion.div
                  key={idx}
                  className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
                  variants={cardVariants}
                  whileHover={{ 
                    scale: 1.005,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  whileTap={{ scale: 0.995 }}
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
                    <div className={styles.faqAnswerInner}>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <motion.section 
        className={styles.ctaSection} 
        aria-label="Call to action"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.ctaBgImage} />
        <div className={styles.ctaBgOverlay} />
        <div className={styles.container}>
          <div className={styles.ctaHeaderSection}>
            <h2>Ready to join the campus freelance economy?</h2>
            <p>Select your path and get started in under 2 minutes with your official university email.</p>
          </div>

          <div className={styles.ctaSplitGrid}>
            {/* Card 1: For Clients */}
            <motion.div 
              className={styles.ctaSplitCard}
              variants={cardVariants}
              whileHover={{ 
                y: -6, 
                scale: 1.015,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              whileTap={{ scale: 0.985 }}
            >
              <div className={styles.ctaCardBadge}>For Clients</div>
              <h3>Hire verified student talent</h3>
              <p>Post your project, receive proposals from skilled students, review portfolios, and pay securely in BDT.</p>
              <div className={styles.ctaCardBenefits}>
                <span className={styles.ctaBenefit}><ShieldCheck size={14} /> 100% University Verified</span>
                <span className={styles.ctaBenefit}><ShieldCheck size={14} /> BDT Pricing & Secure deals</span>
              </div>
              <Link href={firebaseUser ? "/jobs/create" : "/register"} className={styles.ctaCardBtn}>
                Post a MicroJob <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Card 2: For Freelancers */}
            <motion.div 
              className={`${styles.ctaSplitCard} ${styles.ctaSplitCardFreelancer}`}
              variants={cardVariants}
              whileHover={{ 
                y: -6, 
                scale: 1.015,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              whileTap={{ scale: 0.985 }}
            >
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
            </motion.div>
          </div>
          
          <div className={styles.ctaNote}>
            <ShieldCheck size={13} />
            Requires a verified official university email address
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
