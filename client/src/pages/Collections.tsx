
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealUserActivity } from '@/components/RealDataLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Bookmark, DollarSign, Calendar } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import PostCard from '@/components/PostCard';
import { formatDistanceToNow } from 'date-fns';

const Collections: React.FC = () => {
  const { user } = useAuth();
  const { activity: userActivity } = useRealUserActivity();
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [purchasedContent, setPurchasedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalSpent: 0,
    totalPurchases: 0,
    favoriteCreator: null as any
  });

  useEffect(() => {
    const fetchRealCollections = async () => {
      if (!user) return;

      try {
        // Get actual liked posts with full details
        const { data: likesData } = await supabase
          .from('post_likes')
          .select(`
            post_id,
            created_at,
            posts (
              *,
              profiles (
                username,
                display_name,
                avatar_url,
                is_verified
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const actualLikedPosts = likesData?.map(like => ({
          ...like.posts,
          liked_at: like.created_at
        })).filter(Boolean) || [];

        setLikedPosts(actualLikedPosts);

        // Get real PPV purchases
        const { data: purchasesData } = await supabase
          .from('ppv_purchases')
          .select(`
            *,
            posts (
              *,
              profiles (
                username,
                display_name,
                avatar_url,
                is_verified
              )
            )
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        setPurchasedContent(purchasesData || []);

        // Calculate real statistics
        const totalSpentPPV = purchasesData?.reduce((sum, purchase) => sum + purchase.amount, 0) || 0;
        const totalSpentSubscriptions = userActivity?.totalSpent || 0;
        const totalSpent = totalSpentPPV + totalSpentSubscriptions;

        // Find favorite creator (most interactions)
        const creatorInteractions = {} as Record<string, number>;
        
        actualLikedPosts.forEach(post => {
          if (post.creator_id) {
            creatorInteractions[post.creator_id] = (creatorInteractions[post.creator_id] || 0) + 1;
          }
        });

        purchasesData?.forEach(purchase => {
          if (purchase.seller_id) {
            creatorInteractions[purchase.seller_id] = (creatorInteractions[purchase.seller_id] || 0) + 2; // Weight purchases more
          }
        });

        let favoriteCreator = null;
        if (Object.keys(creatorInteractions).length > 0) {
          const topCreatorId = Object.entries(creatorInteractions)
            .sort(([,a], [,b]) => b - a)[0][0];
          
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', topCreatorId)
            .single();
          
          favoriteCreator = creatorData;
        }

        setStats({
          totalLikes: actualLikedPosts.length,
          totalSpent,
          totalPurchases: purchasesData?.length || 0,
          favoriteCreator
        });

      } catch (error) {
        console.error('Error fetching real collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealCollections();
  }, [user, userActivity]);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Collections</h1>
          <p className="text-gray-600 mt-2">
            {stats.totalLikes > 0 || stats.totalPurchases > 0 
              ? `${stats.totalLikes} liked posts, ${stats.totalPurchases} purchases, $${(stats.totalSpent / 100).toFixed(2)} total spent`
              : 'Your saved and liked content will appear here'
            }
          </p>
        </div>

        {/* Real Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liked Posts</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalLikes > 0 ? `Latest: ${formatDistanceToNow(new Date(likedPosts[0]?.liked_at))} ago` : 'No likes yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchases</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPurchases}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPurchases > 0 ? `PPV content purchased` : 'No purchases yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalSpent / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Subscriptions & purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Creator</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {stats.favoriteCreator ? stats.favoriteCreator.display_name : 'None yet'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.favoriteCreator ? `@${stats.favoriteCreator.username}` : 'Start exploring'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real Liked Posts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Liked Posts</CardTitle>
            <CardDescription>
              {stats.totalLikes > 0 
                ? `${stats.totalLikes} posts you've liked, showing recent activity`
                : 'Posts you like will appear here'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {likedPosts.length > 0 ? (
              <div className="space-y-6">
                {likedPosts.slice(0, 10).map((post) => (
                  <div key={post.id} className="relative">
                    <PostCard post={post} />
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Liked {formatDistanceToNow(new Date(post.liked_at))} ago
                    </Badge>
                  </div>
                ))}
                {likedPosts.length > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      Load More ({likedPosts.length - 10} more)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No liked posts yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start exploring and liking content to build your collection!
                </p>
                <div className="mt-6">
                  <Button onClick={() => window.location.href = '/dashboard'}>
                    Discover Content
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real Purchased Content */}
        {stats.totalPurchases > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Purchased Content</CardTitle>
              <CardDescription>
                ${(purchasedContent.reduce((sum, p) => sum + p.amount, 0) / 100).toFixed(2)} spent on {stats.totalPurchases} purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchasedContent.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{purchase.posts?.title || 'PPV Content'}</p>
                        <p className="text-sm text-gray-500">
                          From @{purchase.posts?.profiles?.username} • {formatDistanceToNow(new Date(purchase.created_at))} ago
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      ${(purchase.amount / 100).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Collections;
