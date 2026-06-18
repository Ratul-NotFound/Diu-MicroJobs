'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/lib/api-client';
import {
  Mail,
  BookOpen,
  Award,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Star,
  MessageSquare,
  Calendar,
  ChevronLeft,
  GraduationCap,
  Clock,
  ThumbsUp
} from 'lucide-react';
import styles from './public-profile.module.css';

interface PortfolioItem {
  title: string;
  imageUrl: string;
  description: string;
  link: string;
}

interface PublicUser {
  _id: string;
  displayName: string;
  photoURL: string | null;
  role: 'student' | 'faculty' | 'alumni' | 'department';
  department: string;
  bio?: string;
  skills: string[];
  portfolio: PortfolioItem[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  responseTime?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
}

interface ReviewItem {
  _id: string;
  reviewer: {
    _id: string;
    displayName: string;
    photoURL: string | null;
    role: string;
  };
  rating: number;
  communication: number;
  quality: number;
  timeliness: number;
  comment: string;
  createdAt: string;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch public profile
        const profileRes = await apiClient<{ user: PublicUser }>(`/api/users/${id}`);
        if (profileRes.error) {
          addToast(profileRes.error, 'error');
          setLoading(false);
          return;
        }
        setProfile(profileRes.data?.user || null);

        // Fetch reviews
        const reviewsRes = await apiClient<{ reviews: ReviewItem[] }>(
          `/api/reviews?revieweeId=${id}`
        );
        if (reviewsRes.data) {
          setReviews(reviewsRes.data.reviews);
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to load profile details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, addToast]);

  const handleMessage = async () => {
    if (!profile) return;
    if (!userProfile) {
      addToast('Please log in to contact freelancers', 'error');
      router.push('/login');
      return;
    }
    if (userProfile._id === profile._id) {
      addToast('You cannot message yourself', 'warning');
      return;
    }

    setMessaging(true);
    try {
      const { data, error } = await apiClient<{ conversation: { _id: string } }>(
        '/api/messages/conversations',
        {
          method: 'POST',
          body: { participantId: profile._id },
        }
      );

      if (error) {
        addToast(error, 'error');
      } else if (data?.conversation) {
        router.push(`/messages?conversationId=${data.conversation._id}`);
      }
    } catch {
      addToast('Failed to start conversation', 'error');
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.skeletonLayout}>
          <Skeleton height="200px" className={styles.skeletonHero} />
          <div className={styles.skeletonColumns}>
            <Skeleton height="300px" />
            <Skeleton height="450px" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <EmptyState
          title="Profile Not Found"
          description="The user profile you are trying to view does not exist or may have been suspended."
          icon={Briefcase}
          action={{
            label: 'Go Back',
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  const isOwnProfile = userProfile?._id === profile._id;

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button className={styles.backButton} onClick={() => router.back()}>
        <ChevronLeft size={16} />
        <span>Back</span>
      </button>

      {/* Hero Header Card */}
      <Card className={styles.heroCard}>
        <div className={styles.heroLayout}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} />
              ) : (
                profile.displayName.charAt(0).toUpperCase()
              )}
            </div>
            {profile.isOnline && <span className={styles.onlineBadge} />}
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1>{profile.displayName}</h1>
              {profile.isVerified && (
                <Badge variant="success" className={styles.verifiedBadge}>
                  <CheckCircle2 size={12} />
                  Verified Student
                </Badge>
              )}
            </div>

            <p className={styles.departmentText}>
              <GraduationCap size={15} />
              <span>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} of{' '}
                {profile.department}
              </span>
            </p>

            <div className={styles.ratingRow}>
              <StarRating rating={profile.rating} size="sm" />
              <span className={styles.ratingText}>
                <strong>{profile.rating.toFixed(1)}</strong> ({profile.totalReviews} reviews)
              </span>
              <span className={styles.divider}>•</span>
              <span className={styles.completedText}>
                <Briefcase size={14} />
                {profile.completedJobs} jobs completed
              </span>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <Clock size={14} />
                <span>Response: {profile.responseTime || 'Under 2 hours'}</span>
              </div>
              <div className={styles.metaItem}>
                <Calendar size={14} />
                <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            {!isOwnProfile && (
              <Button
                variant="primary"
                onClick={handleMessage}
                loading={messaging}
                fullWidth
              >
                <MessageSquare size={16} style={{ marginRight: '8px' }} />
                Message {profile.displayName.split(' ')[0]}
              </Button>
            )}
            {isOwnProfile && (
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                fullWidth
              >
                Edit My Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        {/* Left Column: About & Skills */}
        <div className={styles.leftColumn}>
          {/* About/Bio */}
          <Card className={styles.sectionCard}>
            <h3>About Me</h3>
            <p className={styles.bioText}>
              {profile.bio || `${profile.displayName} hasn't written a biography yet.`}
            </p>
          </Card>

          {/* Skills Tags */}
          <Card className={styles.sectionCard}>
            <h3>Skills & Tags</h3>
            <div className={styles.tagGrid}>
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className={styles.skillTag}>
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className={styles.noSkills}>No skill tags listed.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Portfolio & Reviews */}
        <div className={styles.rightColumn}>
          {/* Portfolio Grid */}
          <Card className={styles.sectionCard}>
            <h3>Portfolio Gigs</h3>
            <div className={styles.portfolioGrid}>
              {profile.portfolio && profile.portfolio.length > 0 ? (
                profile.portfolio.map((item, idx) => (
                  <div key={idx} className={styles.portfolioCard}>
                    {item.imageUrl ? (
                      <div className={styles.portfolioImage}>
                        <img src={item.imageUrl} alt={item.title} />
                      </div>
                    ) : (
                      <div className={styles.portfolioImagePlaceholder}>
                        <Briefcase size={32} />
                      </div>
                    )}
                    <div className={styles.portfolioInfo}>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.portfolioLink}
                        >
                          <ExternalLink size={12} />
                          <span>View Project</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyCardList}>
                  <p>No portfolio items uploaded.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Reviews List */}
          <Card className={styles.sectionCard}>
            <h3>Reviews & Ratings</h3>
            <div className={styles.reviewsList}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerAvatar}>
                        {review.reviewer.photoURL ? (
                          <img src={review.reviewer.photoURL} alt={review.reviewer.displayName} />
                        ) : (
                          review.reviewer.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className={styles.reviewerMeta}>
                        <h4>{review.reviewer.displayName}</h4>
                        <span className={styles.reviewerRole}>
                          {review.reviewer.role.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className={styles.reviewRatingsSummary}>
                      <div className={styles.reviewStars}>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <div className={styles.subRatings}>
                        <span>Quality: {review.quality}★</span>
                        <span>Comm: {review.communication}★</span>
                        <span>Time: {review.timeliness}★</span>
                      </div>
                    </div>

                    <p className={styles.reviewComment}>{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className={styles.emptyCardList}>
                  <p>No reviews received yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
