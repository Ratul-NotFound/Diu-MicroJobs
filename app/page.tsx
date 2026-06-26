'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, Variants, AnimatePresence } from 'framer-motion';
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
  { id: 'web-app-dev',             name: 'Web & App Dev',            icon: Laptop,       color: '#3b82f6', count: '0+', bgImage: '/images/gig_web.png', subcategories: ['Portfolio Website Making', 'Landing Page Design', 'Full-Stack Web App', 'React / Next.js Development'] },
  { id: 'design',                  name: 'Design',                   icon: Palette,      color: '#ec4899', count: '1+', bgImage: '/images/gig_design.png', subcategories: ['Logo Design', 'Poster Design', 'Banner / Social Media Graphics', 'Flyer & Brochure Design'] },
  { id: 'photography',             name: 'Photography',              icon: Camera,       color: '#10b981', count: '0+', bgImage: '/images/gig_photo.png', subcategories: ['Event Photography', 'Portrait Photography', 'Product Photography', 'Photo Editing & Retouching'] },
  { id: 'videography',             name: 'Videography',              icon: Video,        color: '#f97316', count: '0+', bgImage: '/images/gig_video.png', subcategories: ['Videography (Event)', 'Video Editing', 'Short-Form Content (Reels/TikTok)', 'YouTube Video Editing'] },
  { id: 'slides-docs',             name: 'Slides & Docs',            icon: Briefcase,     color: '#f59e0b', count: '1+', bgImage: '/images/gig_slides.png', subcategories: ['PowerPoint Presentation', 'Google Slides', 'Pitch Deck Design', 'Lab Report Writing'] },
  { id: 'research',                name: 'Research',                 icon: Search,       color: '#8b5cf6', count: '0+', bgImage: '/images/gig_research.png', subcategories: ['Literature Review', 'Survey Design & Analysis', 'Data Collection', 'Statistical Analysis (SPSS / R)'] },
  { id: 'tutoring',                name: 'Tutoring',                 icon: GraduationCap,color: '#06b6d4', count: '0+', bgImage: '/images/gig_tutoring.png', subcategories: ['Math Tutoring', 'Programming Help', 'Physics / Chemistry Tutoring', 'English Language Coaching'] },
  { id: 'drawing-drafting',        name: 'Drawing & Drafting',       icon: PenTool,      color: '#14b8a6', count: '0+', bgImage: '/images/gig_drafting.png', subcategories: ['Architectural Drawing', 'AutoCAD Drafting', 'Floor Plan Design', '3D Modeling (SketchUp / Blender)'] },
  { id: 'project-making',          name: 'Project Making',           icon: Cpu,          color: '#a855f7', count: '0+', bgImage: '/images/gig_project.png', subcategories: ['IoT Project', 'Arduino / Raspberry Pi Project', 'DLD / Digital Circuit Project', 'Microcontroller Programming'] },
  { id: 'thesis-academic-writing', name: 'Thesis & Academic Writing',icon: BookOpen,     color: '#0ea5e9', count: '0+', bgImage: '/images/gig_thesis.png', subcategories: ['Thesis Writing Assistance', 'Research Paper Writing', 'Assignment Writing', 'Report Writing'] },
  { id: 'assignment-lab-help',     name: 'Assignment & Lab Help',    icon: ClipboardList,color: '#84cc16', count: '0+', bgImage: '/images/gig_assignment.png', subcategories: ['Programming Assignment Help', 'Math / Statistics Assignments', 'Lab Report Help', 'Simulation Lab Work'] },
  { id: 'career-resume-prep',      name: 'Career & Resume Prep',     icon: Briefcase,    color: '#f43f5e', count: '0+', bgImage: '/images/gig_career.png', subcategories: ['CV Making', 'Resume Making', 'LinkedIn Profile Optimization', 'Cover Letter Writing'] },
  { id: 'content-writing',         name: 'Content Writing',          icon: Edit,         color: '#fb923c', count: '0+', bgImage: '/images/gig_writing.png', subcategories: ['Blog / Article Writing', 'Social Media Content', 'Copywriting', 'SEO Content Writing'] },
  { id: 'event-campus-support',    name: 'Event & Campus Support',   icon: Calendar,     color: '#22d3ee', count: '0+', bgImage: '/images/gig_event.png', subcategories: ['Event Host / MC', 'Event Planning', 'Live Streaming Setup', 'Stage Management'] },
  { id: 'campus-errands-delivery', name: 'Campus Errands & Delivery',icon: Truck,        color: '#4ade80', count: '0+', bgImage: '/images/gig_delivery.png', subcategories: ['Document Printing', 'Campus Food Delivery', 'Library Book Pickup', 'On-Campus Courier'] },
  { id: 'tech-digital-services',   name: 'Tech & Digital Services',  icon: Settings,     color: '#818cf8', count: '0+', bgImage: '/images/gig_tech.png', subcategories: ['Laptop Setup', 'OS Installation', 'AI Automation', 'Data Backup & Recovery'] },
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

