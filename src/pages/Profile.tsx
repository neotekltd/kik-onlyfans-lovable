
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Heart, MessageCircle, Star, Users, Edit, Settings } from 'lucide-react';

const Profile = () => {
  const { user, profile, creatorProfile } = useAuth();

  const profileStats = [
    { label: 'Posts', value: creatorProfile?.total_posts?.toString() || '0' },
    { label: 'Subscribers', value: creatorProfile?.total_subscribers?.toString() || '0' },
    { label: 'Likes', value: '12.5K' },
    { label: 'Following', value: '89' }
  ];

  const posts = Array(12).fill(null).map((_, index) => ({
    id: index.toString(),
    thumbnail: '/placeholder.svg',
    type: index % 3 === 0 ? 'video' : 'image',
    likes: Math.floor(Math.random() * 500) + 50,
    isLocked: index % 4 === 0,
    price: index % 4 === 0 ? 9.99 + (index * 2) : null
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-brand-500 to-creator-500"></div>
            <CardContent className="relative pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl">{profile?.display_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 sm:mt-16">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <span>{profile?.display_name}</span>
                        {profile?.is_creator && (
                          <Badge className="bg-creator-500">Creator</Badge>
                        )}
                      </h1>
                      <p className="text-gray-600">@{profile?.username}</p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mt-2">
                    {profile?.is_creator 
                      ? "Premium content creator sharing exclusive photos and videos. Subscribe for daily updates! 💕" 
                      : "Enjoying amazing content from my favorite creators! ❤️"
                    }
                  </p>
                  
                  {/* Stats */}
                  <div className="flex space-x-6 mt-4">
                    {profileStats.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                  <div key={post.id} className="relative group aspect-square">
                    <div className="w-full h-full bg-gray-200 rounded-lg overflow-hidden cursor-pointer">
                      <img 
                        src={post.thumbnail} 
                        alt="Post" 
                        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                          post.isLocked ? 'blur-sm' : ''
                        }`}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span className="text-sm">{post.likes}</span>
                            </div>
                            {post.type === 'video' && (
                              <div className="flex items-center space-x-1">
                                <Camera className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Lock indicator */}
                      {post.isLocked && (
                        <div className="absolute top-2 right-2 bg-creator-500 text-white text-xs px-2 py-1 rounded-full">
                          ${post.price}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-700">
                      {profile?.bio || (profile?.is_creator 
                        ? "Professional content creator passionate about photography and connecting with fans. I love creating unique and exclusive content that tells a story. Subscribe to get access to my premium photos, videos, and behind-the-scenes content!"
                        : "Content enthusiast who loves discovering amazing creators and supporting their work. Always looking for new and exciting content!"
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Joined</h4>
                    <p className="text-gray-700">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'December 2023'}
                    </p>
                  </div>
                  
                  {profile?.is_creator && creatorProfile && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Subscription Price</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">Monthly Access</span>
                          <Badge variant="outline">${(creatorProfile.subscription_price / 100).toFixed(2)}/month</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Reviews & Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile?.is_creator ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold">4.8</div>
                        <div>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">Based on 127 reviews</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { name: "Sarah M.", rating: 5, comment: "Amazing content and great interaction!" },
                          { name: "Mike R.", rating: 5, comment: "Love the exclusive photos. Worth every penny!" },
                          { name: "Jessica L.", rating: 4, comment: "Creative and high quality content." }
                        ].map((review, index) => (
                          <div key={index} className="border-b pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{review.name}</span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${
                                      star <= review.rating 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Reviews are only available for creators</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Posted new content", time: "2 hours ago", icon: Camera },
                      { action: "Received 45 new likes", time: "4 hours ago", icon: Heart },
                      { action: "New subscriber joined", time: "6 hours ago", icon: Users },
                      { action: "Sent 12 messages", time: "1 day ago", icon: MessageCircle }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-white rounded-full">
                          <activity.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
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

export default Profile;
