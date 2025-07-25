
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  is_creator: boolean;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  location?: string;
  website_url?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  created_at: string;
  updated_at: string;
}

interface CreatorProfile {
  id: string;
  user_id: string;
  subscription_price: number;
  total_earnings: number;
  total_subscribers: number;
  total_posts: number;
  content_categories?: string[];
  payout_email?: string;
  tax_id?: string;
  bank_account_info?: any;
  platform_fee_paid_until?: string;
  is_platform_fee_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  creatorProfile: CreatorProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  becomeCreator: (subscriptionPrice: number, categories: string[]) => Promise<void>;
  optOutOfCreator: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // If user is a creator, fetch creator profile
      if (profileData.is_creator) {
        const { data: creatorData, error: creatorError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (creatorError && creatorError.code !== 'PGRST116') {
          throw creatorError;
        }

        // Check if platform fee is expired
        if (creatorData && creatorData.platform_fee_paid_until) {
          const feeExpired = new Date(creatorData.platform_fee_paid_until) < new Date();
          if (feeExpired && creatorData.is_platform_fee_active) {
            // Update the platform fee status to inactive
            await supabase
              .from('creator_profiles')
              .update({ is_platform_fee_active: false })
              .eq('user_id', userId);
            
            creatorData.is_platform_fee_active = false;
          }
        }

        setCreatorProfile(creatorData || null);
      } else {
        setCreatorProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setCreatorProfile(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCreatorProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string, displayName: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: displayName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Welcome to KikStars. Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const becomeCreator = async (subscriptionPrice: number, categories: string[]) => {
    if (!user || !profile) return;

    try {
      // Update profile to mark as creator
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_creator: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: user.id,
          subscription_price: subscriptionPrice * 100, // Convert to cents
          content_categories: categories,
          total_earnings: 0,
          total_subscribers: 0,
          total_posts: 0,
        })
        .select()
        .single();

      if (creatorError) throw creatorError;

      setProfile(prev => prev ? { ...prev, is_creator: true } : null);
      setCreatorProfile(creatorData);

      toast({
        title: "Creator account activated!",
        description: "You can now start creating and monetizing content.",
      });
    } catch (error: any) {
      toast({
        title: "Creator setup failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const optOutOfCreator = async () => {
    if (!user || !profile) return;

    try {
      // Update profile to remove creator status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_creator: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete creator profile
      const { error: creatorError } = await supabase
        .from('creator_profiles')
        .delete()
        .eq('user_id', user.id);

      if (creatorError) throw creatorError;

      setProfile(prev => prev ? { ...prev, is_creator: false } : null);
      setCreatorProfile(null);

      toast({
        title: "Creator status removed",
        description: "You've successfully opted out of creator status.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to opt out",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      creatorProfile,
      loading,
      login,
      register,
      logout,
      updateProfile,
      becomeCreator,
      optOutOfCreator,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