const POPULAR_GIGS = [
  {
    id: 'gig-1',
    title: "Develop Responsive Portfolio Website in React / Next.js",
    price: "BDT 3,000",
    rating: "4.9",
    reviews: 18,
    category: "Web & App Dev",
    thumbnail: "/images/gig_web.png",
    freelancer: { name: "Anisur Rahman", dept: "CSE, DIU", initials: "AR" },
    tag: "Best Seller"
  },
  {
    id: 'gig-2',
    title: "Professional Club Logo, Banner & UI/UX Design",
    price: "BDT 1,500",
    rating: "5.0",
    reviews: 12,
    category: "Design",
    thumbnail: "/images/gig_design.png",
    freelancer: { name: "Nusrat Jahan", dept: "SWE, DIU", initials: "NJ" },
    tag: "Popular"
  },
  {
    id: 'gig-3',
    title: "Academic Presentation Slides & Pitch Deck Design",
    price: "BDT 800",
    rating: "4.8",
    reviews: 32,
    category: "Slides & Docs",
    thumbnail: "/images/gig_slides.png",
    freelancer: { name: "Tanvir Ahmed", dept: "BBA, DU", initials: "TA" }
  },
  {
    id: 'gig-4',
    title: "Campus Event Photography & Professional Retouching",
    price: "BDT 2,500",
    rating: "5.0",
    reviews: 9,
    category: "Photography",
    thumbnail: "/images/gig_photo.png",
    freelancer: { name: "Sajid Hasan", dept: "EEE, BUET", initials: "SH" },
    tag: "Trending"
  }
];

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



