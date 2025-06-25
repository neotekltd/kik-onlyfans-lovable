
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformStats } from '@/components/RealDataLoader';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import CreatorCard from '@/components/CreatorCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Heart, Users, DollarSign, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
  bio?: string;
  total_subscribers?: number;
  subscription_price?: number;
}

interface Post {
  id: string;
  title?: string;
  description?: string;
  media_urls?: string[];
  thumbnail_url?: string;
  is_ppv: boolean;
  ppv_price?: number;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  creator_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats: platformStats, loading: statsLoading } = usePlatformStats();
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent published posts with creator profiles
        const { data: postsData } = await supabase
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
          .limit(20);

        setPosts(postsData as Post[] || []);

        // Fetch top creators
        const { data: creatorsData } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            bio,
            creator_profiles (
              total_subscribers,
              subscription_price
            )
          `)
          .eq('is_creator', true)
          .order('created_at', { ascending: false })
          .limit(10);

        const formattedCreators = creatorsData?.map(creator => ({
          id: creator.id,
          username: creator.username,
          display_name: creator.display_name,
          avatar_url: creator.avatar_url,
          is_verified: creator.is_verified,
          bio: creator.bio,
          total_subscribers: creator.creator_profiles?.[0]?.total_subscribers || 0,
          subscription_price: creator.creator_profiles?.[0]?.subscription_price || 0
        })) || [];

        setCreators(formattedCreators);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    !searchQuery || 
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter creators based on search query
  const filteredCreators = creators.filter(creator =>
    !searchQuery ||
    creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back{user ? `, ${user.email?.split('@')[0]}` : ''}!
              </h1>
              <p className="text-gray-600 mt-2">
                Discover amazing content from creators around the world
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search creators, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>

          {/* Platform Stats */}
          {platformStats && !statsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.totalUsers.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Creators</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.totalCreators.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Posts</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.totalPosts.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Subs</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.activeSubscriptions.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>

          <TabsContent value="for-you" className="mt-6">
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create content!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="space-y-6">
              {filteredPosts
                .sort((a, b) => (b.like_count + b.view_count) - (a.like_count + a.view_count))
                .slice(0, 10)
                .map((post) => (
                  <div key={post.id} className="relative">
                    <PostCard post={post} />
                    <Badge className="absolute top-4 right-4 bg-orange-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="creators" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No creators found</h3>
                      <p className="text-gray-500">
                        {searchQuery ? 'Try adjusting your search terms' : 'No creators available yet'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
