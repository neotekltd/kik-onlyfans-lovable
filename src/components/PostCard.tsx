
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, Lock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: {
    id: string;
    title?: string;
    description?: string;
    content_type: string;
    is_premium: boolean;
    is_ppv: boolean;
    ppv_price?: number;
    media_urls?: string[];
    thumbnail_url?: string;
    like_count: number;
    comment_count: number;
    view_count: number;
    created_at: string;
    creator_id: string;
    profiles?: {
      username: string;
      display_name: string;
      avatar_url?: string;
      is_verified: boolean;
    };
  };
  isOwner?: boolean;
  hasAccess?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isOwner = false, hasAccess = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.like_count);
  const [loading, setLoading] = useState(false);

  const canViewContent = isOwner || hasAccess || (!post.is_premium && !post.is_ppv);

  const handleLike = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        setLikes(prev => prev - 1);
        setLiked(false);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
          });
        
        setLikes(prev => prev + 1);
        setLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !post.ppv_price) return;
    
    toast({
      title: "Feature coming soon",
      description: "Pay-per-view purchases will be available soon!",
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.display_name} />
            <AvatarFallback>
              {post.profiles?.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{post.profiles?.display_name}</h4>
              {post.profiles?.is_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              @{post.profiles?.username} • {formatDistanceToNow(new Date(post.created_at))} ago
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {post.title && (
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        )}
        
        {post.description && (
          <p className="text-gray-700 mb-3">{post.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">{post.content_type}</Badge>
          {post.is_premium && <Badge className="bg-yellow-500">Premium</Badge>}
          {post.is_ppv && (
            <Badge className="bg-purple-500">
              PPV ${(post.ppv_price! / 100).toFixed(2)}
            </Badge>
          )}
        </div>

        {/* Content Preview */}
        <div className="relative mb-4">
          {canViewContent ? (
            <div className="space-y-2">
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.media_urls.slice(0, 4).map((url, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Content ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center relative">
              <div className="text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">
                  {post.is_ppv ? 'Pay-per-view content' : 'Premium content'}
                </p>
                <p className="text-sm text-gray-400">
                  {post.is_ppv 
                    ? `Purchase for $${(post.ppv_price! / 100).toFixed(2)}`
                    : 'Subscribe to view'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={loading || !user}
              className={liked ? 'text-red-500' : ''}
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              {likes}
            </Button>
            
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.comment_count}
            </Button>
            
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            
            <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
              <Eye className="h-4 w-4" />
              {post.view_count}
            </div>
          </div>

          {!canViewContent && post.is_ppv && (
            <Button size="sm" onClick={handlePurchase} className="gradient-bg">
              Purchase ${(post.ppv_price! / 100).toFixed(2)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
