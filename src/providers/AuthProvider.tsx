import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { authService, OAuthProvider } from '../services/auth.service';
import type { Database } from '../types/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isVerified: boolean;
  signIn: (provider: OAuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    // Row not found is not a hard error — user may not have a profile yet
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether initial session load is complete so we don't treat the
  // first SIGNED_OUT (no existing session) as an unexpected expiry.
  const initializedRef = useRef(false);
  // Track whether the user had an active session, to detect expiry vs. normal sign-out.
  const hadSessionRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const fetched = await fetchProfile(user.id);
    setProfile(fetched);
  }, [user]);

  // Initial session load + auth state listener
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const initialSession = await Promise.race([
          authService.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          hadSessionRef.current = true;
          const fetched = await fetchProfile(initialSession.user.id);
          if (!mounted) return;
          setProfile(fetched);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize().then(() => {
      initializedRef.current = true;
    });

    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // Detect unexpected session expiry after initial load
        if (
          event === 'SIGNED_OUT' &&
          initializedRef.current &&
          hadSessionRef.current
        ) {
          Alert.alert(
            '세션이 만료되었어요',
            '다시 로그인해주세요.',
            [{ text: '확인', onPress: () => router.replace('/(auth)/login') }]
          );
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          hadSessionRef.current = true;
          const fetched = await fetchProfile(newSession.user.id);
          if (!mounted) return;
          setProfile(fetched);
        } else {
          hadSessionRef.current = false;
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (provider: OAuthProvider) => {
    await authService.signInWithOAuth(provider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await authService.signInWithEmail(email, password);
  }, []);

  const signOut = useCallback(async () => {
    // Clear hadSessionRef before signing out so the resulting SIGNED_OUT event
    // is not mistaken for an unexpected session expiry.
    hadSessionRef.current = false;
    await authService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const isAuthenticated = session !== null;
  const isOnboarded = Boolean(
    profile && (profile.handle ?? '').length > 0 && (profile.display_name ?? '').length > 0
  );
  const isVerified = profile?.location_verified === true;

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    isAuthenticated,
    isOnboarded,
    isVerified,
    signIn,
    signInWithEmail,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
