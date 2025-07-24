
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Star,
  MessageCircle,
  Heart,
  Camera,
  CreditCard,
  AlertCircle
} from 'lucide-react';

const Subscriptions = () => {
  const { user } = useAuth();

  const activeSubscriptions = [
    {
      id: '1',
      creator: {
        name: 'Luna Star',
        username: '@lunastar',
        avatar: '/placeholder.svg',
        verified: true,
        rating: 4.9,
        subscriberCount: '12.5K'
      },
      subscription: {
        tier: 'Premium',
        price: 19.99,
        renewalDate: '2024-01-15',
        joinDate: '2023-11-15',
        status: 'active'
      },
      stats: {
        posts: 156,
        lastPost: '2 hours ago',
        totalSpent: 89.95
      }
    },
    {
      id: '2',
      creator: {
        name: 'Emma Rose',
        username: '@emmarose',
        avatar: '/placeholder.svg',
        verified: true,
        rating: 4.7,
        subscriberCount: '8.2K'
      },
      subscription: {
        tier: 'Basic',
        price: 9.99,
        renewalDate: '2024-01-20',
        joinDate: '2023-12-01',
        status: 'active'
      },
      stats: {
        posts: 89,
        lastPost: '5 hours ago',
        totalSpent: 45.97
      }
    },
    {
      id: '3',
      creator: {
        name: 'Violet Myers',
        username: '@violetmyers',
        avatar: '/placeholder.svg',
        verified: false,
        rating: 4.5,
        subscriberCount: '5.8K'
      },
      subscription: {
        tier: 'VIP',
        price: 29.99,
        renewalDate: '2024-01-10',
        joinDate: '2023-10-20',
        status: 'expiring'
      },
      stats: {
        posts: 203,
        lastPost: '1 day ago',
        totalSpent: 179.94
      }
    }
  ];

  const suggestedCreators = [
    {
      name: 'Aria Sky',
      username: '@ariasky',
      avatar: '/placeholder.svg',
      verified: true,
      rating: 4.8,
      subscriberCount: '15.2K',
      previewPosts: 3,
      startingPrice: 12.99,
      tags: ['Photography', 'Lifestyle', 'Travel']
    },
    {
      name: 'Mia Dawn',
      username: '@miadawn',
      avatar: '/placeholder.svg',
      verified: true,
      rating: 4.6,
      subscriberCount: '9.7K',
      previewPosts: 5,
      startingPrice: 8.99,
      tags: ['Fashion', 'Beauty', 'Fitness']
    },
    {
      name: 'Zoe Night',
      username: '@zoenight',
      avatar: '/placeholder.svg',
      verified: false,
      rating: 4.4,
      subscriberCount: '6.3K',
      previewPosts: 2,
      startingPrice: 15.99,
      tags: ['Art', 'Creative', 'Cosplay']
    }
  ];

  const subscriptionStats = [
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.filter(s => s.subscription.status === 'active').length.toString(),
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600"
    },
    {
      title: "Monthly Spending",
      value: `$${activeSubscriptions.reduce((sum, sub) => sum + sub.subscription.price, 0).toFixed(2)}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-600"
    },
    {
      title: "Total Spent",
      value: `$${activeSubscriptions.reduce((sum, sub) => sum + sub.stats.totalSpent, 0).toFixed(2)}`,
      icon: <CreditCard className="h-5 w-5" />,
      color: "text-purple-600"
    },
    {
      title: "Expiring Soon",
      value: activeSubscriptions.filter(s => s.subscription.status === 'expiring').length.toString(),
      icon: <AlertCircle className="h-5 w-5" />,
      color: "text-orange-600"
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
              <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
              <p className="text-gray-600 mt-1">
                Manage your subscriptions and discover new creators
              </p>
            </div>
            <Button className="gradient-bg">
              Explore Creators
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionStats.map((stat, index) => (
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
              <TabsTrigger value="discover">Discover Creators</TabsTrigger>
              <TabsTrigger value="history">Subscription History</TabsTrigger>
            </TabsList>

            {/* Active Subscriptions */}
            <TabsContent value="active">
              <div className="space-y-6">
                {activeSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={subscription.creator.avatar} />
                            <AvatarFallback>{subscription.creator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {subscription.creator.name}
                              </h3>
                              {subscription.creator.verified && (
                                <Badge variant="secondary" className="text-xs">✓ Verified</Badge>
                              )}
                              <Badge 
                                variant={subscription.subscription.status === 'active' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {subscription.subscription.tier}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{subscription.creator.username}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Rating</p>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{subscription.creator.rating}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500">Posts</p>
                                <p className="font-medium">{subscription.stats.posts}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Last Post</p>
                                <p className="font-medium">{subscription.stats.lastPost}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Subscribers</p>
                                <p className="font-medium">{subscription.creator.subscriberCount}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold text-gray-900">
                            ${subscription.subscription.price}/mo
                          </div>
                          <div className="text-sm text-gray-500">
                            Renews on {new Date(subscription.subscription.renewalDate).toLocaleDateString()}
                          </div>
                          <div className="space-x-2">
                            <Button size="sm" variant="outline">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            <Button size="sm" variant="outline">
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>

                      {subscription.subscription.status === 'expiring' && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <p className="text-sm text-orange-800">
                              This subscription expires in 3 days. Renew to continue accessing content.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Discover Creators */}
            <TabsContent value="discover">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedCreators.map((creator, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <div className="aspect-video bg-gradient-to-br from-brand-100 to-creator-100 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-gray-900">
                          {creator.previewPosts} previews
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={creator.avatar} />
                            <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">{creator.name}</h3>
                              {creator.verified && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{creator.username}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{creator.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span>{creator.subscriberCount}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {creator.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Starting at</p>
                          <p className="text-lg font-bold text-gray-900">${creator.startingPrice}/mo</p>
                        </div>
                        <Button className="gradient-creator group-hover:shadow-lg transition-shadow">
                          Subscribe
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Subscription History */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { creator: 'Luna Star', action: 'Renewed subscription', amount: 19.99, date: '2024-01-01' },
                      { creator: 'Emma Rose', action: 'New subscription', amount: 9.99, date: '2023-12-01' },
                      { creator: 'Violet Myers', action: 'Upgraded to VIP', amount: 29.99, date: '2023-11-15' },
                      { creator: 'Aria Sky', action: 'Cancelled subscription', amount: 0, date: '2023-10-20' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{item.creator.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{item.creator}</p>
                            <p className="text-sm text-gray-500">{item.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {item.amount > 0 ? `$${item.amount.toFixed(2)}` : 'Free'}
                          </p>
                          <p className="text-sm text-gray-500">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
