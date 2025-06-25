
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformStats {
  totalUsers: number;
  totalCreators: number;
  totalPosts: number;
  totalRevenue: number;
  activeSubscriptions: number;
  topCategories: string[];
}

export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        // Get total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        // Get total creators
        const { count: totalCreators } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('is_creator', true);

        // Get total published posts
        const { count: totalPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .eq('is_published', true);

        // Get total revenue from all creator profiles
        const { data: revenueData } = await supabase
          .from('creator_profiles')
          .select('total_earnings');

        const totalRevenue = revenueData?.reduce((sum, profile) => sum + profile.total_earnings, 0) || 0;

        // Get active subscriptions
        const { count: activeSubscriptions } = await supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact' })
          .eq('status', 'active');

        // Get top content categories
        const { data: categoriesData } = await supabase
          .from('creator_profiles')
          .select('content_categories')
          .not('content_categories', 'is', null);

        const allCategories = categoriesData?.flatMap(profile => profile.content_categories || []) || [];
        const categoryCount = allCategories.reduce((acc, cat) => {
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topCategories = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category]) => category);

        setStats({
          totalUsers: totalUsers || 0,
          totalCreators: totalCreators || 0,
          totalPosts: totalPosts || 0,
          totalRevenue,
          activeSubscriptions: activeSubscriptions || 0,
          topCategories
        });
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealStats();
  }, []);

  return { stats, loading };
};

export const useRealUserActivity = (userId?: string) => {
  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!user && !userId) return;

      const targetUserId = userId || user?.id;
      
      try {
        // Get user's real activity data
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: commentsData } = await supabase
          .from('post_comments')
          .select('created_at, content')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: subscriptionsData } = await supabase
          .from('user_subscriptions')
          .select('created_at, creator_id, amount_paid')
          .eq('subscriber_id', targetUserId)
          .eq('status', 'active');

        const { data: tipsData } = await supabase
          .from('tips')
          .select('created_at, amount, creator_id')
          .eq('tipper_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(5);

        setActivity({
          recentLikes: likesData || [],
          recentComments: commentsData || [],
          activeSubscriptions: subscriptionsData || [],
          recentTips: tipsData || [],
          totalSpent: [...(subscriptionsData || []), ...(tipsData || [])]
            .reduce((sum, item) => sum + (item.amount_paid || item.amount), 0)
        });
      } catch (error) {
        console.error('Error fetching user activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [user, userId]);

  return { activity, loading };
};
