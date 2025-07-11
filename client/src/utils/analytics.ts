
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  contentId: string;
  contentType: 'post' | 'live_stream' | 'message';
  metricType: 'view' | 'like' | 'comment' | 'share' | 'tip';
  value?: number;
  userId?: string;
}

export const trackAnalyticsEvent = async (event: AnalyticsEvent) => {
  try {
    const { error } = await supabase
      .from('content_analytics')
      .insert([{
        content_id: event.contentId,
        content_type: event.contentType,
        metric_type: event.metricType,
        value: event.value || 1,
        user_id: event.userId
      }]);

    if (error) {
      console.error('Error tracking analytics event:', error);
    }
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
};

export const trackUserActivity = async (
  activityType: string,
  targetId?: string,
  targetType?: string,
  metadata?: any
) => {
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert([{
        activity_type: activityType,
        target_id: targetId,
        target_type: targetType,
        metadata
      }]);

    if (error) {
      console.error('Error tracking user activity:', error);
    }
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
};

export const getContentAnalytics = async (
  contentId: string,
  contentType: string,
  timeRange?: { start: Date; end: Date }
) => {
  try {
    let query = supabase
      .from('content_analytics')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (timeRange) {
      query = query
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate metrics
    const analytics = data?.reduce(
      (acc, event) => {
        acc[event.metric_type] = (acc[event.metric_type] || 0) + (event.value || 1);
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    return analytics;
  } catch (error) {
    console.error('Error getting content analytics:', error);
    return {};
  }
};

export const getCreatorAnalytics = async (creatorId: string, timeRange?: { start: Date; end: Date }) => {
  try {
    // Get posts analytics - simplified approach to avoid complex joins
    let postsQuery = supabase
      .from('posts')
      .select('id')
      .eq('creator_id', creatorId);

    if (timeRange) {
      postsQuery = postsQuery
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());
    }

    const { data: postsData, error: postsError } = await postsQuery;

    if (postsError) throw postsError;

    // Get analytics for these posts
    const postIds = postsData?.map(post => post.id) || [];
    let analyticsData: any[] = [];

    if (postIds.length > 0) {
      const { data: analytics, error: analyticsError } = await supabase
        .from('content_analytics')
        .select('*')
        .in('content_id', postIds)
        .eq('content_type', 'post');

      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      } else {
        analyticsData = analytics || [];
      }
    }

    // Get revenue data
    let revenueQuery = supabase
      .from('revenue_records')
      .select('*')
      .eq('creator_id', creatorId);

    if (timeRange) {
      revenueQuery = revenueQuery
        .gte('processed_at', timeRange.start.toISOString())
        .lte('processed_at', timeRange.end.toISOString());
    }

    const { data: revenueData, error: revenueError } = await revenueQuery;

    if (revenueError) throw revenueError;

    // Process analytics data
    const totalViews = analyticsData.filter(a => a.metric_type === 'view')
      .reduce((sum, view) => sum + (view.value || 1), 0);

    const totalLikes = analyticsData.filter(a => a.metric_type === 'like')
      .reduce((sum, like) => sum + (like.value || 1), 0);

    const totalRevenue = revenueData?.reduce((total, record) => total + record.net_amount, 0) || 0;

    return {
      totalViews,
      totalLikes,
      totalRevenue,
      revenueData: revenueData || [],
      engagementRate: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0
    };
  } catch (error) {
    console.error('Error getting creator analytics:', error);
    return {
      totalViews: 0,
      totalLikes: 0,
      totalRevenue: 0,
      revenueData: [],
      engagementRate: 0
    };
  }
};
