'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api-client';

/** User profile from MongoDB */
interface UserProfile {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'student' | 'faculty' | 'alumni' | 'department';
  department: string;
  studentId: string;
  bio: string;
  skills: string[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'banned';
  portfolio?: Array<{
    title: string;
    imageUrl: string;
    description: string;
    link: string;
  }>;
}

/** Admin profile from MongoDB */
interface AdminProfile {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'moderator' | 'support';
  permissions: string[];
  status: 'active' | 'inactive';
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  isAdmin: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, profileData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  displayName: string;
  role: 'student' | 'faculty' | 'alumni' | 'department';
  department: string;
  studentId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = adminProfile !== null && adminProfile.status === 'active';

  /** Fetch user profile from MongoDB */
  const fetchProfile = useCallback(async () => {
    const { data } = await apiClient<{ user: UserProfile; admin: AdminProfile | null }>('/api/auth/me');
    if (data) {
      setUserProfile(data.user);
      setAdminProfile(data.admin);
    }
  }, []);

  /** Listen to Firebase auth state changes */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          await fetchProfile();
        } catch {
          // Profile might not exist yet (first login)
          console.log('Profile not found — may need registration');
        }
      } else {
        setUserProfile(null);
        setAdminProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  /** Email + password login */
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  /** Google sign-in */
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } finally {
      setLoading(false);
    }
  };

  /** Register new user */
  const register = async (email: string, password: string, profileData: RegisterData) => {
    setLoading(true);
    try {
      let user = auth.currentUser;

      if (!user) {
        // Create Firebase auth account
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        user = credential.user;
      }

      // Update Firebase profile display name if not set
      if (user && !user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
      }

      // Create MongoDB user document
      await apiClient('/api/auth/register', {
        method: 'POST',
        body: {
          displayName: profileData.displayName,
          role: profileData.role,
          department: profileData.department,
          studentId: profileData.studentId || '',
        },
      });

      // Fetch the newly created profile
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  /** Sign out */
  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    setAdminProfile(null);
  };

  /** Password reset */
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  /** Refresh profile from DB */
  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        adminProfile,
        loading,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
