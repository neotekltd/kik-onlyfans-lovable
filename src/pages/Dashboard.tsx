
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Users, Heart, TrendingUp, Camera, MessageCircle, Bell, Settings } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [posts] = useState([
    {
      id: '1',
      creator: {
        name: 'Autumn Ren',
        username: '@autumnren',
        avatar: '/placeholder.svg',
        verified: true
      },
      content: "Just uploaded some amazing new content! 💕 Can't wait for you all to see it...",
      timestamp: '3:50 pm',
      likes: 234,
      comments: 45,
      isSubscribed: true,
      hasMedia: true,
      price: null
    },
    {
      id: '2',
      creator: {
        name: 'Tita Sahara',
        username: '@titasahara',
        avatar: '/placeholder.svg',
        verified: true
      },
      content: "DON'T MISS OUT ON THAT BUNDLE... 🔥",
      timestamp: '3:33 pm',
      likes: 189,
      comments: 32,
      isSubscribed: false,
      hasMedia: true,
      price: 25.99
    }
  ]);

  const stats = user?.isCreator ? [
    {
      title: "Total Earnings",
      value: `$${user.earnings?.toFixed(2) || '0.00'}`,
      change: "+12.5%",
      icon: <DollarSign className="h-4 w-4" />,
      color: "text-green-600"
    },
    {
      title: "Subscribers",
      value: user.subscriberCount?.toString() || '0',
      change: "+8 this week",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600"
    },
    {
      title: "Total Likes",
      value: "2.3K",
      change: "+15.2%",
      icon: <Heart className="h-4 w-4" />,
      color: "text-pink-600"
    },
    {
      title: "Content Views",
      value: "45.2K",
      change: "+23.1%",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-purple-600"
    }
  ] : [
    {
      title: "Active Subscriptions",
      value: "8",
      change: "+2 this month",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600"
    },
    {
      title: "Content Unlocked",
      value: "156",
      change: "+12 this week",
      icon: <Camera className="h-4 w-4" />,
      color: "text-purple-600"
    },
    {
      title: "Messages Sent",
      value: "89",
      change: "+5 today",
      icon: <MessageCircle className="h-4 w-4" />,
      color: "text-green-600"
    },
    {
      title: "Likes Given",
      value: "1.2K",
      change: "+45 this week",
      icon: <Heart className="h-4 w-4" />,
      color: "text-pink-600"
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
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.displayName}!
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.isCreator ? "Here's what's happening with your content" : "Discover amazing content from your favorite creators"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feed */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {user?.isCreator ? "Your Recent Posts" : "Latest from Creators"}
                    <Button size="sm" className="gradient-bg">
                      {user?.isCreator ? "Create Post" : "Explore More"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarImage src={post.creator.avatar} />
                          <AvatarFallback>{post.creator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{post.creator.name}</h4>
                            {post.creator.verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                            <span className="text-sm text-gray-500">{post.creator.username}</span>
                            <span className="text-sm text-gray-400">·</span>
                            <span className="text-sm text-gray-400">{post.timestamp}</span>
                          </div>
                          <p className="text-gray-800 mb-3">{post.content}</p>
                          
                          {post.hasMedia && (
                            <div className="bg-gray-100 rounded-lg h-48 mb-3 flex items-center justify-center relative">
                              {post.price && !post.isSubscribed ? (
                                <div className="text-center">
                                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600">Unlock for ${post.price}</p>
                                  <Button size="sm" className="mt-2 gradient-creator">
                                    Unlock Content
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center text-gray-500">
                                  <Camera className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-sm">Premium Content</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-6 text-gray-500">
                            <button className="flex items-center space-x-2 hover:text-pink-600 transition-colors">
                              <Heart className="h-4 w-4" />
                              <span className="text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm">{post.comments}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {user?.isCreator ? (
                <>
                  {/* Creator Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full gradient-bg">
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Content
                      </Button>
                      <Button variant="outline" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message Fans
                      </Button>
                      <Button variant="outline" className="w-full">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Top Supporters */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Supporters</CardTitle>
                      <CardDescription>Your biggest fans this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['John D.', 'Sarah M.', 'Mike R.'].map((supporter, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{supporter.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{supporter}</span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              ${(50 - index * 10).toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Suggested Creators */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Suggested Creators</CardTitle>
                      <CardDescription>Creators you might like</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['Luna Star', 'Violet Myers', 'Emma Rose'].map((creator, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{creator.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{creator}</p>
                                <p className="text-sm text-gray-500">{45 + index * 20} posts</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Subscribe
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span>You liked Luna Star's post</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span>New message from Emma Rose</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span>Subscribed to Violet Myers</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
