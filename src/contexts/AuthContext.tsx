import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAIL } from '../services/firebase';
import { sendWelcomeEmail } from '../services/emailService';
import type { UserProfile, City } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (city: City) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const fetchProfile = async (user: User) => {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
      setNeedsOnboarding(false);
    } else {
      setNeedsOnboarding(true);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setNeedsOnboarding(false);
  };

  const completeOnboarding = async (city: City) => {
    if (!currentUser) return;
    const profile: UserProfile = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Médecin',
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || undefined,
      city,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    await setDoc(doc(db, 'users', currentUser.uid), profile);
    setUserProfile(profile);
    setNeedsOnboarding(false);
    // Email de bienvenue (non bloquant)
    if (currentUser.email) {
      sendWelcomeEmail({
        to: currentUser.email,
        name: profile.displayName,
        city,
      }).catch(() => {});
    }
  };

  const refreshProfile = async () => {
    if (currentUser) await fetchProfile(currentUser);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, userProfile, isAdmin, loading,
      needsOnboarding, signInWithGoogle, logout,
      completeOnboarding, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
