'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';

import { exchangeFirebaseForAccessToken } from '@/lib/auth-api';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { getStoredAccessToken, setStoredAccessToken } from '@/lib/session-token';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  /** Mint API JWT from current Firebase session (admins only). */
  refreshAdminSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setAccessToken(null);
        setStoredAccessToken(null);
      } else {
        const stored = getStoredAccessToken();
        setAccessToken(stored);
      }
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not configured. Add Firebase web env vars to apps/web/.env.local.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setStoredAccessToken(null);
    setAccessToken(null);
  }, []);

  const refreshAdminSession = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not configured');
    const u = auth.currentUser;
    if (!u) throw new Error('Not signed in');
    const idToken = await u.getIdToken(true);
    const token = await exchangeFirebaseForAccessToken(idToken);
    setStoredAccessToken(token);
    setAccessToken(token);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      accessToken,
      signInWithGoogle,
      signOutUser,
      refreshAdminSession,
    }),
    [user, loading, accessToken, signInWithGoogle, signOutUser, refreshAdminSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
