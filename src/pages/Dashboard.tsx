
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { usePlatformStats, useRealUserActivity } from '@/components/RealDataLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/PostCard';
import CreatorCard from '@/components/CreatorCard';
import { DollarSign, Users, Heart, TrendingUp, Plus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { formatDistanceToNow } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user, profile, creatorProfile } = useAuth();
  const { stats: creatorStats, loading: statsLoading } = useCreatorStats();
  const { stats: platformStats } = usePlatformStats();
  const { activity: userActivity } = useRealUserActivity();
  const navigate = useNavigate();
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [subscribedCreators, setSubscribedCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch real feed posts with engagement data
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              username,
              display_name,
              avatar_url,
              is_verified
            )
          `)
          .eq('is_published', true)
          .gte('view_count', 1) // Only show posts with actual views
          .order('created_at', { ascending: false })
          .limit(15);

        // Get posts with actual engagement
        const postsWithEngagement = posts?.filter(post => 
          post.like_count > 0 || post.comment_count > 0 || post.view_count > 0
        ) || [];

        setFeedPosts(postsWithEngagement);

        // Fetch real subscribed creators with their actual stats
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select(`
            creator_id,
            created_at,
            amount_paid,
            profiles!user_subscriptions_creator_id_fkey (
              id,
              username,
              display_name,
              avatar_url,
              bio,
              is_verified
            )
          `)
          .eq('subscriber_id', user.id)
          .eq('status', 'active');

        // Get real creator profile data
        const creatorsWithRealStats = await Promise.all(
          (subscriptions || []).map(async (sub) => {
            const { data: creatorProfile } = await supabase
              .from('creator_profiles')
              .select('subscription_price, total_subscribers, content_categories, total_posts')
              .eq('user_id', sub.creator_id)
              .single();

            // Get recent posts count for this creator
            const { count: recentPosts } = await supabase
              .from('posts')
              .select('*', { count: 'exact' })
              .eq('creator_id', sub.creator_id)
              .eq('is_published', true)
              .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            return {
              ...sub.profiles,
              subscriber_count: creatorProfile?.total_subscribers || 0,
              subscription_price: creatorProfile?.subscription_price || 0,
              categories: creatorProfile?.content_categories || [],
              total_posts: creatorProfile?.total_posts || 0,
              recent_posts: recentPosts || 0,
              subscription_date: sub.created_at,
              amount_paid: sub.amount_paid
            };
          })
        );

        setSubscribedCreators(creatorsWithRealStats);
      } catch (error) {
        console.error('Error fetching real dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealDashboardData();
  }, [user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Real User Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {profile?.display_name}!
            </h1>
            <p className="text-gray-600">
              {profile?.is_creator 
                ? `You've earned $${(creatorStats.totalEarnings / 100).toFixed(2)} and have ${creatorStats.totalSubscribers} subscribers`
                : userActivity ? `You've supported ${userActivity.activeSubscriptions?.length || 0} creators and spent $${(userActivity.totalSpent / 100).toFixed(2)} total` : "Discover amazing creators and exclusive content"
              }
            </p>
          </div>

          {/* Real Creator Stats */}
          {profile?.is_creator && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(creatorStats.totalEarnings / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +${(creatorStats.monthlyEarnings / 100).toFixed(2)} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.totalSubscribers}</div>
                  <p className="text-xs text-muted-foreground">
                    {creatorStats.recentSubscribers > 0 ? '+' : ''}{creatorStats.recentSubscribers} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">
                    {creatorStats.engagementRate.toFixed(1)} avg likes per post
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {creatorStats.recentSubscribers > 0 ? '+' : ''}{creatorStats.recentSubscribers}
                  </div>
                  <p className="text-xs text-muted-foreground">New subscribers this week</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Platform Insights for Non-Creators */}
          {!profile?.is_creator && platformStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.totalCreators}</div>
                  <p className="text-xs text-muted-foreground">Active creators</p>
                  <div className="text-lg font-semibold mt-2">{platformStats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Total posts published</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userActivity?.activeSubscriptions?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Active subscriptions</p>
                  <div className="text-lg font-semibold mt-2">{userActivity?.recentLikes?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Posts liked recently</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Trending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {platformStats.topCategories.slice(0, 3).map((category, index) => (
                      <Badge key={index} variant="secondary" className="mr-1 mb-1">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Real Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              {profile?.is_creator && (
                <Button onClick={() => navigate('/creator')} className="gradient-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/messages')}>
                Messages {userActivity?.recentComments?.length ? `(${userActivity.recentComments.length})` : ''}
              </Button>
              <Button variant="outline" onClick={() => navigate('/subscriptions')}>
                Subscriptions {subscribedCreators.length ? `(${subscribedCreators.length})` : ''}
              </Button>
            </div>
          </div>

          {/* Real Content Feed */}
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList>
              <TabsTrigger value="feed">Feed {feedPosts.length ? `(${feedPosts.length})` : ''}</TabsTrigger>
              <TabsTrigger value="following">Following {subscribedCreators.length ? `(${subscribedCreators.length})` : ''}</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {feedPosts.length > 0 ? (
                    feedPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                        <p className="text-gray-600 mb-4">
                          Subscribe to creators to see their latest content in your feed
                        </p>
                        <Button onClick={() => navigate('/')}>
                          Browse Creators
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Subscriptions</CardTitle>
                      <CardDescription>
                        {subscribedCreators.length > 0 ? `${subscribedCreators.length} active subscriptions` : 'No active subscriptions'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscribedCreators.length > 0 ? (
                        <div className="space-y-3">
                          {subscribedCreators.slice(0, 4).map((creator) => (
                            <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-50 to-creator-50 flex items-center justify-center">
                                {creator.display_name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{creator.display_name}</p>
                                <p className="text-xs text-gray-500">
                                  @{creator.username} • {creator.recent_posts} new posts
                                </p>
                                <p className="text-xs text-gray-400">
                                  Subscribed {formatDistanceToNow(new Date(creator.subscription_date))} ago
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Start following creators to see their exclusive content!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="following" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscribedCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
              {subscribedCreators.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
                    <p className="text-gray-600 mb-4">
                      Discover amazing creators and start supporting them!
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Creators
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Discover New Creators</h2>
                <p className="text-gray-600 mb-4">
                  {platformStats ? `${platformStats.totalCreators} creators with ${platformStats.totalPosts} posts` : 'Find amazing content creators'}
                </p>
                {platformStats?.topCategories && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">Trending categories:</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {platformStats.topCategories.map((category, index) => (
                        <Badge key={index} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={() => navigate('/')} size="lg" className="gradient-bg">
                  Explore Now
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
