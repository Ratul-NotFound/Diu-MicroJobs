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
import { isDiuEmail } from '@/lib/utils';

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
  /** True while Firebase is restoring session OR we are fetching the MongoDB profile */
  loading: boolean;
  /** True when Firebase user exists but MongoDB profile fetch is complete (profile may be null) */
  profileChecked: boolean;
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
  // loading = Firebase session is being restored
  const [loading, setLoading] = useState(true);
  // profileChecked = we have finished the MongoDB profile lookup for the current user
  const [profileChecked, setProfileChecked] = useState(false);

  const isAdmin = adminProfile !== null && adminProfile.status === 'active';

  /** Fetch user profile from MongoDB — silently sets null on no profile */
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient<{ user: UserProfile | null; admin: AdminProfile | null }>('/api/auth/me');
      if (data) {
        setUserProfile(data.user);
        setAdminProfile(data.admin);
      } else {
        setUserProfile(null);
        setAdminProfile(null);
      }
    } catch {
      setUserProfile(null);
      setAdminProfile(null);
    } finally {
      setProfileChecked(true);
    }
  }, []);

  /** Listen to Firebase auth state changes (runs once on mount) */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setProfileChecked(false);

      if (user) {
        await fetchProfile();
      } else {
        setUserProfile(null);
        setAdminProfile(null);
        setProfileChecked(true);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  /** Email + password login — does NOT navigate; lets the page redirect */
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will fire and call fetchProfile automatically
  };

  /** Google sign-in */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    if (email && !isDiuEmail(email)) {
      await firebaseSignOut(auth);
      throw new Error('Access restricted: Please log in using your official DIU Google Account (@diu.edu.bd, @daffodilvarsity.edu.bd, or @s.diu.edu.bd)');
    }
  };

  /** Register new user — creates Firebase account then MongoDB document */
  const register = async (email: string, password: string, profileData: RegisterData) => {
    let user = auth.currentUser;

    if (!user) {
      // Create a new Firebase auth account
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      user = credential.user;
    }

    // Update Firebase display name if not set
    if (user && !user.displayName) {
      await updateProfile(user, { displayName: profileData.displayName });
    }

    // Create the MongoDB user document
    const { error } = await apiClient('/api/auth/register', {
      method: 'POST',
      body: {
        displayName: profileData.displayName,
        role: profileData.role,
        department: profileData.department,
        studentId: profileData.studentId || '',
      },
    });

    if (error) {
      throw new Error(error);
    }

    // Re-fetch to populate userProfile state
    await fetchProfile();
  };

  /** Sign out */
  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    setAdminProfile(null);
    setProfileChecked(false);
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
        profileChecked,
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
