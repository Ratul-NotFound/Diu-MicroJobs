/**
 * Seed / upsert all categories with full subcategory lists.
 * Run: node scripts/seed-categories.js
 */
const mongoose = require('mongoose');

const uri = 'mongodb+srv://diu_admin:qgIysaCYgdfShy6V@diumicrojobs.1mxcoqf.mongodb.net/diu-microjobs?retryWrites=true&w=majority&appName=DiuMicroJobs';

const CATEGORIES = [
  {
    name: 'Web & App Dev',
    slug: 'web-app-dev',
    icon: 'code',
    description: 'Website, web app, and mobile app development services',
    order: 1,
    subcategories: [
      'Portfolio Website Making',
      'Landing Page Design',
      'Full-Stack Web App',
      'React / Next.js Development',
      'WordPress Website',
      'E-commerce Site',
      'REST API Development',
      'Mobile App (Android)',
      'Mobile App (iOS)',
      'Chrome Extension',
      'Database Design',
      'Bug Fixing & Support',
    ],
  },
  {
    name: 'Design',
    slug: 'design',
    icon: 'palette',
    description: 'Graphic design, UI/UX, and branding services',
    order: 2,
    subcategories: [
      'Logo Design',
      'Poster Design',
      'Banner / Social Media Graphics',
      'Flyer & Brochure Design',
      'UI/UX Design (Figma)',
      'Business Card Design',
      'T-shirt / Merchandise Design',
      'Infographic Design',
      'Brand Identity Package',
      'Icon Design',
      'Thumbnail Design',
      'Packaging Design',
    ],
  },
  {
    name: 'Photography',
    slug: 'photography',
    icon: 'camera',
    description: 'Photo shooting, editing, and videography services',
    order: 3,
    subcategories: [
      'Event Photography',
      'Portrait Photography',
      'Product Photography',
      'Photo Editing & Retouching',
      'Drone Photography',
      'Headshot Photography',
      'Architecture Photography',
      'Food Photography',
      'Sports Photography',
    ],
  },
  {
    name: 'Videography',
    slug: 'videography',
    icon: 'video',
    description: 'Video shooting, editing, and production services',
    order: 4,
    subcategories: [
      'Videography (Event)',
      'Video Editing',
      'Short-Form Content (Reels/TikTok)',
      'YouTube Video Editing',
      'Animation',
      '2D Animation',
      '3D Animation',
      'Motion Graphics',
      'Whiteboard Animation',
      'Explainer Video',
      'Voice Over',
      'Podcast Editing',
    ],
  },
  {
    name: 'Slides & Docs',
    slug: 'slides-docs',
    icon: 'presentation',
    description: 'Professional presentations, documents, and reports',
    order: 5,
    subcategories: [
      'PowerPoint Presentation',
      'Google Slides',
      'Pitch Deck Design',
      'Lab Report Writing',
      'Documentation & Manuals',
      'Proofreading & Editing',
    ],
  },
  {
    name: 'Research',
    slug: 'research',
    icon: 'search',
    description: 'Academic research, data collection, and analysis',
    order: 6,
    subcategories: [
      'Literature Review',
      'Survey Design & Analysis',
      'Data Collection',
      'Statistical Analysis (SPSS / R)',
      'Market Research',
      'Web Scraping & Data Mining',
      'Research Paper Formatting',
    ],
  },
  {
    name: 'Tutoring',
    slug: 'tutoring',
    icon: 'book',
    description: 'Academic tutoring and skill coaching',
    order: 7,
    subcategories: [
      'Math Tutoring',
      'Programming Help',
      'Physics / Chemistry Tutoring',
      'English Language Coaching',
      'IELTS / TOEFL Prep',
      'GRE / SAT Prep',
      'Algorithm & Data Structures',
      'Circuit Analysis Tutoring',
      'Machine Learning Coaching',
    ],
  },
  {
    name: 'Drawing & Drafting',
    slug: 'drawing-drafting',
    icon: 'pen-tool',
    description: 'Architectural, engineering, and technical drawing services',
    order: 8,
    subcategories: [
      'Architectural Drawing',
      'AutoCAD Drafting',
      'Floor Plan Design',
      '3D Modeling (SketchUp / Blender)',
      'Civil Engineering Drawing',
      'Electrical Wiring Diagram',
      'PCB Layout Design',
      'Technical Illustration',
      'Hand Sketch & Concept Art',
    ],
  },
  {
    name: 'Project Making',
    slug: 'project-making',
    icon: 'cpu',
    description: 'University project and prototype development',
    order: 9,
    subcategories: [
      'IoT Project',
      'Arduino / Raspberry Pi Project',
      'DLD / Digital Circuit Project',
      'Microcontroller Programming',
      'Robotics Project',
      'PCB Design & Fabrication',
      'Python / C++ Project',
      'Machine Learning Project',
      'Data Science Project',
      'Simulation Project (MATLAB / Proteus)',
      'Final Year Project Help',
    ],
  },
  {
    name: 'Thesis & Academic Writing',
    slug: 'thesis-academic-writing',
    icon: 'file-text',
    description: 'Thesis writing, research papers, and academic support',
    order: 10,
    subcategories: [
      'Thesis Writing Assistance',
      'Research Paper Writing',
      'Assignment Writing',
      'Report Writing',
      'Plagiarism Check & Editing',
      'Referencing & Bibliography (APA/MLA)',
      'Proposal Writing',
      'Literature Review Writing',
      'Abstract Writing',
    ],
  },
  {
    name: 'Assignment & Lab Help',
    slug: 'assignment-lab-help',
    icon: 'clipboard',
    description: 'Assignment completion and lab work assistance',
    order: 11,
    subcategories: [
      'Programming Assignment Help',
      'Math / Statistics Assignments',
      'Lab Report Help',
      'Simulation Lab Work',
      'Case Study Analysis',
      'Online Quiz / Exam Prep',
    ],
  },
  {
    name: 'Career & Resume Prep',
    slug: 'career-resume-prep',
    icon: 'briefcase',
    description: 'CV, resume, LinkedIn, and job application support',
    order: 12,
    subcategories: [
      'CV Making',
      'Resume Making',
      'LinkedIn Profile Optimization',
      'Cover Letter Writing',
      'Job Application Assistance',
      'Interview Coaching',
      'Portfolio Review',
      'Career Counseling',
    ],
  },
  {
    name: 'Content Writing',
    slug: 'content-writing',
    icon: 'edit',
    description: 'Blog, copywriting, social media, and creative content',
    order: 13,
    subcategories: [
      'Blog / Article Writing',
      'Social Media Content',
      'Copywriting',
      'SEO Writing',
      'Creative Writing',
      'Script Writing',
      'Product Description Writing',
      'Email Newsletter Writing',
    ],
  },
  {
    name: 'Event & Campus Support',
    slug: 'event-campus-support',
    icon: 'calendar',
    description: 'Event management, hosting, and campus activity support',
    order: 14,
    subcategories: [
      'Event Host / MC',
      'Event Planning & Management',
      'Event Photography / Video',
      'Stage Decoration',
      'Volunteer Coordination',
      'Ticket Management',
      'Live Streaming Setup',
    ],
  },
  {
    name: 'Campus Errands & Delivery',
    slug: 'campus-errands-delivery',
    icon: 'package',
    description: 'On-campus delivery, printing, and errand services',
    order: 15,
    subcategories: [
      'Document Printing & Binding',
      'Campus Food Delivery',
      'Library Book Pickup',
      'Form Submission Help',
      'Shopping & Procurement',
      'Stationery Delivery',
    ],
  },
  {
    name: 'Tech & Digital Services',
    slug: 'tech-digital-services',
    icon: 'settings',
    description: 'Laptop setup, AI automation, and digital support services',
    order: 16,
    subcategories: [
      'Laptop Setup & Configuration',
      'OS Installation (Windows / Linux)',
      'Software Installation & Troubleshooting',
      'AI Automation (n8n / Make / Zapier)',
      'ChatGPT / AI Tool Setup',
      'Data Entry & Spreadsheet Work',
      'Google Workspace Setup',
      'VPN & Security Setup',
      'Network Configuration',
      'Website Hosting Setup',
    ],
  },
];

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const collection = mongoose.connection.db.collection('categories');

    let updated = 0;
    let inserted = 0;

    for (const cat of CATEGORIES) {
      const result = await collection.updateOne(
        { name: cat.name },
        {
          $set: {
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            description: cat.description,
            order: cat.order,
            subcategories: cat.subcategories,
            isActive: true,
          },
          $setOnInsert: { jobCount: 0 },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted++;
        console.log(`  ➕ Inserted: ${cat.name}`);
      } else if (result.modifiedCount > 0) {
        updated++;
        console.log(`  ✏️  Updated: ${cat.name}`);
      } else {
        console.log(`  ⏭️  No change: ${cat.name}`);
      }
    }

    // Check final state
    const allCats = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`\n✅ Done! Total categories in DB: ${allCats.length} (${inserted} inserted, ${updated} updated)`);
    console.log('\nFinal category list:');
    allCats.forEach((c) => {
      console.log(`  [${c.order}] ${c.name} (${c.slug}) — ${(c.subcategories || []).length} subcategories`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  }
}

run();
