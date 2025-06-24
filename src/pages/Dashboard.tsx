
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/PostCard';
import CreatorCard from '@/components/CreatorCard';
import { DollarSign, Users, Heart, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

const Dashboard: React.FC = () => {
  const { user, profile, creatorProfile } = useAuth();
  const { stats, loading: statsLoading } = useCreatorStats();
  const navigate = useNavigate();
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [subscribedCreators, setSubscribedCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch feed posts (from subscribed creators or trending)
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
          .order('created_at', { ascending: false })
          .limit(10);

        setFeedPosts(posts || []);

        // Fetch subscribed creators
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select(`
            creator_id,
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

        // Get creator profile data separately for each subscribed creator
        const creatorsWithStats = await Promise.all(
          (subscriptions || []).map(async (sub) => {
            const { data: creatorProfile } = await supabase
              .from('creator_profiles')
              .select('subscription_price, total_subscribers, content_categories')
              .eq('user_id', sub.creator_id)
              .single();

            return {
              ...sub.profiles,
              subscriber_count: creatorProfile?.total_subscribers || 0,
              subscription_price: creatorProfile?.subscription_price || 0,
              categories: creatorProfile?.content_categories || [],
            };
          })
        );

        setSubscribedCreators(creatorsWithStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {profile?.display_name}!
            </h1>
            <p className="text-gray-600">
              {profile?.is_creator 
                ? "Manage your content and track your earnings" 
                : "Discover amazing creators and exclusive content"
              }
            </p>
          </div>

          {/* Creator Stats (if user is a creator) */}
          {profile?.is_creator && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(stats.totalEarnings / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +${(stats.monthlyEarnings / 100).toFixed(2)} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.recentSubscribers} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.engagementRate.toFixed(1)} avg likes per post
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.recentSubscribers > 0 ? '+' : ''}{stats.recentSubscribers}
                  </div>
                  <p className="text-xs text-muted-foreground">New subscribers</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              {profile?.is_creator && (
                <Button onClick={() => navigate('/creator')} className="gradient-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/messages')}>
                Messages
              </Button>
              <Button variant="outline" onClick={() => navigate('/subscriptions')}>
                Subscriptions
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
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
                        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                        <p className="text-gray-600 mb-4">
                          Follow some creators to see their content in your feed!
                        </p>
                        <Button onClick={() => navigate('/')}>
                          Discover Creators
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subscribedCreators.length > 0 ? (
                        <div className="space-y-3">
                          {subscribedCreators.slice(0, 3).map((creator) => (
                            <div key={creator.id} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-50 to-creator-50 flex items-center justify-center">
                                {creator.display_name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{creator.display_name}</p>
                                <p className="text-xs text-gray-500">@{creator.username}</p>
                              </div>
                            </div>
                          ))}
                          {subscribedCreators.length > 3 && (
                            <Button variant="ghost" size="sm" className="w-full">
                              View all {subscribedCreators.length} subscriptions
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          No subscriptions yet. Start following creators to see their content!
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
                    <h3 className="text-lg font-semibold mb-2">Not following anyone yet</h3>
                    <p className="text-gray-600 mb-4">
                      Discover amazing creators and start following them!
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
                <p className="text-gray-600 mb-8">
                  Find amazing content creators and exclusive content
                </p>
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
