
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorStats {
  totalEarnings: number;
  totalSubscribers: number;
  totalPosts: number;
  monthlyEarnings: number;
  recentSubscribers: number;
  engagementRate: number;
}

export const useCreatorStats = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<CreatorStats>({
    totalEarnings: 0,
    totalSubscribers: 0,
    totalPosts: 0,
    monthlyEarnings: 0,
    recentSubscribers: 0,
    engagementRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !profile?.is_creator) {
        setLoading(false);
        return;
      }

      try {
        // Get creator profile stats
        const { data: creatorProfile } = await supabase
          .from('creator_profiles')
          .select('total_earnings, total_subscribers, total_posts')
          .eq('user_id', user.id)
          .single();

        if (creatorProfile) {
          // Get monthly earnings (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: monthlyTips } = await supabase
            .from('tips')
            .select('amount')
            .eq('creator_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          const { data: monthlySubscriptions } = await supabase
            .from('user_subscriptions')
            .select('amount_paid')
            .eq('creator_id', user.id)
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
            .eq('creator_id', user.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .eq('status', 'active');

          // Calculate engagement rate (likes per post)
          const { data: posts } = await supabase
            .from('posts')
            .select('like_count')
            .eq('creator_id', user.id);

          const totalLikes = posts?.reduce((sum, post) => sum + post.like_count, 0) || 0;
          const engagementRate = posts?.length ? (totalLikes / posts.length) : 0;

          setStats({
            totalEarnings: creatorProfile.total_earnings,
            totalSubscribers: creatorProfile.total_subscribers,
            totalPosts: creatorProfile.total_posts,
            monthlyEarnings,
            recentSubscribers: recentSubscribers || 0,
            engagementRate,
          });
        }
      } catch (error) {
        console.error('Error fetching creator stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, profile]);

  return { stats, loading };
};
