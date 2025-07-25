import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStats } from '@/components/RealDataLoader';
import ModernHeader from '@/components/ModernHeader';
import ModernSidebar from '@/components/ModernSidebar';
import ModernPostCard from '@/components/ModernPostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  BookmarkIcon,
  MessageCircle,
  ShieldCheck,
  Flame,
  Calendar
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [becomingCreator, setBecomingCreator] = useState(false);
  const [suggestedCreators, setSuggestedCreators] = useState<Creator[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent published posts
        const postsResponse = await fetch('/api/posts');
        const postsData = await postsResponse.json();
        // Ensure postsData is an array before setting it
        setPosts(Array.isArray(postsData) ? postsData : []);

        // Fetch creators
        const creatorsResponse = await fetch('/api/creators');
        const creatorsData = await creatorsResponse.json();
        // Ensure creatorsData is an array before setting it
        setCreators(Array.isArray(creatorsData) ? creatorsData : []);
        
        // Set suggested creators (normally would come from an API with recommendations)
        if (Array.isArray(creatorsData) && creatorsData.length > 0) {
          setSuggestedCreators(creatorsData.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty arrays on error
        setPosts([]);
        setCreators([]);
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
            <p className="text-muted-foreground text-lg">Loading your feed...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <ModernHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <div className="flex">
        <ModernSidebar creators={creators} isCreator={profile?.is_creator} />
        
        <main className="flex-1 p-0 overflow-y-auto">
          {/* Main content area */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-6 py-6">
              {/* Left column - Feed */}
              <div className="w-full md:w-8/12 space-y-6">
                {/* Stories/Featured Section */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-4 min-w-max">
                    {Array.isArray(creators) && creators.slice(0, 8).map((creator) => (
                      <div key={creator.id} className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px]">
                          <div className="w-full h-full rounded-full overflow-hidden">
                            <img 
                              src={creator.avatar_url || '/placeholder.svg'} 
                              alt={creator.display_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <span className="text-sm mt-1 truncate max-w-[80px]">
                          {creator.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Tabs */}
                <Tabs 
                  defaultValue="for-you" 
                  className="w-full bg-[#1a1a1a] rounded-lg overflow-hidden"
                  onValueChange={setActiveTab}
                >
                  <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-3 bg-[#252525]">
                      <TabsTrigger 
                        value="for-you" 
                        className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white"
                      >
                        For You
                      </TabsTrigger>
                      <TabsTrigger 
                        value="following" 
                        className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white"
                      >
                        Following
                      </TabsTrigger>
                      <TabsTrigger 
                        value="trending" 
                        className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white"
                      >
                        <Flame className="w-4 h-4 mr-1" /> Trending
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="for-you" className="p-4 mt-0">
                    {filteredPosts.length === 0 ? (
                      <div className="bg-[#252525] rounded-lg p-8 text-center">
                        <Heart className="w-12 h-12 mx-auto mb-4 text-pink-500 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">Your feed is empty</h3>
                        <p className="text-gray-400 mb-6">
                          Follow some creators to see their exclusive content here
                        </p>
                        <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                          Discover Creators
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-8">
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
                  
                  <TabsContent value="following" className="p-4 mt-0">
                    <div className="bg-[#252525] rounded-lg p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No following yet</h3>
                      <p className="text-gray-400 mb-6">
                        Start following creators to see their exclusive content here
                      </p>
                      <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                        Browse Creators
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="trending" className="p-4 mt-0">
                    <div className="bg-[#252525] rounded-lg p-8 text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-orange-400 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">Hot & Trending</h3>
                      <p className="text-gray-400 mb-6">
                        Discover what's popular on KikStars right now
                      </p>
                      <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                        See Trending
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right column - Sidebar */}
              <div className="w-full md:w-4/12 space-y-6">
                {/* User Profile Card */}
                <Card className="bg-[#1a1a1a] border-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-16"></div>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-end -mt-8 mb-4">
                      <div className="h-16 w-16 rounded-full border-4 border-[#1a1a1a] overflow-hidden">
                        <img 
                          src={profile?.avatar_url || '/placeholder.svg'} 
                          alt={profile?.display_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!profile?.is_creator ? (
                        <Button 
                          onClick={handleBecomeCreator}
                          disabled={becomingCreator}
                          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                          size="sm"
                        >
                          {becomingCreator ? 'Creating...' : 'Become Creator'}
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          Creator
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{profile?.display_name}</h3>
                      <p className="text-gray-400 text-sm">@{profile?.username}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div className="p-2">
                        <p className="text-lg font-semibold">{posts.length}</p>
                        <p className="text-xs text-gray-400">Posts</p>
                      </div>
                      <div className="p-2">
                        <p className="text-lg font-semibold">0</p>
                        <p className="text-xs text-gray-400">Following</p>
                      </div>
                      <div className="p-2">
                        <p className="text-lg font-semibold">0</p>
                        <p className="text-xs text-gray-400">Fans</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Creators */}
                <Card className="bg-[#1a1a1a] border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Suggested Creators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {suggestedCreators.map((creator) => (
                      <div key={creator.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img 
                              src={creator.avatar_url || '/placeholder.svg'} 
                              alt={creator.display_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{creator.display_name}</p>
                            <p className="text-xs text-gray-400">@{creator.username}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 rounded-full">
                          Follow
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full text-sm">See All</Button>
                  </CardFooter>
                </Card>

                {/* Platform Stats */}
                <Card className="bg-[#1a1a1a] border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      Platform Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 flex items-center">
                          <Users className="w-4 h-4 mr-2" /> Active Creators
                        </span>
                        <span className="font-medium">{creators.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 flex items-center">
                          <Camera className="w-4 h-4 mr-2" /> Total Posts
                        </span>
                        <span className="font-medium">{posts.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" /> New Today
                        </span>
                        <span className="font-medium">5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
