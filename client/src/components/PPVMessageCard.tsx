
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Unlock, Image as ImageIcon, Play, File, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface PPVMessageCardProps {
  message: {
    id: string;
    sender_id: string;
    content?: string;
    message_type: string;
    media_url?: string;
    is_ppv: boolean;
    ppv_price?: number;
    created_at: string;
  };
  senderName: string;
  senderAvatar?: string;
  isOwn?: boolean;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

const PPVMessageCard: React.FC<PPVMessageCardProps> = ({
  message,
  senderName,
  senderAvatar,
  isOwn = false,
  isUnlocked = false,
  onUnlock
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(isUnlocked);

  const handleUnlock = async () => {
    if (!user || !message.ppv_price) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, this would integrate with Stripe or another payment processor
      // For now, we'll simulate a successful payment and record the purchase
      
      const { error } = await supabase
        .from('ppv_purchases')
        .insert({
          buyer_id: user.id,
          seller_id: message.sender_id,
          message_id: message.id,
          amount: message.ppv_price,
        });
        
      if (error) throw error;
      
      setUnlocked(true);
      toast({
        title: "Content unlocked!",
        description: `You've successfully unlocked this content for $${(message.ppv_price / 100).toFixed(2)}`,
      });
      
      onUnlock?.();
    } catch (error) {
      console.error('Error unlocking content:', error);
      toast({
        title: "Failed to unlock content",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = () => {
    switch (message.message_type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Play className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getMediaTypeLabel = () => {
    switch (message.message_type) {
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
      default:
        return 'File';
    }
  };

  return (
    <Card className={`overflow-hidden ${isOwn ? 'ml-auto' : 'mr-auto'} max-w-[80%] shadow-sm`}>
      <CardContent className="p-3">
        {/* Message header with sender info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{isOwn ? 'You' : senderName}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
          </div>
          {message.is_ppv && !isOwn && (
            <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
              <DollarSign className="h-3 w-3" />
              <span>${(message.ppv_price! / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {/* Message content */}
        {message.content && (
          <p className="text-sm mb-3">{message.content}</p>
        )}
        
        {/* Media content */}
        {message.media_url && (
          <div className="relative rounded-md overflow-hidden bg-black/5">
            {(unlocked || isOwn) ? (
              // Unlocked content
              message.message_type === 'image' ? (
                <img 
                  src={message.media_url} 
                  alt="Message content" 
                  className="w-full h-auto max-h-80 object-contain"
                />
              ) : message.message_type === 'video' ? (
                <video 
                  src={message.media_url} 
                  controls 
                  className="w-full h-auto max-h-80"
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <File className="h-10 w-10 text-muted-foreground" />
                </div>
              )
            ) : (
              // Locked content
              <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-6">
                <div className="bg-white/90 rounded-full p-3 mb-3">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {getMediaIcon()}
                  <span className="font-medium">{getMediaTypeLabel()}</span>
                </div>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  This content is locked. Pay to unlock.
                </p>
                <Button
                  onClick={handleUnlock}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Unlock for ${(message.ppv_price! / 100).toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PPVMessageCard;
