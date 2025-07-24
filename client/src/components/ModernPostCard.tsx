import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye, 
  Lock,
  Play,
  Image as ImageIcon,
  MoreHorizontal,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModernPostCardProps {
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
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onPurchase?: (postId: string) => void;
}

const ModernPostCard: React.FC<ModernPostCardProps> = ({
  post,
  isOwner = false,
  hasAccess = true,
  onLike,
  onShare,
  onBookmark,
  onPurchase,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(post.id);
  };

  const getContentIcon = () => {
    switch (post.content_type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const shouldBlurContent = post.is_ppv && !hasAccess && !isOwner;

  return (
    <Card className="overflow-hidden hover-scale bg-card border-border/50 shadow-lg">
      {/* Creator Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.display_name} />
            <AvatarFallback className="bg-gradient-primary text-white">
              {post.profiles?.display_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">{post.profiles?.display_name}</h3>
              {post.profiles?.is_verified && (
                <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>@{post.profiles?.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {post.is_premium && (
            <Badge variant="secondary" className="bg-gradient-purple text-white">
              Premium
            </Badge>
          )}
          {post.is_ppv && (
            <Badge variant="secondary" className="bg-gradient-pink text-white">
              ${post.ppv_price}
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem>Hide</DropdownMenuItem>
              {isOwner && (
                <>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-0">
        {/* Title and Description */}
        {(post.title || post.description) && (
          <div className="px-4 pb-3">
            {post.title && (
              <h4 className="font-semibold text-lg mb-2">{post.title}</h4>
            )}
            {post.description && (
              <div className="text-muted-foreground">
                <p className={showFullDescription ? '' : 'line-clamp-3'}>
                  {post.description}
                </p>
                {post.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-primary hover:underline mt-1 text-sm"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Media Content */}
        {post.thumbnail_url && (
          <div className="relative">
            <div className={`relative ${shouldBlurContent ? 'blur-md' : ''}`}>
              <img
                src={post.thumbnail_url}
                alt={post.title || 'Post content'}
                className="w-full h-64 object-cover"
              />
              {post.content_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            {shouldBlurContent && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Lock className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold mb-2">Unlock for ${post.ppv_price}</p>
                  <Button 
                    onClick={() => onPurchase?.(post.id)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Purchase
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                <span>{post.like_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-muted-foreground"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.comment_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-muted-foreground"
              >
                <Eye className="w-4 h-4" />
                <span>{post.view_count}</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={`${isBookmarked ? 'text-blue-500' : 'text-muted-foreground'}`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-500' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(post.id)}
                className="text-muted-foreground"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernPostCard;