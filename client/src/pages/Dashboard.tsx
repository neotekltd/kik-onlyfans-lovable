import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStats, useRealUserActivity } from '@/components/RealDataLoader';
import ModernPostCard from '@/components/ModernPostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Camera, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Heart, 
  Plus,
  Search,
  Bell,
  MessageCircle,
  Settings,
  Home,
  Bookmark,
  Lock,
  ChevronRight,
  Calendar,
  Clock,
  Grid,
  List,
  Shield
} from 'lucide-react';

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
  const { activity, loading: activityLoading } = useRealUserActivity();
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [becomingCreator, setBecomingCreator] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch posts with creator profiles
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:creator_id (
              username,
              display_name,
              avatar_url,
              is_verified
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
        } else {
          // Transform the data to match expected format
          const transformedPosts = postsData?.map(post => ({
            ...post,
            profiles: post.profiles as any,
            like_count: 0, // Will be fetched separately if needed
            comment_count: 0,
            view_count: 0
          })) || [];
          setPosts(transformedPosts);
        }

        // Fetch creator profiles
        const { data: creatorsData, error: creatorsError } = await supabase
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
          .limit(10);

        if (creatorsError) {
          console.error('Error fetching creators:', creatorsError);
        } else {
          // Transform creator data
          const transformedCreators = creatorsData?.map(creator => ({
            ...creator,
            total_subscribers: creator.creator_profiles?.[0]?.total_subscribers || 0,
            subscription_price: creator.creator_profiles?.[0]?.subscription_price || 0
          })) || [];
          setCreators(transformedCreators);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter posts based on search query
  const filteredPosts = Array.isArray(posts) ? posts.filter(post => 
    !searchQuery || 
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Filter creators based on search query
  const filteredCreators = Array.isArray(creators) ? creators.filter(creator =>
    !searchQuery ||
    creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

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
    if (!user) {
      toast.error('Please log in to perform this action');
      return;
    }

    try {
      let success = false;
      
      switch (action) {
        case 'like':
          // Check if already liked
          const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

          if (existingLike) {
            // Unlike
            const { error: unlikeError } = await supabase
              .from('post_likes')
              .delete()
              .eq('post_id', postId)
              .eq('user_id', user.id);
            
            if (!unlikeError) {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === postId ? { ...post, like_count: Math.max(0, post.like_count - 1) } : post
                )
              );
              toast.success('Post unliked');
              success = true;
            }
          } else {
            // Like
            const { error: likeError } = await supabase
              .from('post_likes')
              .insert({ post_id: postId, user_id: user.id });
            
            if (!likeError) {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === postId ? { ...post, like_count: post.like_count + 1 } : post
                )
              );
              toast.success('Post liked');
              success = true;
            }
          }
          break;

        case 'bookmark':
          // Check if already bookmarked
          const { data: existingBookmark } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

          if (existingBookmark) {
            // Remove bookmark
            const { error: removeError } = await supabase
              .from('bookmarks')
              .delete()
              .eq('post_id', postId)
              .eq('user_id', user.id);
            
            if (!removeError) {
              toast.success('Bookmark removed');
              success = true;
            }
          } else {
            // Add bookmark
            const { error: addError } = await supabase
              .from('bookmarks')
              .insert({ post_id: postId, user_id: user.id });
            
            if (!addError) {
              toast.success('Post bookmarked');
              success = true;
            }
          }
          break;

        case 'share':
          // Copy link to clipboard
          if (navigator.share) {
            await navigator.share({
              title: 'Check out this post on KikStars',
              url: `${window.location.origin}/post/${postId}`
            });
          } else {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
            toast.success('Link copied to clipboard');
          }
          success = true;
          break;

        case 'purchase':
          // Handle PPV purchase
          toast.info('PPV purchase functionality coming soon');
          success = true;
          break;

        default:
          toast.error('Unknown action');
      }

      if (!success && action !== 'share') {
        toast.error(`Failed to ${action} post`);
      }

    } catch (error) {
      console.error(`Error ${action}:`, error);
      toast.error(`Failed to ${action} post`);
    }
  };

  const handleSubscribe = async (creatorId: string, creatorName: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      // Check if already subscribed
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();

      if (existingSub) {
        toast.info(`You're already subscribed to ${creatorName}`);
        return;
      }

      // Create subscription (simplified - in real app would handle payment)
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          subscriber_id: user.id,
          creator_id: creatorId,
          amount_paid: 999, // $9.99 in cents
          status: 'active',
          billing_cycle: 'monthly'
        });

      if (error) throw error;

      toast.success(`Successfully subscribed to ${creatorName}!`);
      
      // Update creator subscriber count
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('total_subscribers')
        .eq('user_id', creatorId)
        .single();

      if (creatorProfile) {
        await supabase
          .from('creator_profiles')
          .update({ total_subscribers: creatorProfile.total_subscribers + 1 })
          .eq('user_id', creatorId);
      }

    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe. Please try again.');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const navigateTo = (path: string) => {
    // For now, show toast indicating navigation would happen
    toast.info(`Navigating to ${path}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13151a]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading your feed...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13151a] text-white">
      {/* Header */}
      <header className="bg-[#0f1015] border-b border-[#2c2e36] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[#00aff0]">KikStars</h1>
          </div>

          {/* Search */}
          <div className="hidden md:flex relative w-1/3 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search creators and content..."
              className="pl-10 bg-[#1e2029] border-[#2c2e36] text-white w-full rounded-full focus:ring-[#00aff0] focus:border-[#00aff0]"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-5">
            <button 
              className="text-gray-300 hover:text-white" 
              aria-label="Notifications"
              onClick={() => navigateTo('/notifications')}
            >
              <Bell className="h-6 w-6" />
            </button>
            <button 
              className="text-gray-300 hover:text-white" 
              aria-label="Messages"
              onClick={() => navigateTo('/messages')}
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            <button 
              className="text-gray-300 hover:text-white" 
              aria-label="Bookmarks"
              onClick={() => setActiveTab('bookmarks')}
            >
              <Bookmark className="h-6 w-6" />
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <img 
                src={profile?.avatar_url || '/placeholder.svg'} 
                alt={profile?.display_name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-[240px] bg-[#0f1015] border-r border-[#2c2e36] h-[calc(100vh-64px)] sticky top-16 overflow-y-auto pt-6">
          <nav className="px-4">
            <ul className="space-y-1">
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'for-you' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('for-you'); }}
                >
                  <Home className="h-5 w-5 mr-3" />
                  <span>For You</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'following' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('following'); }}
                >
                  <Users className="h-5 w-5 mr-3" />
                  <span>Following</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'trending' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('trending'); }}
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  <span>Trending</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'bookmarks' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('bookmarks'); }}
                >
                  <Bookmark className="h-5 w-5 mr-3" />
                  <span>Bookmarks</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'settings' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); navigateTo('/settings'); }}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span>Settings</span>
                </a>
              </li>
            </ul>

            <Separator className="my-6 bg-[#2c2e36]" />

            {/* Platform Stats */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 px-3 mb-2">PLATFORM STATS</h3>
              {platformStats && (
                <div className="px-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Creators</span>
                    <span>{platformStats.totalCreators}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Posts</span>
                    <span>{platformStats.totalPosts}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Users</span>
                    <span>{platformStats.totalUsers}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6 bg-[#2c2e36]" />

            {/* Subscriptions section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 px-3 mb-2">SUBSCRIPTIONS</h3>
              {filteredCreators.length > 0 ? (
                <ul className="space-y-1">
                  {filteredCreators.slice(0, 5).map((creator) => (
                    <li key={creator.id}>
                      <a 
                        href="#" 
                        className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[#1e2029]"
                        onClick={(e) => { e.preventDefault(); navigateTo(`/creator/${creator.username}`); }}
                      >
                        <div className="h-6 w-6 rounded-full overflow-hidden mr-3">
                          <img 
                            src={creator.avatar_url || '/placeholder.svg'} 
                            alt={creator.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="truncate">{creator.display_name}</span>
                      </a>
                    </li>
                  ))}
                  {filteredCreators.length > 5 && (
                    <li>
                      <a 
                        href="#" 
                        className="flex items-center px-3 py-2 text-sm text-[#00aff0] hover:underline"
                        onClick={(e) => { e.preventDefault(); navigateTo('/subscriptions'); }}
                      >
                        Show more
                      </a>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 px-3">No subscriptions yet</p>
              )}
            </div>

            {/* Become creator button */}
            {!profile?.is_creator && (
              <div className="px-3 mt-6">
                <Button 
                  onClick={handleBecomeCreator}
                  disabled={becomingCreator}
                  className="w-full bg-[#00aff0] hover:bg-[#0095cc] text-white"
                >
                  {becomingCreator ? 'Creating...' : 'Become a Creator'}
                </Button>
              </div>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-64px)]">
          <div className="max-w-[1100px] mx-auto px-4 py-6">
            {/* Tabs for content */}
            <Tabs 
              defaultValue="for-you" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="mb-6 flex justify-between items-center">
                <TabsList className="bg-[#1e2029]">
                  <TabsTrigger value="for-you" className="data-[state=active]:bg-[#00aff0] data-[state=active]:text-white">
                    For You
                  </TabsTrigger>
                  <TabsTrigger value="following" className="data-[state=active]:bg-[#00aff0] data-[state=active]:text-white">
                    Following
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="data-[state=active]:bg-[#00aff0] data-[state=active]:text-white">
                    Trending
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-400 hover:bg-[#1e2029]'}`}
                    aria-label="Grid view"
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-400 hover:bg-[#1e2029]'}`}
                    aria-label="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stories row */}
              <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {/* New story button */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#1e2029] flex items-center justify-center">
                      <Plus className="h-6 w-6 text-[#00aff0]" />
                    </div>
                    <span className="text-xs mt-1 text-gray-300">New</span>
                  </div>
                  
                  {/* Creator stories */}
                  {Array.isArray(creators) && creators.slice(0, 10).map((creator) => (
                    <div key={creator.id} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00aff0] to-[#9146ff] p-[2px]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#13151a]">
                          <img 
                            src={creator.avatar_url || '/placeholder.svg'} 
                            alt={creator.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="text-xs mt-1 text-gray-300 truncate max-w-[64px]">
                        {creator.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <TabsContent value="for-you" className="mt-0">
                {filteredPosts.length === 0 ? (
                  <div className="bg-[#1e2029] rounded-lg p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#252836] flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Subscribe to creators to see their exclusive content in your feed
                    </p>
                    <Button 
                      className="bg-[#00aff0] hover:bg-[#0095cc] text-white"
                      onClick={() => setActiveTab('trending')}
                    >
                      Explore Creators
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
                    {filteredPosts.map((post) => (
                      <ModernPostCard
                        key={post.id}
                        post={post}
                        onLike={(postId) => handlePostAction(postId, 'like')}
                        onShare={(postId) => handlePostAction(postId, 'share')}
                        onBookmark={(postId) => handlePostAction(postId, 'bookmark')}
                        onPurchase={(postId) => handlePostAction(postId, 'purchase')}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="following" className="mt-0">
                <div className="bg-[#1e2029] rounded-lg p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#252836] flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No following yet</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Start following creators to see their exclusive content here
                  </p>
                  <Button 
                    className="bg-[#00aff0] hover:bg-[#0095cc] text-white"
                    onClick={() => setActiveTab('trending')}
                  >
                    Browse Creators
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="trending" className="mt-0">
                {filteredCreators.length === 0 ? (
                  <div className="bg-[#1e2029] rounded-lg p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#252836] flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No creators yet</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Be the first to join as a creator!
                    </p>
                    {!profile?.is_creator && (
                      <Button 
                        onClick={handleBecomeCreator}
                        disabled={becomingCreator}
                        className="bg-[#00aff0] hover:bg-[#0095cc] text-white"
                      >
                        {becomingCreator ? 'Creating...' : 'Become a Creator'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredCreators.map((creator) => (
                      <Card key={creator.id} className="bg-[#1e2029] border-0 overflow-hidden">
                        {/* Cover image */}
                        <div className="h-24 bg-gradient-to-r from-[#252836] to-[#1e2029]"></div>
                        
                        {/* Profile info */}
                        <CardContent className="pt-0">
                          <div className="flex flex-col items-center -mt-8 text-center">
                            <div className="h-16 w-16 rounded-full border-4 border-[#1e2029] overflow-hidden mb-2">
                              <img 
                                src={creator.avatar_url || '/placeholder.svg'} 
                                alt={creator.display_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex items-center mb-1">
                              <p className="font-medium">{creator.display_name}</p>
                              {creator.is_verified && (
                                <Badge className="ml-1 bg-[#00aff0] text-white text-xs px-1">
                                  <Star className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-1">@{creator.username}</p>
                            <p className="text-xs text-gray-500 mb-3">{creator.total_subscribers} subscribers</p>
                            <Button 
                              className="w-full bg-[#00aff0] hover:bg-[#0095cc] text-white"
                              size="sm"
                              onClick={() => handleSubscribe(creator.id, creator.display_name)}
                            >
                              Subscribe ${(creator.subscription_price / 100).toFixed(2)}/mo
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bookmarks" className="mt-0">
                <div className="bg-[#1e2029] rounded-lg p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#252836] flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Bookmark posts to save them for later
                  </p>
                  <Button 
                    className="bg-[#00aff0] hover:bg-[#0095cc] text-white"
                    onClick={() => setActiveTab('for-you')}
                  >
                    Explore Content
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f1015] border-t border-[#2c2e36] z-40">
        <div className="flex justify-around items-center py-2">
          <button 
            className={`p-2 ${activeTab === 'for-you' ? 'text-[#00aff0]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('for-you')}
          >
            <Home className="h-6 w-6" />
          </button>
          <button 
            className={`p-2 ${activeTab === 'search' ? 'text-[#00aff0]' : 'text-gray-400'}`}
            onClick={() => document.querySelector('input[type="text"]')?.focus()}
          >
            <Search className="h-6 w-6" />
          </button>
          <button 
            className={`p-2 ${activeTab === 'trending' ? 'text-[#00aff0]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('trending')}
          >
            <TrendingUp className="h-6 w-6" />
          </button>
          <button 
            className={`p-2 ${activeTab === 'following' ? 'text-[#00aff0]' : 'text-gray-400'}`}
            onClick={() => setActiveTab('following')}
          >
            <Users className="h-6 w-6" />
          </button>
          <button className="p-2 text-gray-400">
            <div className="h-6 w-6 rounded-full overflow-hidden">
              <img 
                src={profile?.avatar_url || '/placeholder.svg'} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
