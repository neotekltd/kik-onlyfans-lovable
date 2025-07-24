
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreatorCardProps {
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    is_verified: boolean;
    subscriber_count?: number;
    subscription_price?: number;
    categories?: string[];
  };
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/${creator.id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewProfile}>
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-creator-50 relative">
        <Avatar className="absolute bottom-4 left-4 h-16 w-16 border-4 border-white">
          <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
          <AvatarFallback className="text-lg font-semibold">
            {creator.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {creator.is_verified && (
          <Badge className="absolute top-4 right-4 bg-blue-500">
            <Star className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">{creator.display_name}</h3>
          <span className="text-sm text-gray-500">@{creator.username}</span>
        </div>
        
        {creator.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{creator.bio}</p>
        )}
        
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            {creator.subscriber_count || 0}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Heart className="h-4 w-4" />
            Free to follow
          </div>
        </div>
        
        {creator.categories && creator.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {creator.categories.slice(0, 3).map((category, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {creator.categories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{creator.categories.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {creator.subscription_price && (
            <span className="font-semibold text-brand-600">
              ${(creator.subscription_price / 100).toFixed(2)}/month
            </span>
          )}
          <Button size="sm" className="gradient-bg">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorCard;
