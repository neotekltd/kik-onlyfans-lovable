
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealUserActivity } from '@/components/RealDataLoader';
import MainLayout from '@/layouts/MainLayout';
import PostCard from '@/components/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar, 
  Globe, 
  Instagram, 
  Twitter,
  Heart,
  MessageCircle,
  Users,
  DollarSign,
  Star,
  Settings,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  website_url?: string;
  instagram_handle?: string;
  twitter_handle?: string;
  is_verified: boolean;
  is_creator: boolean;
  created_at: string;
  creator_profiles?: {
    total_subscribers: number;
    total_posts: number;
    total_earnings: number;
    subscription_price: number;
    content_categories?: string[];
  };
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
  is_published: boolean;
  creator_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const targetUserId = userId || user?.id;
  const isOwnProfile = targetUserId === user?.id;
  const { activity } = useRealUserActivity(targetUserId);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;

      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            *,
            creator_profiles (
              total_subscribers,
              total_posts,
              total_earnings,
              subscription_price,
              content_categories
            )
          `)
          .eq('id', targetUserId)
          .single();

        if (profileData) {
          // Transform the data to match our interface
          const transformedProfile: UserProfile = {
            ...profileData,
            bio: profileData.bio ?? undefined,
            avatar_url: profileData.avatar_url ?? undefined,
            cover_url: profileData.cover_url ?? undefined,
            location: profileData.location ?? undefined,
            website_url: profileData.website_url ?? undefined,
            twitter_handle: profileData.twitter_handle ?? undefined,
            instagram_handle: profileData.instagram_handle ?? undefined,
            creator_profiles: Array.isArray(profileData.creator_profiles) ? profileData.creator_profiles[0] : profileData.creator_profiles || undefined
          };
          setProfile(transformedProfile);
        }

        // Fetch user's posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              username,
              display_name,
              avatar_url,
              is_verified
            )
          `)
          .eq('creator_id', targetUserId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        setPosts(postsData as Post[] || []);

        // Check if current user follows this profile
        if (user && targetUserId !== user.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .single();

          setIsFollowing(!!followData);
        }

        // Get followers and following counts
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', targetUserId);

        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', targetUserId);

        setFollowersCount(followersCount || 0);
        setFollowingCount(followingCount || 0);

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId, user]);

  const handleFollow = async () => {
    if (!user || !targetUserId || targetUserId === user.id) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600">The requested profile could not be found.</p>
        </div>
      </MainLayout>
    );
  }

  const creatorProfile = profile.creator_profiles;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cover Photo */}
        <div className="relative h-64 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-t-lg overflow-hidden">
          {profile.cover_url && (
            <img 
              src={profile.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-24 w-24 border-4 border-white -mt-12">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">{profile.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="pt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
                  {profile.is_verified && (
                    <Badge className="bg-blue-500">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {profile.is_creator && (
                    <Badge className="bg-purple-500">Creator</Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-2">@{profile.username}</p>
                {profile.bio && <p className="text-gray-700 mb-3">{profile.bio}</p>}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {formatDistanceToNow(new Date(profile.created_at))} ago
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    onClick={handleFollow}
                    className={isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'gradient-bg'}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              <p className="text-sm text-gray-600">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
              <p className="text-sm text-gray-600">Following</p>
            </div>
            {creatorProfile && (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{creatorProfile.total_subscribers}</p>
                <p className="text-sm text-gray-600">Subscribers</p>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(profile.website_url || profile.instagram_handle || profile.twitter_handle) && (
            <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
              {profile.website_url && (
                <a 
                  href={profile.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Website
                </a>
              )}
              {profile.instagram_handle && (
                <a 
                  href={`https://instagram.com/${profile.instagram_handle}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-pink-600 hover:text-pink-800"
                >
                  <Instagram className="h-4 w-4 mr-1" />
                  Instagram
                </a>
              )}
              {profile.twitter_handle && (
                <a 
                  href={`https://twitter.com/${profile.twitter_handle}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-400 hover:text-blue-600"
                >
                  <Twitter className="h-4 w-4 mr-1" />
                  Twitter
                </a>
              )}
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">
                      {isOwnProfile ? 'Share your first post to get started!' : 'This user hasn\'t posted anything yet.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              {activity ? (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Spent</span>
                          <span className="font-semibold">${(activity.totalSpent / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Active Subscriptions</span>
                          <span className="font-semibold">{activity.activeSubscriptions?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Recent Likes</span>
                          <span className="font-semibold">{activity.recentLikes?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Recent Comments</span>
                          <span className="font-semibold">{activity.recentComments?.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity data</h3>
                    <p className="text-gray-500">Activity information is not available.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About {profile.display_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.bio && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                        <p className="text-gray-700">{profile.bio}</p>
                      </div>
                    )}
                    
                    {creatorProfile?.content_categories && creatorProfile.content_categories.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Content Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {creatorProfile.content_categories.map((category, index) => (
                            <Badge key={index} variant="secondary">{category}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Joined</h4>
                      <p className="text-gray-700">{new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
