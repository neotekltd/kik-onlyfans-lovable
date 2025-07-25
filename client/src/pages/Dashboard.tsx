import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStats, useRealUserActivity } from '@/components/RealDataLoader';
import ModernPostCard from '@/components/ModernPostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
  Shield,
  Upload,
  Video,
  Send,
  Eye,
  BarChart3,
  Gift,
  Radio,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
  UserCog,
  AlertCircle
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

interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalSubscribers: number;
  newSubscribers: number;
  totalPosts: number;
  totalViews: number;
  totalTips: number;
  ppvSales: number;
  messagesReceived: number;
}

interface Subscriber {
  id: string;
  subscriber_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  created_at: string;
  status: string;
  amount_paid: number;
}

const Dashboard: React.FC = () => {
  const { user, profile, creatorProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { stats: platformStats, loading: statsLoading } = usePlatformStats();
  const { activity, loading: activityLoading } = useRealUserActivity();
  
  // State for posts and creators
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [becomingCreator, setBecomingCreator] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Creator-specific state
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalSubscribers: 0,
    newSubscribers: 0,
    totalPosts: 0,
    totalViews: 0,
    totalTips: 0,
    ppvSales: 0,
    messagesReceived: 0
  });
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Post creation state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    isPremium: false,
    isPPV: false,
    ppvPrice: '',
    scheduledAt: '',
    tags: '',
    mediaFiles: [] as File[]
  });

  // Mass messaging state
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [massMessage, setMassMessage] = useState({
    content: '',
    isPPV: false,
    ppvPrice: '',
    targetGroup: 'all'
  });

  // Tip state
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [tipCreatorId, setTipCreatorId] = useState('');

  // Profile management state
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website_url: profile?.website_url || ''
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      if (profile?.is_creator) {
        fetchCreatorData();
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website_url: profile.website_url || ''
      });
    }
  }, [profile]);

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
        setPosts(postsData || []);
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

  const fetchCreatorData = async () => {
    if (!user?.id || !profile?.is_creator) return;

    try {
      // Fetch real creator statistics
      const response = await fetch(`/api/analytics/${user.id}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setCreatorStats({
          totalEarnings: analyticsData.total_earnings || 0,
          monthlyEarnings: analyticsData.monthly_earnings || 0,
          totalSubscribers: analyticsData.total_subscribers || 0,
          newSubscribers: analyticsData.new_subscribers || 0,
          totalPosts: analyticsData.total_posts || 0,
          totalViews: analyticsData.total_views || 0,
          totalTips: analyticsData.total_tips || 0,
          ppvSales: analyticsData.ppv_sales || 0,
          messagesReceived: 0
        });
      }

      // Fetch subscribers
      const { data: subscribersData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles:subscriber_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('creator_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!subsError && subscribersData) {
        setSubscribers(subscribersData);
      }

      // Fetch recent messages
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('recipient_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!msgError && messagesData) {
        setMessages(messagesData);
        setCreatorStats(prev => ({ ...prev, messagesReceived: messagesData.length }));
      }

    } catch (error) {
      console.error('Error fetching creator data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileForm.display_name,
          bio: profileForm.bio,
          location: profileForm.location,
          website_url: profileForm.website_url
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setShowProfileSettings(false);
      // Refresh profile data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `posts/${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) {
      toast.error('Please enter a post title');
      return;
    }

    try {
      let mediaUrls: string[] = [];
      
      // Upload media files if any
      if (postForm.mediaFiles.length > 0) {
        const fileList = postForm.mediaFiles as any;
        mediaUrls = await handleFileUpload(fileList) || [];
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          creator_id: user?.id,
          title: postForm.title,
          description: postForm.description,
          content_type: mediaUrls.length > 0 ? 'media' : 'text',
          media_urls: mediaUrls,
          is_premium: postForm.isPremium,
          is_ppv: postForm.isPPV,
          ppv_price: postForm.isPPV ? parseFloat(postForm.ppvPrice) * 100 : null,
          is_published: !postForm.scheduledAt,
          scheduled_at: postForm.scheduledAt || null,
          tags: postForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Post created successfully!');
      setShowCreatePost(false);
      setPostForm({
        title: '',
        description: '',
        isPremium: false,
        isPPV: false,
        ppvPrice: '',
        scheduledAt: '',
        tags: '',
        mediaFiles: []
      });
      
      // Refresh posts
      fetchDashboardData();

    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleSendMassMessage = async () => {
    if (!massMessage.content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      // Get target subscribers
      const { data: targetSubs, error } = await supabase
        .from('user_subscriptions')
        .select('subscriber_id')
        .eq('creator_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      if (!targetSubs || targetSubs.length === 0) {
        toast.error('No active subscribers found');
        return;
      }

      // Send messages to all subscribers
      const messagesToInsert = targetSubs.map(sub => ({
        sender_id: user?.id,
        recipient_id: sub.subscriber_id,
        content: massMessage.content,
        is_ppv: massMessage.isPPV,
        ppv_price: massMessage.isPPV ? parseFloat(massMessage.ppvPrice) * 100 : null,
        is_purchased: false,
        is_read: false
      }));

      const { error: insertError } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (insertError) throw insertError;

      toast.success(`Mass message sent to ${targetSubs.length} subscribers!`);
      setShowMassMessage(false);
      setMassMessage({ content: '', isPPV: false, ppvPrice: '', targetGroup: 'all' });

    } catch (error) {
      console.error('Error sending mass message:', error);
      toast.error('Failed to send mass message');
    }
  };

  const handleSendTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      toast.error('Please enter a valid tip amount');
      return;
    }

    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipperId: user?.id,
          creatorId: tipCreatorId,
          amount: parseFloat(tipAmount),
          message: tipMessage
        })
      });

      if (response.ok) {
        toast.success('Tip sent successfully!');
        setShowTipDialog(false);
        setTipAmount('');
        setTipMessage('');
        setTipCreatorId('');
      } else {
        throw new Error('Failed to send tip');
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      toast.error('Failed to send tip');
    }
  };

  const handleSubscribe = async (creatorId: string, creatorName: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: user.id,
          creatorId: creatorId,
          amount: 999 // $9.99 in cents
        })
      });

      if (response.ok) {
        toast.success(`Successfully subscribed to ${creatorName}!`);
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe. Please try again.');
    }
  };

  const handleBecomeCreator = async () => {
    setBecomingCreator(true);
    try {
      await becomeCreator(9.99, ['general']);
      toast.success('Welcome to creators! Your creator account has been activated.');
      setActiveTab('creator-dashboard');
    } catch (error) {
      console.error('Error becoming creator:', error);
      toast.error('Failed to activate creator account. Please try again.');
    } finally {
      setBecomingCreator(false);
    }
  };

  const openTipDialog = (creatorId: string) => {
    setTipCreatorId(creatorId);
    setShowTipDialog(true);
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  const goToMessages = () => {
    navigate('/messages');
  };

  const goToNotifications = () => {
    navigate('/notifications');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13151a]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading your dashboard...</p>
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
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[#00aff0] cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              KikStars
            </h1>
          </div>

          <div className="hidden md:flex relative w-1/3 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search creators and content..."
              className="pl-10 bg-[#1e2029] border-[#2c2e36] text-white w-full rounded-full focus:ring-[#00aff0] focus:border-[#00aff0]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-5">
            {profile?.is_creator && (
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="bg-[#00aff0] hover:bg-[#0095cc]"
              >
                <Camera className="h-4 w-4 mr-2" />
                Post
              </Button>
            )}
            
            <button 
              className="text-gray-300 hover:text-white relative"
              onClick={goToNotifications}
            >
              <Bell className="h-6 w-6" />
              {messages.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
                  {messages.length}
                </Badge>
              )}
            </button>
            
            <button 
              className="text-gray-300 hover:text-white"
              onClick={goToMessages}
            >
              <MessageCircle className="h-6 w-6" />
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="h-8 w-8 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#00aff0] transition-all">
                  <img 
                    src={profile?.avatar_url || '/placeholder.svg'} 
                    alt={profile?.display_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1e2029] border-[#2c2e36] text-white">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.display_name}</p>
                  <p className="text-xs text-gray-400">@{profile?.username}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#2c2e36]" />
                
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)} className="hover:bg-[#252836] cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={goToSettings} className="hover:bg-[#252836] cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                
                {profile?.is_creator && (
                  <DropdownMenuItem onClick={() => navigate('/creator-settings')} className="hover:bg-[#252836] cursor-pointer">
                    <UserCog className="mr-2 h-4 w-4" />
                    Creator Settings
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => navigate('/billing')} className="hover:bg-[#252836] cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing & Payments
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate('/help')} className="hover:bg-[#252836] cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-[#2c2e36]" />
                
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-[#252836] cursor-pointer text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
                >
                  <Home className="h-5 w-5 mr-3" />
                  <span>Dashboard</span>
                </a>
              </li>
              
              {profile?.is_creator && (
                <>
                  <li>
                    <a 
                      href="#" 
                      className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'creator-dashboard' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                      onClick={(e) => { e.preventDefault(); setActiveTab('creator-dashboard'); }}
                    >
                      <BarChart3 className="h-5 w-5 mr-3" />
                      <span>Creator Dashboard</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'content' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                      onClick={(e) => { e.preventDefault(); setActiveTab('content'); }}
                    >
                      <Upload className="h-5 w-5 mr-3" />
                      <span>Content</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'messages' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                      onClick={(e) => { e.preventDefault(); setActiveTab('messages'); }}
                    >
                      <MessageCircle className="h-5 w-5 mr-3" />
                      <span>Messages</span>
                      {messages.length > 0 && (
                        <Badge className="ml-auto bg-red-500">{messages.length}</Badge>
                      )}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'subscribers' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                      onClick={(e) => { e.preventDefault(); setActiveTab('subscribers'); }}
                    >
                      <Users className="h-5 w-5 mr-3" />
                      <span>Subscribers</span>
                      <Badge className="ml-auto">{creatorStats.totalSubscribers}</Badge>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'earnings' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                      onClick={(e) => { e.preventDefault(); setActiveTab('earnings'); }}
                    >
                      <DollarSign className="h-5 w-5 mr-3" />
                      <span>Earnings</span>
                      <Badge className="ml-auto">${(creatorStats.totalEarnings / 100).toFixed(0)}</Badge>
                    </a>
                  </li>
                </>
              )}
              
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'discover' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('discover'); }}
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  <span>Discover</span>
                </a>
              </li>
              
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2.5 rounded-lg ${activeTab === 'subscriptions' ? 'bg-[#1e2029] text-[#00aff0]' : 'text-gray-300 hover:bg-[#1e2029]'}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('subscriptions'); }}
                >
                  <Star className="h-5 w-5 mr-3" />
                  <span>My Subscriptions</span>
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
            </ul>

            {!profile?.is_creator && (
              <div className="px-3 mt-6">
                <Button 
                  onClick={() => navigate('/become-creator')}
                  className="w-full bg-[#00aff0] hover:bg-[#0095cc] text-white"
                >
                  Become a Creator
                </Button>
              </div>
            )}

            <Separator className="my-6 bg-[#2c2e36]" />

            {/* Quick Stats */}
            <div className="px-3">
              <h3 className="text-sm font-medium text-gray-400 mb-2">QUICK STATS</h3>
              <div className="space-y-2 text-sm">
                {profile?.is_creator && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Earnings</span>
                      <span>${(creatorStats.totalEarnings / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Subscribers</span>
                      <span>{creatorStats.totalSubscribers}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Posts</span>
                  <span>{posts.length}</span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-64px)]">
          <div className="max-w-[1100px] mx-auto px-4 py-6">
            
            {/* Creator Dashboard Tab */}
            {activeTab === 'creator-dashboard' && profile?.is_creator && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                    <p className="text-gray-400">Welcome back, {profile?.display_name}</p>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setShowCreatePost(true)} className="bg-[#00aff0] hover:bg-[#0095cc]">
                      <Camera className="h-4 w-4 mr-2" />
                      Quick Post
                    </Button>
                    <Button onClick={() => setShowMassMessage(true)} variant="outline" className="border-[#2c2e36]">
                      <Radio className="h-4 w-4 mr-2" />
                      Mass Message
                    </Button>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-[#1e2029] border-[#2c2e36]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Total Earnings</p>
                          <p className="text-2xl font-bold text-green-400">${(creatorStats.totalEarnings / 100).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">This month: ${(creatorStats.monthlyEarnings / 100).toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1e2029] border-[#2c2e36]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Subscribers</p>
                          <p className="text-2xl font-bold text-[#00aff0]">{creatorStats.totalSubscribers}</p>
                          <p className="text-sm text-green-400">+{creatorStats.newSubscribers} this month</p>
                        </div>
                        <Users className="h-8 w-8 text-[#00aff0]" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1e2029] border-[#2c2e36]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Posts</p>
                          <p className="text-2xl font-bold text-purple-400">{creatorStats.totalPosts}</p>
                          <p className="text-sm text-gray-500">{creatorStats.totalViews} total views</p>
                        </div>
                        <Eye className="h-8 w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1e2029] border-[#2c2e36]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Messages</p>
                          <p className="text-2xl font-bold text-pink-400">{creatorStats.messagesReceived}</p>
                          <p className="text-sm text-gray-500">New messages</p>
                        </div>
                        <MessageCircle className="h-8 w-8 text-pink-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[#1e2029] border-[#2c2e36]">
                    <CardHeader>
                      <CardTitle>Recent Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {subscribers.slice(0, 5).map((subscriber) => (
                          <div key={subscriber.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src={subscriber.profiles?.avatar_url || '/placeholder.svg'}
                                alt={subscriber.profiles?.display_name}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                              <div>
                                <p className="font-medium">{subscriber.profiles?.display_name}</p>
                                <p className="text-sm text-gray-400">@{subscriber.profiles?.username}</p>
                              </div>
                            </div>
                            <Badge variant={subscriber.status === 'active' ? "default" : "secondary"}>
                              ${(subscriber.amount_paid / 100).toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                        {subscribers.length === 0 && (
                          <p className="text-gray-400 text-center py-4">No subscribers yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1e2029] border-[#2c2e36]">
                    <CardHeader>
                      <CardTitle>Recent Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {messages.slice(0, 5).map((message) => (
                          <div key={message.id} className="p-3 bg-[#252836] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">@{message.profiles?.username}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{message.content}</p>
                            {message.is_ppv && (
                              <Badge className="mt-2 bg-green-600">${(message.ppv_price / 100).toFixed(2)} PPV</Badge>
                            )}
                          </div>
                        ))}
                        {messages.length === 0 && (
                          <p className="text-gray-400 text-center py-4">No new messages</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">Discover Creators</h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {creators.map((creator) => (
                    <Card key={creator.id} className="bg-[#1e2029] border-0 overflow-hidden">
                      <div className="h-24 bg-gradient-to-r from-[#252836] to-[#1e2029]"></div>
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
                          <div className="flex gap-2 w-full">
                            <Button 
                              className="flex-1 bg-[#00aff0] hover:bg-[#0095cc] text-white"
                              size="sm"
                              onClick={() => handleSubscribe(creator.id, creator.display_name)}
                            >
                              Subscribe ${(creator.subscription_price / 100).toFixed(2)}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-[#2c2e36]"
                              onClick={() => openTipDialog(creator.id)}
                            >
                              <Gift className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Default Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">Your Feed</h1>
                </div>

                {posts.length === 0 ? (
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
                      onClick={() => setActiveTab('discover')}
                    >
                      Explore Creators
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <ModernPostCard
                        key={post.id}
                        post={post}
                        onLike={(postId) => console.log('Like:', postId)}
                        onShare={(postId) => console.log('Share:', postId)}
                        onBookmark={(postId) => console.log('Bookmark:', postId)}
                        onPurchase={(postId) => console.log('Purchase:', postId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Placeholder for other tabs */}
            {(activeTab === 'subscriptions' || activeTab === 'bookmarks' || activeTab === 'earnings' || activeTab === 'content' || activeTab === 'messages' || activeTab === 'subscribers') && (
              <div className="bg-[#1e2029] rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#252836] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  This feature is being built according to the PRD requirements. Full functionality will be available soon.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Profile Settings Dialog */}
      <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
        <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Display Name"
              value={profileForm.display_name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
            />
            <Textarea
              placeholder="Bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
              rows={3}
            />
            <Input
              placeholder="Location"
              value={profileForm.location}
              onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
            />
            <Input
              placeholder="Website URL"
              value={profileForm.website_url}
              onChange={(e) => setProfileForm(prev => ({ ...prev, website_url: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateProfile}
                className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]"
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowProfileSettings(false)}
                className="border-[#2c2e36]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Post title"
              value={postForm.title}
              onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
            />
            <Textarea
              placeholder="Post description"
              value={postForm.description}
              onChange={(e) => setPostForm(prev => ({ ...prev, description: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
              rows={4}
            />

            <div>
              <Label>Upload Media</Label>
              <Input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={(e) => setPostForm(prev => ({ ...prev, mediaFiles: Array.from(e.target.files || []) }))}
                className="bg-[#252836] border-[#2c2e36] mt-2"
              />
              {postForm.mediaFiles.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  {postForm.mediaFiles.length} file(s) selected
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={postForm.isPremium}
                  onCheckedChange={(checked) => setPostForm(prev => ({ ...prev, isPremium: checked }))}
                />
                <Label>Premium Content</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={postForm.isPPV}
                  onCheckedChange={(checked) => setPostForm(prev => ({ ...prev, isPPV: checked }))}
                />
                <Label>Pay-Per-View</Label>
              </div>
            </div>

            {postForm.isPPV && (
              <Input
                type="number"
                placeholder="PPV Price ($)"
                value={postForm.ppvPrice}
                onChange={(e) => setPostForm(prev => ({ ...prev, ppvPrice: e.target.value }))}
                className="bg-[#252836] border-[#2c2e36]"
              />
            )}

            <Input
              placeholder="Tags (comma separated)"
              value={postForm.tags}
              onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
            />

            <div className="flex gap-2">
              <Button 
                onClick={handleCreatePost}
                className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]"
              >
                Publish Post
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreatePost(false)}
                className="border-[#2c2e36]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mass Message Dialog */}
      <Dialog open={showMassMessage} onOpenChange={setShowMassMessage}>
        <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white">
          <DialogHeader>
            <DialogTitle>Send Mass Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Your message to all subscribers..."
              value={massMessage.content}
              onChange={(e) => setMassMessage(prev => ({ ...prev, content: e.target.value }))}
              className="bg-[#252836] border-[#2c2e36]"
              rows={4}
            />
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={massMessage.isPPV}
                onCheckedChange={(checked) => setMassMessage(prev => ({ ...prev, isPPV: checked }))}
              />
              <Label>PPV Message</Label>
            </div>
            
            {massMessage.isPPV && (
              <Input
                type="number"
                placeholder="Price per view ($)"
                value={massMessage.ppvPrice}
                onChange={(e) => setMassMessage(prev => ({ ...prev, ppvPrice: e.target.value }))}
                className="bg-[#252836] border-[#2c2e36]"
              />
            )}
            
            <Button 
              onClick={handleSendMassMessage}
              className="w-full bg-[#00aff0] hover:bg-[#0095cc]"
            >
              Send to {creatorStats.totalSubscribers} Subscribers
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tip Dialog */}
      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white">
          <DialogHeader>
            <DialogTitle>Send Tip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Tip amount ($)"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="bg-[#252836] border-[#2c2e36]"
            />
            <Textarea
              placeholder="Optional message..."
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="bg-[#252836] border-[#2c2e36]"
              rows={3}
            />
            <Button 
              onClick={handleSendTip}
              className="w-full bg-[#00aff0] hover:bg-[#0095cc]"
            >
              Send Tip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
