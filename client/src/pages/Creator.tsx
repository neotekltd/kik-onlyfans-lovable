
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  User, 
  Star, 
  Calendar, 
  DollarSign, 
  Users, 
  Heart,
  MessageCircle,
  Share2,
  Camera,
  Video,
  Image as ImageIcon,
  Upload,
  Edit,
  Trash2,
  Eye,
  Lock,
  Plus,
  TrendingUp
} from 'lucide-react';

interface CreatorProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  is_verified: boolean;
  total_subscribers: number;
  subscription_price: number;
  total_posts: number;
  total_earnings: number;
  created_at: string;
}

interface Post {
  id: string;
  title?: string;
  description?: string;
  content_type: string;
  media_urls?: string[];
  thumbnail_url?: string;
  is_premium: boolean;
  is_ppv: boolean;
  ppv_price?: number;
  is_published: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
}

const Creator: React.FC = () => {
  const { username } = useParams();
  const { user, profile } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    content_type: 'image',
    is_premium: false,
    is_ppv: false,
    ppv_price: 0
  });

  const isOwnProfile = profile?.username === username;

  useEffect(() => {
    fetchCreatorData();
  }, [username]);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);

      // Fetch creator profile
      const creatorResponse = await fetch(`/api/creators/${username}`);
      if (creatorResponse.ok) {
        const creatorData = await creatorResponse.json();
        setCreator(creatorData);

        // Fetch creator's posts
        const postsResponse = await fetch(`/api/creators/${creatorData.id}/posts`);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData || []);
        }
      } else {
        toast.error('Creator not found');
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !creator) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: user.id,
          creator_id: creator.id,
          amount_paid: creator.subscription_price * 100 // Convert to cents
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success(`Successfully subscribed to ${creator.display_name}!`);
      } else {
        toast.error('Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe');
    }
  };

  const handleCreatePost = async () => {
    if (!user || !creator) return;

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: creator.id,
          title: newPost.title,
          description: newPost.description,
          content_type: newPost.content_type,
          is_premium: newPost.is_premium,
          is_ppv: newPost.is_ppv,
          ppv_price: newPost.is_ppv ? newPost.ppv_price * 100 : 0, // Convert to cents
          is_published: true,
          media_urls: ['/placeholder-content.jpg'] // Placeholder
        })
      });

      if (response.ok) {
        const post = await response.json();
        setPosts(prev => [post, ...prev]);
        setShowCreatePost(false);
        setNewPost({
          title: '',
          description: '',
          content_type: 'image',
          is_premium: false,
          is_ppv: false,
          ppv_price: 0
        });
        toast.success('Post created successfully!');
      } else {
        toast.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        toast.success('Post deleted successfully');
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleTip = async () => {
    if (!user || !creator) return;

    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipper_id: user.id,
          creator_id: creator.id,
          amount: 500, // $5.00 in cents
          message: 'Keep up the great work!'
        })
      });

      if (response.ok) {
        toast.success('Tip sent successfully!');
      } else {
        toast.error('Failed to send tip');
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      toast.error('Failed to send tip');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13151a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
          <p className="text-white">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#13151a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Creator Not Found</h2>
          <p className="text-gray-400">The creator you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13151a] text-white">
      {/* Cover Image */}
      <div className="h-64 bg-gradient-to-r from-purple-600 to-pink-600 relative">
        {creator.cover_url && (
          <img 
            src={creator.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-[#1e2029] rounded-lg p-6 mb-6 border border-[#2c2e36]">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1e2029]">
                <img 
                  src={creator.avatar_url || '/placeholder.svg'} 
                  alt={creator.display_name}
                  className="w-full h-full object-cover"
                />
              </div>
              {creator.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-[#00aff0] rounded-full p-2">
                  <Star className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{creator.display_name}</h1>
                  <p className="text-gray-400 mb-2">@{creator.username}</p>
                  {creator.bio && (
                    <p className="text-gray-300 mb-4 max-w-2xl">{creator.bio}</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold">{creator.total_posts}</p>
                      <p className="text-sm text-gray-400">Posts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{creator.total_subscribers}</p>
                      <p className="text-sm text-gray-400">Subscribers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">${(creator.subscription_price / 100).toFixed(2)}</p>
                      <p className="text-sm text-gray-400">per month</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {!isOwnProfile ? (
                    <>
                      {!isSubscribed ? (
                        <Button 
                          onClick={handleSubscribe}
                          className="bg-[#00aff0] hover:bg-[#0095cc] text-white px-8"
                        >
                          Subscribe ${(creator.subscription_price / 100).toFixed(2)}/mo
                        </Button>
                      ) : (
                        <Button variant="outline" className="border-green-500 text-green-500">
                          Subscribed ✓
                        </Button>
                      )}
                      <Button 
                        onClick={handleTip}
                        variant="outline" 
                        className="border-[#00aff0] text-[#00aff0]"
                      >
                        Tip $5
                      </Button>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setShowCreatePost(true)}
                      className="bg-[#00aff0] hover:bg-[#0095cc] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1e2029] mb-6">
            <TabsTrigger value="posts" className="data-[state=active]:bg-[#00aff0]">
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-[#00aff0]">
              About
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="analytics" className="data-[state=active]:bg-[#00aff0]">
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts">
            {posts.length === 0 ? (
              <Card className="bg-[#1e2029] border-0">
                <CardContent className="p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-gray-400">
                    {isOwnProfile ? 'Start creating content to build your audience!' : 'This creator hasn\'t posted anything yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-[#1e2029] border-0 overflow-hidden">
                    {/* Post Image */}
                    <div className="aspect-square relative">
                      {post.thumbnail_url ? (
                        <img 
                          src={post.thumbnail_url} 
                          alt={post.title || 'Post'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#252836] flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Overlay for premium/PPV content */}
                      {(post.is_premium || post.is_ppv) && !isOwnProfile && !isSubscribed && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="w-8 h-8 text-white mb-2 mx-auto" />
                            {post.is_ppv ? (
                              <p className="text-white font-bold">${(post.ppv_price! / 100).toFixed(2)}</p>
                            ) : (
                              <p className="text-white">Subscribe to view</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Post type indicator */}
                      <div className="absolute top-2 left-2">
                        {post.is_ppv && (
                          <Badge className="bg-yellow-500 text-black">
                            PPV ${(post.ppv_price! / 100).toFixed(2)}
                          </Badge>
                        )}
                        {post.is_premium && !post.is_ppv && (
                          <Badge className="bg-purple-500">Premium</Badge>
                        )}
                      </div>

                      {/* Owner controls */}
                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button size="sm" variant="secondary" className="p-2">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="p-2"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Post Info */}
                    <CardContent className="p-4">
                      {post.title && (
                        <h3 className="font-semibold mb-2 line-clamp-1">{post.title}</h3>
                      )}
                      {post.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{post.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comment_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.view_count}
                          </span>
                        </div>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card className="bg-[#1e2029] border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">About {creator.display_name}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 mb-2">Bio</p>
                    <p className="text-white">{creator.bio || 'No bio available'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">Joined</p>
                    <p className="text-white">{new Date(creator.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">Subscription Price</p>
                    <p className="text-white">${(creator.subscription_price / 100).toFixed(2)} per month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab (Creator Only) */}
          {isOwnProfile && (
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="bg-[#1e2029] border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Earnings</p>
                        <p className="text-2xl font-bold">${(creator.total_earnings / 100).toFixed(2)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1e2029] border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Subscribers</p>
                        <p className="text-2xl font-bold">{creator.total_subscribers}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1e2029] border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Posts</p>
                        <p className="text-2xl font-bold">{creator.total_posts}</p>
                      </div>
                      <Camera className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1e2029] border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Monthly Revenue</p>
                        <p className="text-2xl font-bold">${((creator.total_subscribers * creator.subscription_price) / 100).toFixed(2)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-pink-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1e2029] border-0 w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-[#252836] border-[#2c2e36]"
                  placeholder="Enter post title..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPost.description}
                  onChange={(e) => setNewPost(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-[#252836] border-[#2c2e36]"
                  placeholder="What's on your mind?"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={newPost.is_premium}
                  onCheckedChange={(checked) => setNewPost(prev => ({ ...prev, is_premium: checked }))}
                />
                <Label htmlFor="premium">Premium content (subscribers only)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ppv"
                  checked={newPost.is_ppv}
                  onCheckedChange={(checked) => setNewPost(prev => ({ ...prev, is_ppv: checked }))}
                />
                <Label htmlFor="ppv">Pay-per-view content</Label>
              </div>
              
              {newPost.is_ppv && (
                <div>
                  <Label htmlFor="ppv-price">PPV Price ($)</Label>
                  <Input
                    id="ppv-price"
                    type="number"
                    value={newPost.ppv_price}
                    onChange={(e) => setNewPost(prev => ({ ...prev, ppv_price: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#252836] border-[#2c2e36]"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreatePost}
                  className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]"
                >
                  Create Post
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Creator;
