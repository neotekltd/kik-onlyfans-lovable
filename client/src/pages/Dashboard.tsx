import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseHelpers } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Upload, 
  Video, 
  Send, 
  Eye, 
  BarChart3, 
  Gift, 
  Radio,
  User,
  Settings,
  LogOut,
  Bell,
  Mail,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Camera,
  Plus,
  Home,
  Search,
  UserPlus
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  
  // Form states
  const [postForm, setPostForm] = useState({
    content: '',
    contentType: 'text',
    isPPV: false,
    ppvPrice: 0,
    files: [] as File[]
  });
  
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    bio: '',
    username: ''
  });
  
  const [tipForm, setTipForm] = useState({
    amount: 5,
    message: '',
    creatorId: ''
  });
  
  const [massMessage, setMassMessage] = useState({
    content: '',
    isPPV: false,
    ppvPrice: 0
  });

  // Stats for creators
  const [creatorStats, setCreatorStats] = useState({
    subscribers: 0,
    earnings: 0,
    posts: 0,
    views: 0
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      loadPosts();
      loadCreators();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load user profile
      const userProfile = await supabaseHelpers.getProfile(user.id);
      setProfile(userProfile);
      setIsCreator(userProfile.is_creator);
      
      setProfileForm({
        display_name: userProfile.display_name || '',
        bio: userProfile.bio || '',
        username: userProfile.username || ''
      });

      // Load creator profile if user is a creator
      if (userProfile.is_creator) {
        const creatorData = await supabaseHelpers.getCreatorProfile(user.id);
        setCreatorProfile(creatorData);
        
        if (creatorData) {
          setCreatorStats({
            subscribers: creatorData.total_subscribers || 0,
            earnings: creatorData.total_earnings || 0,
            posts: creatorData.total_posts || 0,
            views: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsData = await supabaseHelpers.getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    }
  };

  const loadCreators = async () => {
    try {
      const creatorsData = await supabaseHelpers.getCreators();
      setCreators(creatorsData);
    } catch (error) {
      console.error('Error loading creators:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !postForm.content.trim()) {
      toast.error('Please enter post content');
      return;
    }

    try {
      let mediaUrls: string[] = [];

      // Upload files if any
      if (postForm.files.length > 0) {
        for (const file of postForm.files) {
          const fileName = `${user.id}/${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`;
          const { data } = await supabaseHelpers.uploadFile('media', file, fileName);
          
          if (data) {
            const publicUrl = supabaseHelpers.getPublicUrl('media', data.path);
            mediaUrls.push(publicUrl);
          }
        }
      }

      const newPost = {
        creator_id: user.id,
        content: postForm.content,
        media_urls: mediaUrls,
        content_type: postForm.contentType,
        is_ppv: postForm.isPPV,
        ppv_price: postForm.isPPV ? postForm.ppvPrice * 100 : 0
      };

      await supabaseHelpers.createPost(newPost);
      
      // Reset form
      setPostForm({
        content: '',
        contentType: 'text',
        isPPV: false,
        ppvPrice: 0,
        files: []
      });
      
      setShowCreatePost(false);
      toast.success('Post created successfully!');
      loadPosts(); // Reload posts
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPostForm(prev => ({ ...prev, files }));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await supabaseHelpers.updateProfile(user.id, {
        display_name: profileForm.display_name,
        bio: profileForm.bio,
        username: profileForm.username
      });
      
      setShowProfileSettings(false);
      toast.success('Profile updated successfully!');
      loadUserData(); // Reload user data
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleBecomeCreator = async () => {
    if (!user) return;

    try {
      // Update user profile to creator
      await supabaseHelpers.updateProfile(user.id, { is_creator: true });
      
      // Create creator profile
      await supabaseHelpers.updateCreatorProfile(user.id, {
        subscription_price: 999, // $9.99 default
        is_active: true
      });
      
      toast.success('Welcome to KikStars creators! 🎉');
      loadUserData(); // Reload to get creator data
      
    } catch (error) {
      console.error('Error becoming creator:', error);
      toast.error('Failed to become creator');
    }
  };

  const handleSubscribe = async (creatorId: string, price: number) => {
    if (!user) return;

    try {
      const subscription = {
        subscriber_id: user.id,
        creator_id: creatorId,
        amount_paid: price,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      await supabaseHelpers.createSubscription(subscription);
      toast.success('Successfully subscribed! 🎉');
      
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe');
    }
  };

  const handleSendTip = async () => {
    if (!user || !tipForm.creatorId || tipForm.amount < 1) return;

    try {
      const tip = {
        tipper_id: user.id,
        creator_id: tipForm.creatorId,
        amount: tipForm.amount * 100, // Convert to cents
        message: tipForm.message
      };

      await supabaseHelpers.createTip(tip);
      
      setTipForm({ amount: 5, message: '', creatorId: '' });
      setShowTipDialog(false);
      toast.success(`Tip of $${tipForm.amount} sent! 💰`);
      
    } catch (error) {
      console.error('Error sending tip:', error);
      toast.error('Failed to send tip');
    }
  };

  const handleSendMassMessage = async () => {
    if (!user || !massMessage.content.trim()) return;

    try {
      // Get all active subscribers
      const subscriptions = await supabase
        .from('user_subscriptions')
        .select('subscriber_id')
        .eq('creator_id', user.id)
        .eq('status', 'active');

      if (subscriptions.data && subscriptions.data.length > 0) {
        // Send message to each subscriber
        for (const sub of subscriptions.data) {
          await supabaseHelpers.sendMessage({
            sender_id: user.id,
            recipient_id: sub.subscriber_id,
            content: massMessage.content,
            is_ppv: massMessage.isPPV,
            ppv_price: massMessage.isPPV ? massMessage.ppvPrice * 100 : 0
          });
        }
        
        toast.success(`Mass message sent to ${subscriptions.data.length} subscribers!`);
      } else {
        toast.error('No active subscribers found');
      }
      
      setMassMessage({ content: '', isPPV: false, ppvPrice: 0 });
      setShowMassMessage(false);
      
    } catch (error) {
      console.error('Error sending mass message:', error);
      toast.error('Failed to send mass message');
    }
  };

  const handlePostAction = (action: string, postId: string) => {
    // Placeholder for post actions
    toast.success(`${action} action performed!`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openTipDialog = (creatorId: string) => {
    setTipForm(prev => ({ ...prev, creatorId }));
    setShowTipDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b23] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b23] text-white">
      {/* Header */}
      <div className="bg-[#1e2029] border-b border-[#2c2e36] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-[#00aff0]">KikStars</h1>
            <Badge variant="outline" className="bg-purple-600 text-white border-purple-600">
              {isCreator ? 'Creator' : 'Fan'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Mail className="h-5 w-5" />
            </Button>
            
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
                
                <DropdownMenuItem className="hover:bg-[#252836] cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
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
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1e2029] border-r border-[#2c2e36] min-h-screen p-4">
          <div className="space-y-2">
            <Button 
              variant={activeTab === 'feed' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('feed')}
            >
              <Home className="mr-2 h-4 w-4" />
              Your Feed
            </Button>
            
            <Button 
              variant={activeTab === 'discover' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('discover')}
            >
              <Search className="mr-2 h-4 w-4" />
              Discover
            </Button>
            
            {isCreator && (
              <Button 
                variant={activeTab === 'creator' ? 'default' : 'ghost'} 
                className="w-full justify-start" 
                onClick={() => setActiveTab('creator')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Creator Dashboard
              </Button>
            )}
            
            <Separator className="bg-[#2c2e36] my-4" />
            
            {isCreator && (
              <>
                <p className="text-sm font-medium text-gray-400 px-2">Creator Tools</p>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setShowCreatePost(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMassMessage(true)}>
                  <Radio className="mr-2 h-4 w-4" />
                  Mass Message
                </Button>
                
                <div className="bg-[#252836] p-3 rounded-lg mt-4">
                  <p className="text-sm font-medium mb-2">Quick Stats</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subscribers:</span>
                      <span className="text-[#00aff0]">{creatorStats.subscribers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earnings:</span>
                      <span className="text-green-400">${(creatorStats.earnings / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posts:</span>
                      <span>{creatorStats.posts}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {!isCreator && (
              <Button 
                onClick={handleBecomeCreator}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Become a Creator
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'feed' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Your Feed</h2>
              
              {posts.length === 0 ? (
                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to KikStars!</h3>
                    <p className="text-gray-400 mb-4">Discover amazing creators and their exclusive content</p>
                    <Button onClick={() => setActiveTab('discover')} className="bg-[#00aff0]">
                      Explore Creators
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Card key={post.id} className="bg-[#1e2029] border-[#2c2e36]">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-[#252836] rounded-full flex items-center justify-center">
                            <span className="font-semibold">{post.profiles?.display_name?.charAt(0) || 'U'}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{post.profiles?.display_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-400">@{post.profiles?.username || 'user'}</p>
                          </div>
                          {post.is_ppv && (
                            <Badge className="bg-yellow-600">PPV ${(post.ppv_price / 100).toFixed(2)}</Badge>
                          )}
                        </div>
                        
                        <p className="mb-4">{post.content}</p>
                        
                        {post.media_urls && post.media_urls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {post.media_urls.map((url: string, index: number) => (
                              <img 
                                key={index}
                                src={url} 
                                alt="Post media"
                                className="rounded-lg w-full h-48 object-cover"
                              />
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[#2c2e36]">
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" onClick={() => handlePostAction('like', post.id)}>
                              <Heart className="h-4 w-4 mr-1" />
                              {post.likes_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePostAction('comment', post.id)}>
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePostAction('share', post.id)}>
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handlePostAction('bookmark', post.id)}>
                              <Bookmark className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-[#00aff0]"
                              onClick={() => openTipDialog(post.creator_id)}
                            >
                              <Gift className="h-4 w-4 mr-1" />
                              Tip
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Discover Creators</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <Card key={creator.id} className="bg-[#1e2029] border-[#2c2e36] overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                    <CardContent className="p-6 -mt-6">
                      <div className="w-16 h-16 bg-[#252836] rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-[#1e2029]">
                        <span className="font-semibold text-lg">{creator.profiles?.display_name?.charAt(0) || 'U'}</span>
                      </div>
                      
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg">{creator.profiles?.display_name || 'Unknown'}</h3>
                        <p className="text-gray-400 text-sm">@{creator.profiles?.username || 'user'}</p>
                        <p className="text-sm mt-2">{creator.profiles?.bio || 'No bio available'}</p>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-400 mb-4">
                        <span>{creator.total_subscribers || 0} subscribers</span>
                        <span>${((creator.subscription_price || 999) / 100).toFixed(2)}/month</span>
                      </div>
                      
                      <Button 
                        className="w-full bg-[#00aff0] hover:bg-[#0095cc]"
                        onClick={() => handleSubscribe(creator.user_id, creator.subscription_price || 999)}
                      >
                        Subscribe ${((creator.subscription_price || 999) / 100).toFixed(2)}/month
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'creator' && isCreator && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Creator Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Subscribers</p>
                        <p className="text-2xl font-bold text-[#00aff0]">{creatorStats.subscribers}</p>
                      </div>
                      <Users className="h-8 w-8 text-[#00aff0]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Earnings</p>
                        <p className="text-2xl font-bold text-green-400">${(creatorStats.earnings / 100).toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Posts</p>
                        <p className="text-2xl font-bold text-purple-400">{creatorStats.posts}</p>
                      </div>
                      <Camera className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">This Month</p>
                        <p className="text-2xl font-bold text-yellow-400">$0.00</p>
                      </div>
                      <Calendar className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full bg-[#00aff0] hover:bg-[#0095cc]"
                      onClick={() => setShowCreatePost(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Post
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-[#2c2e36]"
                      onClick={() => setShowMassMessage(true)}
                    >
                      <Radio className="mr-2 h-4 w-4" />
                      Send Mass Message
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#1e2029] border-[#2c2e36]">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-center py-4">No recent activity</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={postForm.content}
                onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What's on your mind?"
                className="bg-[#252836] border-[#2c2e36] text-white mt-2 min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Content Type</Label>
                <Select value={postForm.contentType} onValueChange={(value) => setPostForm(prev => ({ ...prev, contentType: value }))}>
                  <SelectTrigger className="bg-[#252836] border-[#2c2e36] text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Upload Media</Label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-400 mt-2
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#00aff0] file:text-white
                    hover:file:bg-[#0095cc]"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={postForm.isPPV}
                  onCheckedChange={(checked) => setPostForm(prev => ({ ...prev, isPPV: checked }))}
                />
                <Label>Pay-Per-View</Label>
              </div>
              
              {postForm.isPPV && (
                <div>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={postForm.ppvPrice}
                    onChange={(e) => setPostForm(prev => ({ ...prev, ppvPrice: Number(e.target.value) }))}
                    placeholder="Price ($)"
                    className="bg-[#252836] border-[#2c2e36] text-white w-24"
                  />
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowCreatePost(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreatePost} className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]">
                <Upload className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Settings Dialog */}
      <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
        <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={profileForm.display_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
              />
            </div>
            
            <div>
              <Label>Username</Label>
              <Input
                value={profileForm.username}
                onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
              />
            </div>
            
            <div>
              <Label>Bio</Label>
              <Textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
                placeholder="Tell people about yourself..."
              />
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowProfileSettings(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]">
                Save Changes
              </Button>
            </div>
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
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={tipForm.amount}
                onChange={(e) => setTipForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
              />
            </div>
            
            <div>
              <Label>Message (Optional)</Label>
              <Input
                value={tipForm.message}
                onChange={(e) => setTipForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Send a message with your tip..."
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowTipDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSendTip} className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]">
                <Gift className="mr-2 h-4 w-4" />
                Send ${tipForm.amount} Tip
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
            <div>
              <Label>Message Content</Label>
              <Textarea
                value={massMessage.content}
                onChange={(e) => setMassMessage(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Message to send to all subscribers..."
                className="bg-[#252836] border-[#2c2e36] text-white mt-2 min-h-[100px]"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={massMessage.isPPV}
                  onCheckedChange={(checked) => setMassMessage(prev => ({ ...prev, isPPV: checked }))}
                />
                <Label>Pay-Per-View Message</Label>
              </div>
              
              {massMessage.isPPV && (
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={massMessage.ppvPrice}
                  onChange={(e) => setMassMessage(prev => ({ ...prev, ppvPrice: Number(e.target.value) }))}
                  placeholder="Price ($)"
                  className="bg-[#252836] border-[#2c2e36] text-white w-24"
                />
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowMassMessage(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSendMassMessage} className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]">
                <Send className="mr-2 h-4 w-4" />
                Send to All Subscribers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
