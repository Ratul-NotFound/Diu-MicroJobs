import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';

const DEFAULT_TESTIMONIALS = [
  {
    text: "Got my final-year project presentation slides done in 24 hours. Absolutely stunning quality. Will hire again!",
    author: 'Md. Rafiqul Islam',
    role: 'Faculty',
    department: 'CSE',
    rating: 5,
    initials: 'RI',
  },
  {
    text: "As a student, earning BDT 8,000 in one week by developing a landing page for a department was amazing.",
    author: 'Nusrat Jahan',
    role: 'Student',
    department: 'SWE',
    rating: 5,
    initials: 'NJ',
  },
  {
    text: "We needed event photos urgently. Found a talented student photographer within hours. Campus is full of talent!",
    author: 'Business Club DIU',
    role: 'Department',
    department: 'BBA',
    rating: 5,
    initials: 'BC',
  },
];

export async function GET() {
  try {
    await connectDB();
    const reviews = await Review.find({ rating: 5 })
      .populate('reviewer', 'displayName role department')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (reviews.length === 0) {
      return NextResponse.json({ reviews: DEFAULT_TESTIMONIALS });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = reviews.map((r: any) => ({
      text: r.comment || 'Excellent work!',
      author: r.reviewer?.displayName || 'DIU Member',
      role: r.reviewer?.role || 'User',
      department: r.reviewer?.department || '',
      rating: r.rating,
      initials: (r.reviewer?.displayName || 'U')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    }));

    return NextResponse.json({ reviews: formatted });
  } catch (error) {
    console.error('Testimonials fetch error:', error);
    return NextResponse.json({ reviews: DEFAULT_TESTIMONIALS });
  }
}
