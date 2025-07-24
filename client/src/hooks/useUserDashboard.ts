import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';

type DashboardStats = {
  // User stats
  totalSubscriptions: number;
  totalSpent: number;
  recentActivity: Array<{
    id: string;
    user_id: string;
    activity_type: string;
    created_at: string;
    metadata: Record<string, any>;
  }>;
  favoriteCreators: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  }>;
  // Creator stats
  totalEarnings: number;
  totalSubscribers: number;
  totalPosts: number;
  totalViews: number;
  monthlyEarnings: number;
  recentSubscribers: number;
  engagementRate: number;
  recentEarnings: Array<{
    date: string;
    amount: number;
  }>;
  topPosts: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    content_type: string;
    content_analytics: Array<{
      metric_type: string;
      value: number;
    }>;
  }>;
  monthlyData: Array<{
    month: string;
    earnings: number;
  }>;
  contentPerformance: Array<{
    type: string;
    total: number;
  }>;
};

const initialStats: DashboardStats = {
  totalSubscriptions: 0,
  totalSpent: 0,
  recentActivity: [],
  favoriteCreators: [],
  totalEarnings: 0,
  totalSubscribers: 0,
  totalPosts: 0,
  totalViews: 0,
  monthlyEarnings: 0,
  recentSubscribers: 0,
  engagementRate: 0,
  recentEarnings: [],
  topPosts: [],
  monthlyData: [],
  contentPerformance: []
};

export const useUserDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        
        // Fetch basic user stats
        const [
          { data: subscriptions, error: subError },
          { data: payments, error: payError },
          { data: activity, error: activityError }
        ] = await Promise.all([
          // Active subscriptions
          supabase
            .from('user_subscriptions')
            .select('*')
            .eq('subscriber_id', user.id)
            .eq('status', 'active'),
          // Total spent
          supabase
            .from('revenue_records')
            .select('amount')
            .eq('buyer_id', user.id),
          // Recent activity
          supabase
            .from('user_activity')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        if (subError) throw subError;
        if (payError) throw payError;
        if (activityError) throw activityError;

        // Fetch favorite creators
        const { data: favorites, error: favError } = await supabase
          .from('creator_profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', (subscriptions || []).map(s => s.creator_id))
          .limit(5);

        if (favError) throw favError;

        // Update basic stats
        const totalSpent = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

        setStats(prev => ({
          ...prev,
          totalSubscriptions: subscriptions?.length || 0,
          totalSpent,
          recentActivity: activity || [],
          favoriteCreators: favorites || []
        }));

        // If user is a creator, fetch additional stats
        if (profile?.is_creator) {
          const [
            { data: earnings, error: earnError },
            { count: subscriberCount, error: countError },
            { data: posts, error: postsError }
          ] = await Promise.all([
            // Creator earnings
            supabase
              .from('revenue_records')
              .select('*')
              .eq('creator_id', user.id)
              .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            // Subscriber count
            supabase
              .from('user_subscriptions')
              .select('*', { count: 'exact' })
              .eq('creator_id', user.id)
              .eq('status', 'active'),
            // Posts and metrics
            supabase
              .from('posts')
              .select('*, content_analytics (*)')
              .eq('creator_id', user.id)
              .order('created_at', { ascending: false })
          ]);

          if (earnError) throw earnError;
          if (countError) throw countError;
          if (postsError) throw postsError;

          // Calculate metrics
          const totalViews = posts?.reduce((sum, post) => {
            const viewMetric = post.content_analytics?.find(m => m.metric_type === 'view');
            return sum + (viewMetric?.value || 0);
          }, 0) || 0;

          const totalLikes = posts?.reduce((sum, post) => {
            const likeMetric = post.content_analytics?.find(m => m.metric_type === 'like');
            return sum + (likeMetric?.value || 0);
          }, 0) || 0;

          const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

          // Monthly earnings data
          const monthlyData = earnings?.reduce((acc, record) => {
            const month = new Date(record.timestamp).toLocaleString('default', { month: 'short' });
            const existing = acc.find(d => d.month === month);
            if (existing) {
              existing.earnings += record.amount;
            } else {
              acc.push({ month, earnings: record.amount });
            }
            return acc;
          }, [] as Array<{ month: string; earnings: number }>);

          // Content performance by type
          const contentPerformance = posts?.reduce((acc, post) => {
            const type = post.content_type || 'other';
            const existing = acc.find(d => d.type === type);
            if (existing) {
              existing.total++;
            } else {
              acc.push({ type, total: 1 });
            }
            return acc;
          }, [] as Array<{ type: string; total: number }>);

          // Recent earnings data
          const recentEarnings = earnings?.map(record => ({
            date: record.timestamp,
            amount: record.amount
          })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

          // Update creator stats
          setStats(prev => ({
            ...prev,
            totalEarnings: earnings?.reduce((sum, e) => sum + e.amount, 0) || 0,
            totalSubscribers: subscriberCount || 0,
            totalPosts: posts?.length || 0,
            totalViews,
            monthlyEarnings: monthlyData?.[monthlyData.length - 1]?.earnings || 0,
            engagementRate,
            recentEarnings,
            monthlyData: monthlyData || [],
            topPosts: posts?.slice(0, 5) || [],
            contentPerformance: contentPerformance || []
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        if (error instanceof PostgrestError) {
          setError(error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user, profile?.is_creator]);

  return { stats, loading, error };
};
