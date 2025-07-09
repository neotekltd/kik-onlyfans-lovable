import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserDashboardStats {
  // For regular users
  totalSubscriptions: number;
  totalSpent: number;
  recentActivity: any[];
  favoriteCreators: any[];
  // For creators
  totalEarnings: number;
  totalSubscribers: number;
  totalPosts: number;
  totalViews: number;
  monthlyEarnings: number;
  recentSubscribers: number;
  engagementRate: number;
  recentEarnings: any[];
  topPosts: any[];
  // Chart data
  monthlyData: any[];
  contentPerformance: any[];
}

export const useUserDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<UserDashboardStats>({
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
    contentPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const isCreator = profile?.is_creator;

        if (isCreator) {
          // Fetch creator-specific data
          await fetchCreatorData();
        } else {
          // Fetch regular user data
          await fetchRegularUserData();
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCreatorData = async () => {
      // Get creator profile stats
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('total_earnings, total_subscribers, total_posts')
        .eq('user_id', user?.id)
        .single();

      // Get total views from all posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('view_count, like_count, comment_count, created_at, title, content_type')
        .eq('creator_id', user?.id);

      const totalViews = postsData?.reduce((sum, post) => sum + post.view_count, 0) || 0;
      const totalLikes = postsData?.reduce((sum, post) => sum + post.like_count, 0) || 0;
      const engagementRate = postsData?.length ? (totalLikes / postsData.length) : 0;

      // Get monthly earnings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: monthlyTips } = await supabase
        .from('tips')
        .select('amount, created_at')
        .eq('creator_id', user?.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: monthlySubscriptions } = await supabase
        .from('user_subscriptions')
        .select('amount_paid, created_at')
        .eq('creator_id', user?.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'active');

      const monthlyEarnings = (monthlyTips?.reduce((sum, tip) => sum + tip.amount, 0) || 0) +
                            (monthlySubscriptions?.reduce((sum, sub) => sum + sub.amount_paid, 0) || 0);

      // Get recent subscribers (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentSubscribers } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact' })
        .eq('creator_id', user?.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('status', 'active');

      // Get recent earnings for the list
      const { data: recentEarnings } = await supabase
        .from('tips')
        .select(`
          id, amount, created_at, message,
          profiles!tips_tipper_id_fkey(display_name, avatar_url)
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Generate monthly chart data for the last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: monthTips } = await supabase
          .from('tips')
          .select('amount')
          .eq('creator_id', user?.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: monthSubs } = await supabase
          .from('user_subscriptions')
          .select('amount_paid')
          .eq('creator_id', user?.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const monthEarnings = (monthTips?.reduce((sum, tip) => sum + tip.amount, 0) || 0) +
                            (monthSubs?.reduce((sum, sub) => sum + sub.amount_paid, 0) || 0);

        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          earnings: monthEarnings / 100, // Convert to dollars
          subscribers: creatorProfile?.total_subscribers || 0, // Real subscriber count
        });
      }

      // Generate content performance data
      const contentTypes: ('photo' | 'video' | 'audio')[] = ['photo', 'video', 'audio'];
      const contentPerformance = [];

      for (const type of contentTypes) {
        const { data: typePosts } = await supabase
          .from('posts')
          .select('view_count, like_count, comment_count')
          .eq('creator_id', user?.id)
          .eq('content_type', type);

        if (typePosts && typePosts.length > 0) {
          const totalViews = typePosts.reduce((sum, post) => sum + post.view_count, 0);
          const totalLikes = typePosts.reduce((sum, post) => sum + post.like_count, 0);
          const avgEngagement = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

          contentPerformance.push({
            type: type.charAt(0).toUpperCase() + type.slice(1) + 's',
            posts: typePosts.length,
            views: totalViews,
            likes: totalLikes,
            engagement: avgEngagement,
          });
        }
      }

      setStats(prev => ({
        ...prev,
        totalEarnings: creatorProfile?.total_earnings || 0,
        totalSubscribers: creatorProfile?.total_subscribers || 0,
        totalPosts: creatorProfile?.total_posts || 0,
        totalViews,
        monthlyEarnings,
        recentSubscribers: recentSubscribers || 0,
        engagementRate,
        recentEarnings: recentEarnings || [],
        topPosts: postsData?.slice(0, 5) || [],
        monthlyData,
        contentPerformance,
      }));
    };

    const fetchRegularUserData = async () => {
      // Get user's subscriptions
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
          id, amount_paid, created_at, status,
          profiles!user_subscriptions_creator_id_fkey(display_name, avatar_url, username)
        `)
        .eq('subscriber_id', user?.id)
        .order('created_at', { ascending: false });

      const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active') || [];
      const totalSpent = subscriptions?.reduce((sum, sub) => sum + sub.amount_paid, 0) || 0;

      // Get recent tips sent
      const { data: recentTips } = await supabase
        .from('tips')
        .select(`
          id, amount, created_at, message,
          profiles!tips_creator_id_fkey(display_name, avatar_url, username)
        `)
        .eq('tipper_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get favorite creators (most tipped/subscribed to)
      const { data: favoriteCreators } = await supabase
        .from('tips')
        .select(`
          creator_id,
          profiles!tips_creator_id_fkey(display_name, avatar_url, username, is_verified)
        `)
        .eq('tipper_id', user?.id);

      // Group by creator and count tips
      const creatorTipCounts = favoriteCreators?.reduce((acc, tip) => {
        if (tip.profiles) {
          const creatorId = tip.creator_id;
          acc[creatorId] = (acc[creatorId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const topCreators = Object.entries(creatorTipCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([creatorId]) => favoriteCreators?.find(tip => tip.creator_id === creatorId)?.profiles)
        .filter(Boolean);

      setStats(prev => ({
        ...prev,
        totalSubscriptions: activeSubscriptions.length,
        totalSpent,
        recentActivity: [...(recentTips || []), ...(subscriptions || [])].slice(0, 10),
        favoriteCreators: topCreators,
      }));
    };

    fetchUserStats();
  }, [user, profile]);

  return { stats, loading };
};