const HERO_IMAGES = [
  '/images/diu_campus_bg.jpg',
  '/images/gig_web.png',
  '/images/gig_design.png',
  '/images/gig_photo.png',
  '/images/gig_video.png',
  '/images/gig_slides.png',
  '/images/gig_drafting.png',
  '/images/gig_tutoring.png',
  '/images/gig_research.png',
  '/images/gig_assignment.png',
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Home() {
  const router = useRouter();
  const { firebaseUser, userProfile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImageIdx, setHeroImageIdx] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 7000); // Cycle every 7 seconds
    return () => clearInterval(timer);
  }, []);

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

  const activeCategories = [
    ...CATEGORIES.map((staticCat, idx) => {
      const dbCat = categories.find(
        (c) => c.slug === staticCat.id || c.name.toLowerCase() === staticCat.name.toLowerCase()
      );

      return {
        id: staticCat.id,
        name: staticCat.name,
        icon: dbCat ? getCategoryIcon(dbCat.icon) : staticCat.icon,
        color: staticCat.color || ACCENT_COLORS[idx % ACCENT_COLORS.length],
        count: dbCat ? `${dbCat.jobCount || 0}+` : staticCat.count,
        subcategories: dbCat && dbCat.subcategories?.length > 0 ? dbCat.subcategories : staticCat.subcategories,
        bgImage: staticCat.bgImage,
      };
    }),
    ...categories
      .filter(
        (dbCat) =>
          !CATEGORIES.some(
            (staticCat) =>
              staticCat.id === dbCat.slug || staticCat.name.toLowerCase() === dbCat.name.toLowerCase()
          )
      )
      .map((dbCat, idx) => ({
        id: dbCat.slug || dbCat._id,
        name: dbCat.name,
        icon: getCategoryIcon(dbCat.icon),
        color: ACCENT_COLORS[(CATEGORIES.length + idx) % ACCENT_COLORS.length],
        count: `${dbCat.jobCount || 0}+`,
        subcategories: dbCat.subcategories || [],
        bgImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=60',
      })),
  ];

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
        {/* Cinematic cycling background images */}
        <div className={styles.heroBgSlideshow}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={heroImageIdx}
              className={styles.heroSlideImage}
              style={{ backgroundImage: `url(${HERO_IMAGES[heroImageIdx]})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          </AnimatePresence>
        </div>

        <div className={styles.heroBgOverlay} />

        {/* Living, floating ambient glowing blobs */}
        <div className={styles.heroGlowContainer}>
          <motion.div 
            className={`${styles.glowBlob} ${styles.glowGreen}`}
            animate={{
              x: [0, 45, -25, 0],
              y: [0, -60, 40, 0],
              scale: [1, 1.15, 0.9, 1]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className={`${styles.glowBlob} ${styles.glowBlue}`}
            animate={{
              x: [0, -50, 35, 0],
              y: [0, 50, -45, 0],
              scale: [1, 0.85, 1.15, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className={`${styles.glowBlob} ${styles.glowCyan}`}
            animate={{
              x: [0, 30, -35, 0],
              y: [0, 35, 55, 0],
              scale: [1, 1.1, 0.95, 1]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

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

            {/* Marketplace CTA Buttons */}
            <motion.div className={styles.heroCtaButtons} variants={heroItemVariants}>
              <Link href={firebaseUser ? "/jobs/create" : "/register"} className={styles.heroBtnPrimary}>
                Post a Project
              </Link>
              <Link href={firebaseUser ? "/jobs" : "/register"} className={styles.heroBtnSecondary}>
                Earn Money Freelancing
              </Link>
            </motion.div>

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

            {/* Trusted by Campus Clubs */}
            <motion.div className={styles.heroPartnerLogos} variants={heroItemVariants}>
              <span className={styles.partnerLabel}>Trusted by:</span>
              <span className={styles.partnerLogo}>DIU Computer Club</span>
              <span className={styles.partnerLogo}>BUET Robotics Society</span>
              <span className={styles.partnerLogo}>DU Debating Club</span>
              <span className={styles.partnerLogo}>NSU Business Club</span>
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

          <div className={styles.uniGrid}>
            {(showcaseUniversities.length > 0 ? showcaseUniversities : SHOWCASE_UNIVERSITIES).map((uni, idx) => {
              const domainsStr = Array.isArray(uni.domains) ? uni.domains[0] : uni.domains;
              const colorDisplay = uni.color || ACCENT_COLORS[idx % ACCENT_COLORS.length];

              // Compute initials from shortName or full name fallback
              const initials = uni.shortName || uni.name.split(' ').map((n: string) => n[0]).join('').slice(0, 3);
              const initialsFontSize = initials.length > 3 ? '10px' : '12px';

              const logoDisplay = uni.logo ? (
                <img src={uni.logo} alt={uni.shortName} className={styles.uniLogoImage} />
              ) : (
                <div 
                  className={styles.uniLogoInitials} 
                  style={{ 
                    backgroundColor: colorDisplay,
                    fontSize: initialsFontSize
                  }}
                >
                  {initials}
                </div>
              );

              const studentsCount = uni.students || (uni.userCount !== undefined ? `${uni.userCount}` : '0');
              const gigsCount = uni.gigs || (uni.jobCount !== undefined ? `${uni.jobCount}` : '0');

              return (
                <motion.div 
                  key={uni.shortName || uni._id} 
                  className={styles.uniCard}
                  style={{ 
                    '--uni-color': colorDisplay,
                    '--uni-color-light': `${colorDisplay}0a`,
                    '--uni-color-border': `${colorDisplay}25`
                  } as React.CSSProperties}
                  variants={cardVariants}
                  whileHover={{ 
                    y: -6, 
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  whileTap={{ scale: 0.985 }}
                >
                  <div className={styles.uniCardHeader}>
                    <div className={styles.uniLogoBox}>
                      {logoDisplay}
                    </div>
                    <div className={styles.uniVerifiedBadge}>
                      <ShieldCheck size={13} className={styles.uniVerifiedIcon} />
                      <span>@{domainsStr}</span>
                    </div>
                  </div>
                  
                  <div className={styles.uniCardBody}>
                    <h3 className={styles.uniCardTitle}>{uni.name}</h3>
                    <span className={styles.uniCardShortName}>{uni.shortName || uni.name}</span>
                  </div>

                  <div className={styles.uniCardDivider} />

                  <div className={styles.uniCardStats}>
                    <div className={styles.uniStatItem}>
                      <span className={styles.uniStatLabel}>Active Students</span>
                      <span className={styles.uniStatValue}>{studentsCount}</span>
                    </div>
                    <div className={styles.uniStatItem}>
                      <span className={styles.uniStatLabel}>Gigs Completed</span>
                      <span className={styles.uniStatValue}>{gigsCount}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
            {displayedCategories.map(({ id, name, icon: Icon, color, count, subcategories, bgImage }, idx) => (
              <motion.div
                key={id}
                className={styles.categoryCard}
                style={{ '--card-color': color } as React.CSSProperties}
                variants={cardVariants}
                initial={showAllCategories ? "hidden" : undefined}
                animate={showAllCategories ? "visible" : undefined}
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
                <div 
                  className={styles.cardImageBg} 
                  style={{ backgroundImage: `url(${bgImage})` }} 
                />
                <div className={styles.catHeader}>
                  <div className={styles.catIconWrap}>
                    <Icon size={18} />
                  </div>
                  <div className={styles.catName}>{name}</div>
                </div>
                
                {subcategories && subcategories.length > 0 && (
                  <div className={styles.catSubList}>
                    {subcategories.slice(0, 4).map((sub: string) => {
                      const isHighlighted = sub === 'React / Next.js Development';
                      return (
                        <span
                          key={sub}
                          className={styles.catSubItem}
                          style={isHighlighted ? { color: color } : {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/jobs?category=${id}&subcategory=${encodeURIComponent(sub)}`);
                          }}
                        >
                          <ChevronRight 
                            size={12} 
                            className={styles.catSubChevron} 
                            style={isHighlighted ? { color: color } : {}}
                          />
                          {sub}
                        </span>
                      );
                    })}
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

      {/* ─── POPULAR SERVICES ───────────────────────────────────────────── */}
      <motion.section 
        className={styles.gigsSection} 
        aria-label="Popular Campus Services"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionChip}>
              <Briefcase size={12} />
              Popular Campus Gigs
            </div>
            <h2>Make it all happen with student freelancers</h2>
            <p>Direct BDT deals. Vetted university creators. Zero platform commission.</p>
          </div>

          <div className={styles.gigGrid}>
            {POPULAR_GIGS.map((gig) => (
              <motion.div
                key={gig.id}
                className={styles.gigCard}
                variants={cardVariants}
                whileHover={{ 
                  y: -6, 
                  scale: 1.015,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.985 }}
                onClick={() => router.push(`/jobs?search=${encodeURIComponent(gig.category)}`)}
                style={{ contentVisibility: 'auto' } as React.CSSProperties}
              >
                <div className={styles.gigCardThumbnailWrap}>
                  <img src={gig.thumbnail} alt={gig.title} className={styles.gigCardThumbnail} loading="lazy" />
                </div>

                <div className={styles.gigCardBody}>
                  <div className={styles.gigCategoryBadge}>
                    {gig.category}
                  </div>
                  
                  <h3 className={styles.gigCardTitle}>{gig.title}</h3>
                  
                  <div className={styles.gigRatingWrap}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <strong>{gig.rating}</strong>
                    </div>
                    <span className={styles.gigReviewsCount}>({gig.reviews} reviews)</span>
                    {gig.tag && (
                      <span className={styles.gigCardTag} style={{
                        backgroundColor: gig.tag === 'Best Seller' ? 'rgba(29,192,113,0.1)' : 'rgba(59,130,246,0.1)',
                        color: gig.tag === 'Best Seller' ? '#1dc071' : '#3b82f6'
                      }}>
                        {gig.tag}
                      </span>
                    )}
                  </div>

                  <div className={styles.gigCardFooter}>
                    <div className={styles.gigAuthorBox}>
                      <div className={styles.gigAuthorAvatar}>{gig.freelancer.initials}</div>
                      <div className={styles.gigAuthorDetails}>
                        <div className={styles.gigAuthorName}>{gig.freelancer.name}</div>
                        <div className={styles.gigAuthorDept}>{gig.freelancer.dept}</div>
                      </div>
                    </div>
                    <div className={styles.gigPriceContainer}>
                      <span className={styles.gigPriceLabel}>Starting from</span>
                      <strong className={styles.gigPriceValue}>{gig.price}</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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

      {/* ─── WHAT MAKES US DIFFERENT (PeoplePerHour Checklist + Image) ─── */}
      <motion.section 
        className={styles.differentSection} 
        aria-label="What Makes Us Different"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className={styles.container}>
          <div className={styles.differentGrid}>
            {/* Left Column: Value Propositions / Checklist */}
            <div className={styles.differentLeft}>
              <div className={styles.sectionChip}>
                <Award size={12} /> What Makes Us Different
              </div>
              <h2>Why students and clients choose Microjobs</h2>
              <p className={styles.differentDesc}>
                Microjobs is the premier student freelance marketplace, designed specifically for the unique needs of the campus community.
              </p>
              
              <ul className={styles.differentList}>
                {[
                  {
                    title: "Verified Official University Domains",
                    desc: "Every account is linked to an official university email. No random external profiles or anonymous users."
                  },
                  {
                    title: "Zero Middleman Fees",
                    desc: "We don't take a cut of your earnings. Keep 100% of the price you agree on with your client."
                  },
                  {
                    title: "Secure Contract Escrow",
                    desc: "Funds are held securely by the platform and only released when the client approves the completed work."
                  },
                  {
                    title: "Same-Day Campus Delivery",
                    desc: "Freelancers are physically on campus, enabling quick face-to-face updates and rapid project turnarounds."
                  }
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    className={styles.differentItem}
                    variants={cardVariants}
                  >
                    <div className={styles.differentCheckIcon}>
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
            
            {/* Right Column: Visual Card with student_designer.png */}
            <motion.div 
              className={styles.differentRight}
              variants={cardVariants}
            >
              <div className={styles.differentImgContainer}>
                <div className={styles.differentImgWrap}>
                  <img 
                    src="/images/student_designer.png" 
                    alt="Student Designer at work" 
                    className={styles.differentImg}
                  />
                </div>
                <div className={styles.differentImgCaption}>
                  Farzana S., Graphics & UI/UX Designer
                </div>
              </div>
            </motion.div>
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
