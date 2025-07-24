import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStats } from '@/components/RealDataLoader';
import ModernHeader from '@/components/ModernHeader';
import ModernSidebar from '@/components/ModernSidebar';
import ModernPostCard from '@/components/ModernPostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Camera, Star, DollarSign, TrendingUp, Users, Heart, Plus } from 'lucide-react';

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
  content_type: string;
  is_premium: boolean;
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
  const { user, profile, becomeCreator } = useAuth();
  const { stats: platformStats, loading: statsLoading } = usePlatformStats();
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [becomingCreator, setBecomingCreator] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent published posts
        const postsResponse = await fetch('/api/posts');
        const postsData = await postsResponse.json();
        setPosts(postsData || []);

        // Fetch creators
        const creatorsResponse = await fetch('/api/creators');
        const creatorsData = await creatorsResponse.json();
        setCreators(creatorsData || []);
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

  const handleBecomeCreator = async () => {
    setBecomingCreator(true);
    try {
      await becomeCreator(9.99, ['general']);
      toast.success('Welcome to creators! Your creator account has been activated.');
    } catch (error) {
      console.error('Error becoming creator:', error);
      toast.error('Failed to activate creator account. Please try again.');
    } finally {
      setBecomingCreator(false);
    }
  };

  const handlePostAction = async (postId: string, action: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast.success(`${action} successful`);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      toast.error(`Failed to ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <div className="flex">
        <ModernSidebar creators={creators} isCreator={profile?.is_creator} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="text-center py-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.display_name}!
              </h1>
              <p className="text-muted-foreground">
                Discover amazing content from your favorite creators
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-blue text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Posts</p>
                      <p className="text-2xl font-bold">{posts.length}</p>
                    </div>
                    <Camera className="w-8 h-8 opacity-75" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-purple text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Creators</p>
                      <p className="text-2xl font-bold">{creators.length}</p>
                    </div>
                    <Users className="w-8 h-8 opacity-75" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-pink text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Trending</p>
                      <p className="text-2xl font-bold">Hot</p>
                    </div>
                    <TrendingUp className="w-8 h-8 opacity-75" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Become Creator CTA */}
            {!profile?.is_creator && (
              <Card className="bg-gradient-primary text-white mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        Start earning with your content
                      </h3>
                      <p className="opacity-90">
                        Join thousands of creators sharing their passion and earning money
                      </p>
                    </div>
                    <Button
                      onClick={handleBecomeCreator}
                      disabled={becomingCreator}
                      className="bg-white text-primary hover:bg-gray-100"
                    >
                      {becomingCreator ? 'Creating...' : 'Become Creator'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Tabs */}
            <Tabs defaultValue="for-you" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="for-you">For You</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>
              
              <TabsContent value="for-you" className="space-y-6 mt-6">
                {filteredPosts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground">
                        Follow some creators to see their content here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post) => (
                    <ModernPostCard
                      key={post.id}
                      post={post}
                      onLike={(postId) => handlePostAction(postId, 'like')}
                      onShare={(postId) => handlePostAction(postId, 'share')}
                      onBookmark={(postId) => handlePostAction(postId, 'bookmark')}
                      onPurchase={(postId) => handlePostAction(postId, 'purchase')}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="following" className="space-y-6 mt-6">
                <Card className="p-8 text-center">
                  <CardContent>
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No following yet</h3>
                    <p className="text-muted-foreground">
                      Start following creators to see their content here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trending" className="space-y-6 mt-6">
                <Card className="p-8 text-center">
                  <CardContent>
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Trending Content</h3>
                    <p className="text-muted-foreground">
                      Discover what's hot right now
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
