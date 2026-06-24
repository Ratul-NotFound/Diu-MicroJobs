/**
 * Seed script: Populates the University collection with the top 10 Bangladesh universities
 * and backfills existing User/Job documents with the DIU university reference.
 *
 * Usage: npx tsx scripts/seed-universities.ts
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually to load MONGODB_URI without external dependencies
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.error('⚠️ Failed to parse .env.local:', e);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// ─── University Data ─────────────────────────────────────────────────

const universities = [
  {
    name: 'Daffodil International University',
    shortName: 'DIU',
    slug: 'diu',
    domains: ['diu.edu.bd', 'daffodilvarsity.edu.bd', 's.diu.edu.bd'],
    departments: [
      'CSE', 'SWE', 'EEE', 'TE', 'Pharmacy', 'English', 'BBA',
      'ESD', 'Administration', 'Civil Engineering', 'Architecture',
      'Journalism', 'Law', 'Tourism & Hospitality',
    ],
    currency: 'BDT',
  },
  {
    name: 'Bangladesh University of Engineering and Technology',
    shortName: 'BUET',
    slug: 'buet',
    domains: ['buet.ac.bd'],
    departments: [
      'CSE', 'EEE', 'ME', 'CE', 'ChE', 'Architecture', 'URP',
      'IPE', 'NAME', 'MME', 'WRE', 'BME',
    ],
    currency: 'BDT',
  },
  {
    name: 'University of Dhaka',
    shortName: 'DU',
    slug: 'du',
    domains: ['du.ac.bd'],
    departments: [
      'CSE', 'EEE', 'Physics', 'Chemistry', 'Mathematics', 'English',
      'Economics', 'Law', 'Pharmacy', 'Business Administration',
      'International Relations', 'Sociology',
    ],
    currency: 'BDT',
  },
  {
    name: 'North South University',
    shortName: 'NSU',
    slug: 'nsu',
    domains: ['northsouth.edu'],
    departments: [
      'CSE', 'ECE', 'BBA', 'Economics', 'English', 'Environmental Science',
      'Architecture', 'Pharmacy', 'Public Health', 'Law',
    ],
    currency: 'BDT',
  },
  {
    name: 'BRAC University',
    shortName: 'BRACU',
    slug: 'bracu',
    domains: ['bracu.ac.bd', 'g.bracu.ac.bd'],
    departments: [
      'CSE', 'EEE', 'Architecture', 'Pharmacy', 'English', 'Economics',
      'Mathematics', 'Physics', 'BBA', 'Law',
    ],
    currency: 'BDT',
  },
  {
    name: 'University of Rajshahi',
    shortName: 'RU',
    slug: 'ru',
    domains: ['ru.ac.bd'],
    departments: [
      'CSE', 'EEE', 'IT', 'Physics', 'Chemistry', 'Mathematics',
      'English', 'Economics', 'Law', 'Pharmacy', 'Sociology',
    ],
    currency: 'BDT',
  },
  {
    name: 'Jahangirnagar University',
    shortName: 'JU',
    slug: 'ju',
    domains: ['juniv.edu'],
    departments: [
      'CSE', 'Mathematics', 'Physics', 'Chemistry', 'Economics',
      'English', 'Geography', 'Pharmacy', 'Statistics',
    ],
    currency: 'BDT',
  },
  {
    name: 'University of Chittagong',
    shortName: 'CU',
    slug: 'cu',
    domains: ['cu.ac.bd'],
    departments: [
      'CSE', 'EEE', 'Physics', 'Chemistry', 'Mathematics',
      'English', 'Economics', 'Law', 'Marine Sciences',
    ],
    currency: 'BDT',
  },
  {
    name: 'Bangladesh Agricultural University',
    shortName: 'BAU',
    slug: 'bau',
    domains: ['bau.edu.bd'],
    departments: [
      'Agriculture', 'Veterinary Science', 'Fisheries',
      'Agricultural Economics', 'Agricultural Engineering', 'CSE',
    ],
    currency: 'BDT',
  },
  {
    name: 'Independent University Bangladesh',
    shortName: 'IUB',
    slug: 'iub',
    domains: ['iub.edu.bd'],
    departments: [
      'CSE', 'EEE', 'BBA', 'Economics', 'English', 'Environmental Science',
      'Media & Communication', 'Law', 'Life Sciences',
    ],
    currency: 'BDT',
  },
];

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected.\n');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  const uniCollection = db.collection('universities');
  const userCollection = db.collection('users');
  const jobCollection = db.collection('jobs');

  // ── Step 1: Upsert universities ──
  console.log('📚 Seeding universities...');
  let diuId: mongoose.Types.ObjectId | null = null;

  for (const uni of universities) {
    const result = await uniCollection.updateOne(
      { slug: uni.slug },
      {
        $set: {
          name: uni.name,
          shortName: uni.shortName,
          domains: uni.domains,
          departments: uni.departments,
          currency: uni.currency,
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          logo: '',
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const doc = await uniCollection.findOne({ slug: uni.slug });
    if (uni.slug === 'diu' && doc) {
      diuId = doc._id as mongoose.Types.ObjectId;
    }

    const action = result.upsertedCount ? '✨ Created' : '♻️  Updated';
    console.log(`  ${action}: ${uni.shortName} (${uni.name})`);
  }

  console.log(`\n✅ ${universities.length} universities seeded.\n`);

  // ── Step 2: Backfill existing users with DIU university ──
  if (diuId) {
    const usersWithoutUni = await userCollection.countDocuments({ university: { $exists: false } });
    if (usersWithoutUni > 0) {
      console.log(`👤 Backfilling ${usersWithoutUni} existing users with DIU university...`);
      await userCollection.updateMany(
        { university: { $exists: false } },
        { $set: { university: diuId } }
      );
      console.log('✅ Users backfilled.\n');
    } else {
      console.log('👤 All users already have a university. Skipping backfill.\n');
    }

    // ── Step 3: Backfill existing jobs with DIU university ──
    const jobsWithoutUni = await jobCollection.countDocuments({ university: { $exists: false } });
    if (jobsWithoutUni > 0) {
      console.log(`💼 Backfilling ${jobsWithoutUni} existing jobs with DIU university...`);
      await jobCollection.updateMany(
        { university: { $exists: false } },
        { $set: { university: diuId } }
      );
      console.log('✅ Jobs backfilled.\n');
    } else {
      console.log('💼 All jobs already have a university. Skipping backfill.\n');
    }
  } else {
    console.warn('⚠️  DIU university not found — skipping user/job backfill.');
  }

  console.log('🎉 Seed complete!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
