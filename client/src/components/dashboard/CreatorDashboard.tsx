import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  DollarSign, 
  Users, 
  MessageSquare, 
  Upload, 
  Calendar,
  TrendingUp,
  Heart,
  Video,
  Camera,
  Send,
  Gift,
  Settings,
  BarChart3,
  Eye,
  Clock,
  Star,
  Lock,
  Radio
} from 'lucide-react';

interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalSubscribers: number;
  newSubscribers: number;
  totalPosts: number;
  totalViews: number;
  averageRating: number;
  messagesReceived: number;
  tips: number;
  ppvSales: number;
}

interface Subscriber {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  subscribedAt: string;
  isActive: boolean;
  totalSpent: number;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  isPPV: boolean;
  ppvPrice?: number;
  mediaUrl?: string;
  createdAt: string;
  isRead: boolean;
}

const CreatorDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CreatorStats>({
    totalEarnings: 12450.00,
    monthlyEarnings: 3250.00,
    totalSubscribers: 1284,
    newSubscribers: 47,
    totalPosts: 156,
    totalViews: 45230,
    averageRating: 4.8,
    messagesReceived: 23,
    tips: 850.00,
    ppvSales: 1200.00
  });

  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    {
      id: '1',
      username: 'user123',
      displayName: 'John Doe',
      avatar: '/placeholder.svg',
      subscribedAt: '2024-01-15',
      isActive: true,
      totalSpent: 125.50
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: 'user1',
      username: 'fan_user',
      content: 'Love your content! Can you do a custom video?',
      isPPV: false,
      createdAt: '2024-01-20T10:30:00Z',
      isRead: false
    }
  ]);

  // Content Upload State
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    isPremium: false,
    isPPV: false,
    ppvPrice: '',
    scheduledAt: '',
    tags: ''
  });

  // Mass Message State
  const [massMessage, setMassMessage] = useState({
    content: '',
    isPPV: false,
    ppvPrice: '',
    targetGroup: 'all', // all, active, new
    includeMedia: false
  });

  // Live Stream State
  const [liveStream, setLiveStream] = useState({
    isLive: false,
    title: '',
    description: '',
    price: '',
    viewerCount: 0
  });

  // Welcome Message State
  const [welcomeMessage, setWelcomeMessage] = useState({
    enabled: true,
    content: 'Welcome to my page! Thanks for subscribing ❤️',
    includeMedia: false,
    mediaUrl: ''
  });

  const handleFileUpload = async (file: File, type: 'post' | 'message' | 'welcome') => {
    // Simulate file upload
    toast.info('File upload functionality - integrate with storage service');
    return 'https://example.com/uploaded-file.jpg';
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) {
      toast.error('Please enter a post title');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to create post
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Post created successfully!');
      setPostForm({
        title: '',
        description: '',
        isPremium: false,
        isPPV: false,
        ppvPrice: '',
        scheduledAt: '',
        tags: ''
      });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalPosts: prev.totalPosts + 1
      }));
      
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMassMessage = async () => {
    if (!massMessage.content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to send mass message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const targetCount = massMessage.targetGroup === 'all' ? stats.totalSubscribers :
                         massMessage.targetGroup === 'new' ? stats.newSubscribers : 
                         Math.floor(stats.totalSubscribers * 0.8);
      
      toast.success(`Mass message sent to ${targetCount} subscribers!`);
      setMassMessage({
        content: '',
        isPPV: false,
        ppvPrice: '',
        targetGroup: 'all',
        includeMedia: false
      });
      
    } catch (error) {
      toast.error('Failed to send mass message');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLiveStream = async () => {
    if (!liveStream.title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    setLoading(true);
    try {
      // Simulate starting live stream
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLiveStream(prev => ({ ...prev, isLive: true, viewerCount: 1 }));
      toast.success('Live stream started! Share your stream link with subscribers.');
      
    } catch (error) {
      toast.error('Failed to start live stream');
    } finally {
      setLoading(false);
    }
  };

  const handleStopLiveStream = () => {
    setLiveStream(prev => ({ ...prev, isLive: false, viewerCount: 0 }));
    toast.info('Live stream ended');
  };

  const handleUpdateWelcomeMessage = async () => {
    setLoading(true);
    try {
      // Simulate API call to update welcome message
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Welcome message updated!');
    } catch (error) {
      toast.error('Failed to update welcome message');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyToMessage = (messageId: string, reply: string) => {
    toast.info('Message reply functionality - integrate with messaging system');
  };

  const handleSetSubscriptionPrice = async (price: number) => {
    try {
      // Simulate API call to update subscription price
      toast.success(`Subscription price updated to $${price}/month`);
    } catch (error) {
      toast.error('Failed to update subscription price');
    }
  };

  return (
    <div className="min-h-screen bg-[#13151a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-gray-400">Welcome back, {profile?.display_name}</p>
          </div>
          <div className="flex gap-4">
            <Button className="bg-[#00aff0] hover:bg-[#0095cc]">
              <Camera className="h-4 w-4 mr-2" />
              Quick Post
            </Button>
            <Button variant="outline" className="border-[#2c2e36]">
              <Video className="h-4 w-4 mr-2" />
              Go Live
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1e2029] border-[#2c2e36]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-400">${stats.totalEarnings.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">+12% from last month</p>
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
                  <p className="text-2xl font-bold text-[#00aff0]">{stats.totalSubscribers.toLocaleString()}</p>
                  <p className="text-sm text-green-400">+{stats.newSubscribers} this month</p>
                </div>
                <Users className="h-8 w-8 text-[#00aff0]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e2029] border-[#2c2e36]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{stats.totalPosts} posts</p>
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
                  <p className="text-2xl font-bold text-pink-400">{stats.messagesReceived}</p>
                  <p className="text-sm text-gray-500">New messages</p>
                </div>
                <MessageSquare className="h-8 w-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-[#1e2029] border-[#2c2e36]">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="live">Live Stream</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Post */}
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Create New Post
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={postForm.tags}
                    onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-[#252836] border-[#2c2e36]"
                  />
                  
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
                    type="datetime-local"
                    placeholder="Schedule for later"
                    value={postForm.scheduledAt}
                    onChange={(e) => setPostForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="bg-[#252836] border-[#2c2e36]"
                  />

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#252836] border border-[#2c2e36] hover:bg-[#2c2e36]">
                      <Camera className="h-4 w-4 mr-2" />
                      Add Media
                    </Button>
                    <Button onClick={handleCreatePost} disabled={loading} className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]">
                      {loading ? 'Publishing...' : 'Publish Post'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Schedule */}
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Scheduled Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
                      <div>
                        <p className="font-medium">Behind the scenes video</p>
                        <p className="text-sm text-gray-400">Tomorrow at 2:00 PM</p>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#252836] rounded-lg">
                      <div>
                        <p className="font-medium">Weekly Q&A Session</p>
                        <p className="text-sm text-gray-400">Friday at 7:00 PM</p>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messaging Tab */}
          <TabsContent value="messaging" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mass Messaging */}
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Radio className="h-5 w-5 mr-2" />
                    Mass Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={massMessage.targetGroup} onValueChange={(value) => setMassMessage(prev => ({ ...prev, targetGroup: value }))}>
                    <SelectTrigger className="bg-[#252836] border-[#2c2e36]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers ({stats.totalSubscribers})</SelectItem>
                      <SelectItem value="active">Active Subscribers ({Math.floor(stats.totalSubscribers * 0.8)})</SelectItem>
                      <SelectItem value="new">New Subscribers ({stats.newSubscribers})</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Your message to subscribers..."
                    value={massMessage.content}
                    onChange={(e) => setMassMessage(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-[#252836] border-[#2c2e36]"
                    rows={4}
                  />

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={massMessage.isPPV}
                        onCheckedChange={(checked) => setMassMessage(prev => ({ ...prev, isPPV: checked }))}
                      />
                      <Label>PPV Message</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={massMessage.includeMedia}
                        onCheckedChange={(checked) => setMassMessage(prev => ({ ...prev, includeMedia: checked }))}
                      />
                      <Label>Include Media</Label>
                    </div>
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

                  <Button onClick={handleSendMassMessage} disabled={loading} className="w-full bg-[#00aff0] hover:bg-[#0095cc]">
                    {loading ? 'Sending...' : 'Send Mass Message'}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Recent Messages
                    </span>
                    <Badge>{stats.messagesReceived} new</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="p-3 bg-[#252836] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">@{message.username}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{message.content}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-[#2c2e36]">
                            Reply
                          </Button>
                          <Button size="sm" variant="outline" className="border-[#2c2e36]">
                            Send PPV
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Welcome Message Setup */}
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Welcome Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={welcomeMessage.enabled}
                      onCheckedChange={(checked) => setWelcomeMessage(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label>Enable welcome message for new subscribers</Label>
                  </div>

                  {welcomeMessage.enabled && (
                    <>
                      <Textarea
                        placeholder="Welcome message content..."
                        value={welcomeMessage.content}
                        onChange={(e) => setWelcomeMessage(prev => ({ ...prev, content: e.target.value }))}
                        className="bg-[#252836] border-[#2c2e36]"
                        rows={3}
                      />

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={welcomeMessage.includeMedia}
                          onCheckedChange={(checked) => setWelcomeMessage(prev => ({ ...prev, includeMedia: checked }))}
                        />
                        <Label>Include welcome media</Label>
                      </div>

                      <Button onClick={handleUpdateWelcomeMessage} disabled={loading} className="w-full bg-[#00aff0] hover:bg-[#0095cc]">
                        {loading ? 'Updating...' : 'Update Welcome Message'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Subscriptions</span>
                      <span className="font-semibold">${(stats.monthlyEarnings * 0.7).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tips</span>
                      <span className="font-semibold">${stats.tips}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">PPV Sales</span>
                      <span className="font-semibold">${stats.ppvSales}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Live Streams</span>
                      <span className="font-semibold">${((stats.monthlyEarnings * 0.3) - stats.tips - stats.ppvSales).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="text-lg">Top Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Behind the scenes</span>
                      <span className="text-xs text-gray-400">1.2K views</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Q&A Session</span>
                      <span className="text-xs text-gray-400">980 views</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tutorial Video</span>
                      <span className="text-xs text-gray-400">750 views</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="text-lg">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Avg. Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-semibold">{stats.averageRating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Retention Rate</span>
                      <span className="font-semibold">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Response Rate</span>
                      <span className="font-semibold">92%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-6">
            <Card className="bg-[#1e2029] border-[#2c2e36]">
              <CardHeader>
                <CardTitle>Subscriber Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2c2e36]">
                        <th className="text-left py-3">Subscriber</th>
                        <th className="text-left py-3">Joined</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-left py-3">Total Spent</th>
                        <th className="text-left py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-b border-[#2c2e36]">
                          <td className="py-3">
                            <div className="flex items-center">
                              <img 
                                src={subscriber.avatar} 
                                alt={subscriber.displayName}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                              <div>
                                <p className="font-medium">{subscriber.displayName}</p>
                                <p className="text-sm text-gray-400">@{subscriber.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-gray-400">
                            {new Date(subscriber.subscribedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <Badge variant={subscriber.isActive ? "default" : "secondary"}>
                              {subscriber.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 font-semibold">
                            ${subscriber.totalSpent.toFixed(2)}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-[#2c2e36]">
                                Message
                              </Button>
                              <Button size="sm" variant="outline" className="border-[#2c2e36]">
                                View Profile
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Stream Tab */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Live Stream Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!liveStream.isLive ? (
                    <>
                      <Input
                        placeholder="Stream title"
                        value={liveStream.title}
                        onChange={(e) => setLiveStream(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-[#252836] border-[#2c2e36]"
                      />
                      <Textarea
                        placeholder="Stream description"
                        value={liveStream.description}
                        onChange={(e) => setLiveStream(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-[#252836] border-[#2c2e36]"
                        rows={3}
                      />
                      <Input
                        type="number"
                        placeholder="Stream price (optional)"
                        value={liveStream.price}
                        onChange={(e) => setLiveStream(prev => ({ ...prev, price: e.target.value }))}
                        className="bg-[#252836] border-[#2c2e36]"
                      />
                      <Button onClick={handleStartLiveStream} disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                        {loading ? 'Starting...' : 'Start Live Stream'}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-red-500 font-semibold">LIVE</span>
                      </div>
                      <h3 className="font-semibold text-lg">{liveStream.title}</h3>
                      <p className="text-gray-400">{liveStream.viewerCount} viewers</p>
                      <Button onClick={handleStopLiveStream} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                        End Stream
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle>Stream History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-[#252836] rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Monday Night Chat</span>
                        <span className="text-xs text-gray-400">2 days ago</span>
                      </div>
                      <p className="text-sm text-gray-400">Duration: 2h 15m • 345 viewers</p>
                      <p className="text-sm text-green-400">Earnings: $125.50</p>
                    </div>
                    <div className="p-3 bg-[#252836] rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Behind the Scenes</span>
                        <span className="text-xs text-gray-400">1 week ago</span>
                      </div>
                      <p className="text-sm text-gray-400">Duration: 1h 30m • 278 viewers</p>
                      <p className="text-sm text-green-400">Earnings: $89.00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle>Subscription Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Monthly Subscription Price</Label>
                    <div className="flex items-center mt-2">
                      <span className="text-2xl mr-2">$</span>
                      <Input
                        type="number"
                        placeholder="9.99"
                        className="bg-[#252836] border-[#2c2e36]"
                        onChange={(e) => handleSetSubscriptionPrice(parseFloat(e.target.value))}
                      />
                      <span className="ml-2 text-gray-400">/month</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Allow free trial (3 days)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Promotional pricing</Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle>Content Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Watermark content</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Allow downloads</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Auto-post to social media</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Content moderation</Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Payout Schedule</Label>
                    <Select>
                      <SelectTrigger className="bg-[#252836] border-[#2c2e36] mt-2">
                        <SelectValue placeholder="Weekly" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Payment Method</Label>
                    <Button variant="outline" className="w-full mt-2 border-[#2c2e36]">
                      Connect Stripe Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1e2029] border-[#2c2e36]">
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Public profile</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Allow search indexing</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Show earnings publicly</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Anonymous analytics</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorDashboard;