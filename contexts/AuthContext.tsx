
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { deviceBanService } from '@/services/deviceBanService';
import { useRouter } from 'expo-router';

interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url: string | null;
  banner_url?: string | null;
  unique_profile_link?: string;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkDeviceBan: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);

  usePushNotifications(user?.id || null);

  const ensureWalletExists = useCallback(async (userId: string) => {
    try {
      const { data: existingWallet } = await supabase
        .from('wallet')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingWallet) {
        console.log('Creating wallet for user:', userId);
        const { error } = await supabase.from('wallet').insert({
          user_id: userId,
          balance: 0.00,
          last_updated: new Date().toISOString(),
        });

        if (error) {
          console.warn('⚠️ Error creating wallet:', error.message);
        } else {
          console.log('✅ Wallet created successfully');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error in ensureWalletExists:', error instanceof Error ? error.message : error);
    }
  }, []);

  const checkDeviceBan = useCallback(async (): Promise<boolean> => {
    try {
      const { banned } = await deviceBanService.isDeviceBanned();
      return banned;
    } catch (error) {
      console.warn('⚠️ Error checking device ban:', error instanceof Error ? error.message : error);
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Error fetching profile:', error.message);
        setProfileFetched(true);
        return null;
      }

      if (!data) {
        console.log('Profile not found, creating new profile for user:', userId);
        
        // CRITICAL FIX: Verify user is authenticated before creating profile
        const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authenticatedUser) {
          console.warn('⚠️ User not authenticated, cannot create profile');
          console.warn('Profile will be created on next login after email confirmation');
          setProfileFetched(true);
          return null;
        }

        // Ensure the authenticated user matches the requested user
        if (authenticatedUser.id !== userId) {
          console.warn('⚠️ User ID mismatch - security violation prevented');
          setProfileFetched(true);
          return null;
        }
        
        const username = userEmail ? userEmail.split('@')[0] : `user_${userId.substring(0, 8)}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username,
            display_name: username,
            avatar_url: null,
            unique_profile_link: `roastlive.com/@${username}`,
            followers_count: 0,
            following_count: 0,
          })
          .select()
          .single();

        if (createError) {
          console.warn('⚠️ Error creating profile:', createError.message);
          setProfileFetched(true);
          return null;
        }

        console.log('✅ Profile created successfully:', newProfile);
        
        await ensureWalletExists(userId);
        await deviceBanService.storeDeviceFingerprint(userId);
        setProfileFetched(true);
        
        return newProfile;
      }

      console.log('✅ Profile fetched successfully:', data);
      
      await ensureWalletExists(userId);
      await deviceBanService.storeDeviceFingerprint(userId);
      setProfileFetched(true);
      
      return data;
    } catch (error) {
      console.warn('⚠️ Error in fetchProfile:', error instanceof Error ? error.message : error);
      setProfileFetched(true);
      return null;
    }
  }, [ensureWalletExists]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.email);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  const handleAuthError = useCallback(async (error: AuthError) => {
    console.warn('⚠️ Auth error:', error.message);
    
    if (error.message?.includes('Invalid Refresh Token') || 
        error.message?.includes('Refresh Token Not Found')) {
      console.log('🔄 Invalid or missing refresh token, logging out user');
      
      try {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      } catch (signOutError) {
        console.warn('⚠️ Error during forced sign out:', signOutError instanceof Error ? signOutError.message : signOutError);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const isBanned = await checkDeviceBan();
        if (isBanned) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          handleAuthError(error);
        }
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && !profileFetched) {
          const profileData = await fetchProfile(session.user.id, session.user.email);
          if (mounted) {
            setProfile(profileData);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.warn('⚠️ Error initializing auth:', error instanceof Error ? error.message : error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileFetched(false);
        return;
      }
      
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setProfileFetched(false);
        const profileData = await fetchProfile(session.user.id, session.user.email);
        if (mounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
        setProfileFetched(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, profileFetched, checkDeviceBan, handleAuthError]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        return { error: { message: 'This device is banned from accessing Roast Live' } };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific auth errors gracefully - NO AUTOMATIC RETRIES
        if (error.message?.includes('Invalid login credentials')) {
          console.warn('⚠️ Invalid login credentials provided');
          return { 
            error: { 
              message: 'Invalid email or password. Please check your credentials and try again.',
              code: 'invalid_credentials'
            } 
          };
        }
        
        if (error.message?.includes('Email not confirmed')) {
          console.warn('⚠️ Email not confirmed');
          return { 
            error: { 
              message: 'Please verify your email address before logging in. Check your inbox for the confirmation link.',
              code: 'email_not_confirmed'
            } 
          };
        }
        
        console.warn('⚠️ Sign in error:', error.message);
        return { error: { message: error.message, code: error.name } };
      }
      
      console.log('✅ Sign in successful');
      return { error: null };
    } catch (error) {
      console.warn('⚠️ Unexpected error during sign in:', error instanceof Error ? error.message : error);
      return { error: { message: 'An unexpected error occurred. Please try again.', code: 'unexpected_error' } };
    }
  }, [checkDeviceBan]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        return { error: { message: 'This device is banned from accessing Roast Live' } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        // Handle specific signup errors gracefully - NO AUTOMATIC RETRIES
        if (error.message?.includes('User already registered')) {
          console.warn('⚠️ User already registered');
          return { 
            error: { 
              message: 'An account with this email already exists. Please sign in instead.',
              code: 'user_already_exists'
            } 
          };
        }
        
        if (error.message?.includes('Password should be at least')) {
          console.warn('⚠️ Password too weak');
          return { 
            error: { 
              message: 'Password must be at least 6 characters long.',
              code: 'weak_password'
            } 
          };
        }
        
        console.warn('⚠️ Sign up error:', error.message);
        return { error: { message: error.message, code: error.name } };
      }

      // CRITICAL FIX: Do NOT create profile during signup
      // Profile will be created automatically when user confirms email and signs in
      // This prevents RLS violations since user is not yet authenticated
      
      console.log('✅ Signup successful - profile will be created after email confirmation');
      console.log('📧 Please check your email to confirm your account');

      return { error: null };
    } catch (error) {
      console.warn('⚠️ Unexpected error during sign up:', error instanceof Error ? error.message : error);
      return { error: { message: 'An unexpected error occurred. Please try again.', code: 'unexpected_error' } };
    }
  }, [checkDeviceBan]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      console.log('✅ Sign out successful');
    } catch (error) {
      console.warn('⚠️ Error during sign out:', error instanceof Error ? error.message : error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        checkDeviceBan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
