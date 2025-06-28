
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Lock, 
  Unlock, 
  Image, 
  Video, 
  Music,
  FileText,
  DollarSign
} from 'lucide-react';

interface PPVMessageCardProps {
  message: {
    id: string;
    sender: {
      username: string;
      display_name: string;
      avatar_url?: string;
      is_verified: boolean;
    };
    content?: string;
    media_url?: string;
    message_type: 'text' | 'image' | 'video' | 'audio';
    is_ppv: boolean;
    ppv_price?: number;
    created_at: string;
    is_purchased?: boolean;
  };
  onPurchase?: (messageId: string) => void;
}

const PPVMessageCard: React.FC<PPVMessageCardProps> = ({ message, onPurchase }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);

  const getMediaIcon = () => {
    switch (message.message_type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handlePurchase = async () => {
    if (onPurchase) {
      setIsUnlocking(true);
      try {
        await onPurchase(message.id);
      } finally {
        setIsUnlocking(false);
      }
    }
  };

  const isLocked = message.is_ppv && !message.is_purchased;

  return (
    <Card className={`${isLocked ? 'border-2 border-dashed border-purple-300 bg-purple-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender.avatar_url} />
            <AvatarFallback>{message.sender.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-gray-900">{message.sender.display_name}</span>
              <span className="text-sm text-gray-500">@{message.sender.username}</span>
              {message.sender.is_verified && (
                <Badge variant="secondary" className="text-xs">✓ Verified</Badge>
              )}
              <span className="text-xs text-gray-400">
                {new Date(message.created_at).toLocaleDateString()}
              </span>
            </div>

            {isLocked ? (
              <div className="text-center py-8 space-y-4">
                <Lock className="h-12 w-12 text-purple-400 mx-auto" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Premium Content</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Unlock this exclusive {message.message_type} message
                  </p>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {getMediaIcon()}
                    <span className="text-sm font-medium text-purple-600">
                      Premium {message.message_type}
                    </span>
                  </div>
                  <Button 
                    onClick={handlePurchase}
                    disabled={isUnlocking}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    {isUnlocking ? 'Unlocking...' : `Unlock for $${(message.ppv_price! / 100).toFixed(2)}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {message.content && (
                  <p className="text-gray-800">{message.content}</p>
                )}
                
                {message.media_url && (
                  <div className="rounded-lg overflow-hidden">
                    {message.message_type === 'image' && (
                      <img 
                        src={message.media_url} 
                        alt="Message content"
                        className="w-full max-w-md rounded-lg"
                      />
                    )}
                    {message.message_type === 'video' && (
                      <video 
                        src={message.media_url} 
                        controls
                        className="w-full max-w-md rounded-lg"
                      />
                    )}
                    {message.message_type === 'audio' && (
                      <audio 
                        src={message.media_url} 
                        controls
                        className="w-full max-w-md"
                      />
                    )}
                  </div>
                )}

                {message.is_ppv && message.is_purchased && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Unlock className="h-4 w-4" />
                    <span className="text-sm font-medium">Unlocked</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PPVMessageCard;
