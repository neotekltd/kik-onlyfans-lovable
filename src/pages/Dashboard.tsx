import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformStats } from '@/components/RealDataLoader';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PlatformStatsGrid from '@/components/dashboard/PlatformStatsGrid';
import ContentTabs from '@/components/dashboard/ContentTabs';
import UserDashboardView from '@/components/dashboard/UserDashboardView';
import { toast } from 'sonner';
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
      toast.success('Welcome to creators! Your creator account has been activated.');
    } catch (error) {
      console.error('Error becoming creator:', error);
      toast.error('Failed to activate creator account. Please try again.');
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

        {/* Show different content based on user type */}
        {!profile?.is_creator ? (
          <UserDashboardView
            onBecomeCreator={handleBecomeCreator}
            isBecomingCreator={becomingCreator}
          />
        ) : (
          <ContentTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filteredPosts={filteredPosts}
            filteredCreators={filteredCreators}
            searchQuery={searchQuery}
          />
        )}

      </main>
    </div>
  );
};

export default Dashboard;
