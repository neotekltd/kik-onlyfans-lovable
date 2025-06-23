
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Camera, 
  Upload, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Eye,
  Heart,
  MessageCircle,
  Settings,
  PlusCircle,
  Image as ImageIcon,
  Video,
  Music
} from 'lucide-react';

const Creator = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "This Month's Earnings",
      value: "$1,247.50",
      change: "+15.2%",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-600"
    },
    {
      title: "New Subscribers",
      value: "28",
      change: "+8 this week",
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600"
    },
    {
      title: "Content Views",
      value: "12.4K",
      change: "+23.1%",
      icon: <Eye className="h-5 w-5" />,
      color: "text-purple-600"
    },
    {
      title: "Engagement Rate",
      value: "8.9%",
      change: "+2.1%",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-orange-600"
    }
  ];

  const recentPosts = [
    {
      id: '1',
      title: 'Behind the scenes from today\'s shoot',
      type: 'image',
      views: 1247,
      likes: 234,
      comments: 45,
      earnings: 89.50,
      timestamp: '2 hours ago',
      visibility: 'subscribers'
    },
    {
      id: '2',
      title: 'Exclusive video content',
      type: 'video',
      views: 892,
      likes: 156,
      comments: 23,
      earnings: 67.25,
      timestamp: '5 hours ago',
      visibility: 'ppv'
    },
    {
      id: '3',
      title: 'Special announcement for fans',
      type: 'text',
      views: 2156,
      likes: 445,
      comments: 89,
      earnings: 0,
      timestamp: '1 day ago',
      visibility: 'free'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Studio</h1>
              <p className="text-gray-600 mt-1">
                Manage your content, track earnings, and grow your audience
              </p>
            </div>
            <Button className="gradient-creator">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Post
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="create">Create Content</TabsTrigger>
              <TabsTrigger value="posts">Manage Posts</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Create Content Tab */}
            <TabsContent value="create">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Camera className="h-5 w-5" />
                      <span>Create New Post</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Post Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter a catchy title for your post..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell your fans what this post is about..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Button variant="outline" className="h-20 flex-col">
                          <ImageIcon className="h-6 w-6 mb-2" />
                          <span className="text-sm">Photo</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col">
                          <Video className="h-6 w-6 mb-2" />
                          <span className="text-sm">Video</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col">
                          <Music className="h-6 w-6 mb-2" />
                          <span className="text-sm">Audio</span>
                        </Button>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-400 transition-colors cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG, MP4, WebM up to 1GB</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Post Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free - Anyone can see</SelectItem>
                          <SelectItem value="subscribers">Subscribers Only</SelectItem>
                          <SelectItem value="ppv">Pay-per-view</SelectItem>
                          <SelectItem value="premium">Premium Subscribers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (if PPV)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.00"
                          className="pl-10"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="comments">Allow Comments</Label>
                        <p className="text-sm text-gray-500">Let fans comment on this post</p>
                      </div>
                      <Switch id="comments" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="download">Allow Download</Label>
                        <p className="text-sm text-gray-500">Subscribers can download this content</p>
                      </div>
                      <Switch id="download" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schedule">Schedule Post</Label>
                      <Input
                        id="schedule"
                        type="datetime-local"
                      />
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button className="w-full gradient-creator">
                        Publish Post
                      </Button>
                      <Button variant="outline" className="w-full">
                        Save as Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Manage Posts Tab */}
            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            {post.type === 'image' && <ImageIcon className="h-6 w-6 text-gray-400" />}
                            {post.type === 'video' && <Video className="h-6 w-6 text-gray-400" />}
                            {post.type === 'text' && <MessageCircle className="h-6 w-6 text-gray-400" />}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{post.title}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              <span>{post.timestamp}</span>
                              <Badge variant={
                                post.visibility === 'free' ? 'secondary' :
                                post.visibility === 'subscribers' ? 'default' :
                                post.visibility === 'ppv' ? 'destructive' : 'outline'
                              }>
                                {post.visibility.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-green-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>{post.earnings.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Earnings chart will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscriber Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Subscriber growth chart will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly">Monthly Subscription</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="monthly"
                          type="number"
                          placeholder="9.99"
                          className="pl-10"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="annual">Annual Subscription (Optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="annual"
                          type="number"
                          placeholder="99.99"
                          className="pl-10"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <Button className="w-full">Update Pricing</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Creator Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Auto-Accept Tips</Label>
                        <p className="text-sm text-gray-500">Automatically accept all tips from subscribers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Public Profile</Label>
                        <p className="text-sm text-gray-500">Allow your profile to be discoverable</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive email updates for new subscribers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Creator;
