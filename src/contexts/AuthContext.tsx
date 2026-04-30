import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider, ADMIN_EMAIL, MODERATOR_EMAILS } from '../services/firebase';
import { sendWelcomeEmail } from '../services/emailService';
import type { UserProfile, City } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isModerator: boolean;
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
  const isModerator = isAdmin || MODERATOR_EMAILS.includes(currentUser?.email || '');

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

  const signInWithApple = async () => {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Médecin',
        email: user.email || '',
        photoURL: user.photoURL || '',
        provider: 'apple',
        createdAt: new Date().toISOString(),
      });
    }
  };

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
      currentUser, userProfile, isAdmin, isModerator, loading,
      needsOnboarding, signInWithGoogle, signInWithApple, logout,
      completeOnboarding, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
