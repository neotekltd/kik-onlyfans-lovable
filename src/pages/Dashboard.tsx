import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformStats } from '@/components/RealDataLoader';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PlatformStatsGrid from '@/components/dashboard/PlatformStatsGrid';
import ContentTabs from '@/components/dashboard/ContentTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Star, DollarSign } from 'lucide-react';

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
  const { toast } = useToast();

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

  const handleBecomeCreator = async () => {
    setBecomingCreator(true);
    try {
      await becomeCreator(9.99, ['general']);
      toast({
        title: "Welcome to creators!",
        description: "Your creator account has been activated. You can now start creating content!",
      });
    } catch (error) {
      console.error('Error becoming creator:', error);
      toast({
        title: "Error",
        description: "Failed to activate creator account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBecomingCreator(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <DashboardHeader
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <PlatformStatsGrid
          stats={platformStats}
          loading={statsLoading}
        />

        {/* Become a Creator Section - Only show for non-creators */}
        {!profile?.is_creator && (
          <Card className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-6 w-6" />
                Ready to Become a Creator?
              </CardTitle>
              <CardDescription className="text-purple-100">
                Start earning money by sharing your content with fans around the world
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                  <Camera className="h-8 w-8 text-white" />
                  <div>
                    <h3 className="font-semibold">Share Content</h3>
                    <p className="text-sm text-purple-100">Photos, videos, and live streams</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                  <DollarSign className="h-8 w-8 text-white" />
                  <div>
                    <h3 className="font-semibold">Earn Money</h3>
                    <p className="text-sm text-purple-100">Tips, subscriptions, and PPV</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                  <Star className="h-8 w-8 text-white" />
                  <div>
                    <h3 className="font-semibold">Build Fanbase</h3>
                    <p className="text-sm text-purple-100">Connect with your audience</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleBecomeCreator}
                disabled={becomingCreator}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                {becomingCreator ? 'Activating...' : 'Become a Creator'}
              </Button>
            </CardContent>
          </Card>
        )}

        <ContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filteredPosts={filteredPosts}
          filteredCreators={filteredCreators}
          searchQuery={searchQuery}
        />
      </main>
    </div>
  );
};

export default Dashboard;
