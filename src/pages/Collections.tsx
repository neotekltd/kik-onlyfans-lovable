
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import PostCard from '@/components/PostCard';

const Collections: React.FC = () => {
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('post_likes')
          .select(`
            post_id,
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

        const posts = data?.map(like => like.posts).filter(Boolean) || [];
        setLikedPosts(posts);
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [user]);

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
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600 mt-2">Your saved and liked content</p>
        </div>

        {/* Collections Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liked Posts</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{likedPosts.length}</div>
              <p className="text-xs text-muted-foreground">Posts you've liked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Saved for later</p>
            </CardContent>
          </Card>
        </div>

        {/* Liked Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Liked Posts</CardTitle>
            <CardDescription>Content you've shown love to</CardDescription>
          </CardHeader>
          <CardContent>
            {likedPosts.length > 0 ? (
              <div className="space-y-6">
                {likedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No liked posts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start exploring and liking content to build your collection!
                </p>
                <div className="mt-6">
                  <Button>
                    Discover Content
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Collections;
