import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStats } from '@/components/RealDataLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  MessageCircle,
  Settings,
  Home,
  Bookmark,
  Lock,
  ChevronRight,
  Calendar,
  Clock,
  Grid,
  List
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
  const [activeTab, setActiveTab] = useState('home');
  const [becomingCreator, setBecomingCreator] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      <div className="min-h-screen bg-[#13151a]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
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
              placeholder="Search..."
              className="pl-10 bg-[#1e2029] border-[#2c2e36] text-white w-full rounded-full focus:ring-[#00aff0] focus:border-[#00aff0]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-5">
            <button className="text-gray-300 hover:text-white">
              <Bell className="h-6 w-6" />
            </button>
            <button className="text-gray-300 hover:text-white">
              <MessageCircle className="h-6 w-6" />
            </button>
            <button className="text-gray-300 hover:text-white">
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
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'home' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={() => setActiveTab('home')}
                >
                  <Home className="h-5 w-5 mr-3" />
                  <span>Home</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'notifications' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="h-5 w-5 mr-3" />
                  <span>Notifications</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'messages' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={() => setActiveTab('messages')}
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  <span>Messages</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'bookmarks' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={() => setActiveTab('bookmarks')}
                >
                  <Bookmark className="h-5 w-5 mr-3" />
                  <span>Bookmarks</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'lists' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={() => setActiveTab('lists')}
                >
                  <List className="h-5 w-5 mr-3" />
                  <span>Lists</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'settings' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span>Settings</span>
                </a>
              </li>
            </ul>

            <Separator className="my-6 bg-[#2c2e36]" />

            {/* Subscriptions section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 px-3 mb-2">SUBSCRIPTIONS</h3>
              {creators.length > 0 ? (
                <ul className="space-y-1">
                  {creators.slice(0, 5).map((creator) => (
                    <li key={creator.id}>
                      <a href="#" className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[#1e2029]">
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
                  {creators.length > 5 && (
                    <li>
                      <a href="#" className="flex items-center px-3 py-2 text-sm text-[#00aff0] hover:underline">
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
            {/* Home feed */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">Home Feed</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-400 hover:bg-[#1e2029]'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-400 hover:bg-[#1e2029]'}`}
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

            {/* Content feed */}
            {filteredPosts.length === 0 ? (
              <div className="bg-[#1e2029] rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#252836] flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Subscribe to creators to see their exclusive content in your feed
                </p>
                <Button className="bg-[#00aff0] hover:bg-[#0095cc] text-white">
                  Explore Creators
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="bg-[#1e2029] border-0 overflow-hidden">
                    {/* Post header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                          <img 
                            src={post.profiles?.avatar_url || '/placeholder.svg'} 
                            alt={post.profiles?.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">{post.profiles?.display_name}</p>
                            {post.profiles?.is_verified && (
                              <Badge className="ml-1 bg-[#00aff0] text-white text-xs px-1">
                                <Star className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">@{post.profiles?.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Post content */}
                    <div className="relative">
                      {post.thumbnail_url ? (
                        <img 
                          src={post.thumbnail_url} 
                          alt={post.title || 'Post content'} 
                          className="w-full aspect-square md:aspect-video object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square md:aspect-video bg-[#252836] flex items-center justify-center">
                          <Camera className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* PPV overlay */}
                      {post.is_ppv && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                          <Lock className="h-8 w-8 text-white mb-2" />
                          <p className="text-white font-medium mb-1">Unlock this post</p>
                          <p className="text-[#00aff0] font-bold text-xl mb-3">${post.ppv_price?.toFixed(2)}</p>
                          <Button 
                            className="bg-[#00aff0] hover:bg-[#0095cc] text-white"
                            onClick={() => handlePostAction(post.id, 'purchase')}
                          >
                            Unlock Now
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Post description */}
                    {!post.is_ppv && post.description && (
                      <div className="p-4">
                        <p className="text-sm">{post.description}</p>
                      </div>
                    )}

                    {/* Post actions */}
                    <div className="px-4 py-3 border-t border-[#2c2e36] flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button 
                          className="flex items-center text-gray-400 hover:text-[#00aff0]"
                          onClick={() => handlePostAction(post.id, 'like')}
                        >
                          <Heart className="h-5 w-5 mr-1" />
                          <span className="text-sm">{post.like_count}</span>
                        </button>
                        <button 
                          className="flex items-center text-gray-400 hover:text-[#00aff0]"
                          onClick={() => handlePostAction(post.id, 'comment')}
                        >
                          <MessageCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm">{post.comment_count}</span>
                        </button>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-[#00aff0]"
                        onClick={() => handlePostAction(post.id, 'bookmark')}
                      >
                        <Bookmark className="h-5 w-5" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Suggested creators section */}
            {filteredPosts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Suggested Creators</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {creators.slice(0, 4).map((creator) => (
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
                          <p className="text-xs text-gray-400 mb-3">@{creator.username}</p>
                          <Button 
                            className="w-full bg-[#00aff0] hover:bg-[#0095cc] text-white"
                            size="sm"
                          >
                            Subscribe
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f1015] border-t border-[#2c2e36] z-40">
        <div className="flex justify-around items-center py-2">
          <button className={`p-2 ${activeTab === 'home' ? 'text-[#00aff0]' : 'text-gray-400'}`}>
            <Home className="h-6 w-6" />
          </button>
          <button className={`p-2 ${activeTab === 'search' ? 'text-[#00aff0]' : 'text-gray-400'}`}>
            <Search className="h-6 w-6" />
          </button>
          <button className={`p-2 ${activeTab === 'notifications' ? 'text-[#00aff0]' : 'text-gray-400'}`}>
            <Bell className="h-6 w-6" />
          </button>
          <button className={`p-2 ${activeTab === 'messages' ? 'text-[#00aff0]' : 'text-gray-400'}`}>
            <MessageCircle className="h-6 w-6" />
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
