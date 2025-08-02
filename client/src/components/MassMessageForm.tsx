import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Users, 
  DollarSign, 
  Image, 
  Video, 
  Upload,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MessageType = Database['public']['Enums']['message_type'];

interface Subscriber {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  subscription_status: string;
  subscription_start_date: string;
}

const MassMessageForm: React.FC = () => {
  const { user, profile } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isPPV, setIsPPV] = useState(false);
  const [ppvPrice, setPpvPrice] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user && profile?.is_creator) {
      fetchSubscribers();
    }
  }, [user, profile]);

  const fetchSubscribers = async () => {
    if (!user?.id) return;
    
    try {
      // First get subscription data
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('subscriber_id, status, start_date')
        .eq('creator_id', user.id)
        .eq('status', 'active');
        
      if (subsError) throw subsError;
      
      if (!subscriptions?.length) {
        setSubscribers([]);
        return;
      }

      // Then get profile data for those subscribers
      const subscriberIds = subscriptions.map(sub => sub.subscriber_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', subscriberIds);
        
      if (profilesError) throw profilesError;
      
      // Combine the data
      const subscribersData: Subscriber[] = subscriptions.map(sub => {
        const profile = profiles?.find(p => p.id === sub.subscriber_id);
        return {
          id: sub.subscriber_id,
          username: profile?.username || '',
          display_name: profile?.display_name || '',
          avatar_url: profile?.avatar_url || undefined,
          subscription_status: sub.status,
          subscription_start_date: sub.start_date
        };
      });
      
      setSubscribers(subscribersData);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast({
        title: "Failed to load subscribers",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user?.id) return null;

    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload media file",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    
    if (file.type.startsWith('image/')) {
      setMessageType('media');
    } else if (file.type.startsWith('video/')) {
      setMessageType('media');
    } else {
      setMessageType('media');
    }

    const uploadedUrl = await handleFileUpload(file);
    if (uploadedUrl) {
      setMediaUrl(uploadedUrl);
    }
  };

  const toggleSubscriberSelection = (subscriberId: string) => {
    setSelectedSubscribers(prev => 
      prev.includes(subscriberId)
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  const selectAllSubscribers = () => {
    setSelectedSubscribers(subscribers.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedSubscribers([]);
  };

  const sendMassMessage = async () => {
    if (!user?.id) return;
    
    if (selectedSubscribers.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one subscriber",
        variant: "destructive",
      });
      return;
    }

    if (!messageContent.trim() && !mediaUrl) {
      toast({
        title: "Empty message",
        description: "Please enter a message or upload media",
        variant: "destructive",
      });
      return;
    }

    if (isPPV && ppvPrice <= 0) {
      toast({
        title: "Invalid PPV price",
        description: "PPV price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Create message objects for each subscriber
      const messages = selectedSubscribers.map(subscriberId => ({
        sender_id: user.id,
        recipient_id: subscriberId,
        content: messageContent.trim() || null,
        message_type: messageType,
        media_url: mediaUrl || null,
        is_ppv: isPPV,
        ppv_price: isPPV ? Math.round(ppvPrice * 100) : null,
        is_read: false,
      }));
      
      // Insert all messages
      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messages);
      
      if (messagesError) throw messagesError;
      
      toast({
        title: "Messages sent!",
        description: `Successfully sent message to ${selectedSubscribers.length} subscribers`,
      });

      // Reset form
      setMessageContent('');
      setMediaFile(null);
      setMediaUrl('');
      setIsPPV(false);
      setPpvPrice(0);
      setSelectedSubscribers([]);
      setMessageType('text');
      
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "Failed to send messages",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!profile?.is_creator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Send className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Creator Account Required</h3>
          <p className="text-gray-600">You need a creator account to send mass messages.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Your Subscribers ({subscribers.length})
            </span>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={selectAllSubscribers}
                disabled={subscribers.length === 0}
              >
                Select All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearSelection}
                disabled={selectedSubscribers.length === 0}
              >
                Clear
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active subscribers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {subscribers.map((subscriber) => (
                <div 
                  key={subscriber.id}
                  className={`flex items-center space-x-3 p-3 border rounded cursor-pointer transition-colors ${
                    selectedSubscribers.includes(subscriber.id) 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSubscriberSelection(subscriber.id)}
                >
                  <Checkbox 
                    checked={selectedSubscribers.includes(subscriber.id)}
                    onChange={() => toggleSubscriberSelection(subscriber.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={subscriber.avatar_url} />
                    <AvatarFallback>{subscriber.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{subscriber.display_name}</p>
                    <p className="text-xs text-gray-500 truncate">@{subscriber.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedSubscribers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-700">
                {selectedSubscribers.length} subscriber{selectedSubscribers.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Mass Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Message Type</label>
            <Select value={messageType} onValueChange={(value: MessageType) => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Message</SelectItem>
                <SelectItem value="media">Media Message</SelectItem>
                <SelectItem value="ppv">Pay-Per-View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              placeholder="Enter your message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
            />
          </div>

          {/* Media Upload */}
          {(messageType === 'media' || messageType === 'ppv') && (
            <div>
              <label className="block text-sm font-medium mb-2">Media</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  disabled={isUploading}
                />
                {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
              </div>
              {mediaFile && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{mediaFile.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaUrl('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* PPV Settings */}
          {messageType === 'ppv' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={isPPV}
                  onCheckedChange={(checked) => setIsPPV(checked === true)}
                />
                <label className="text-sm font-medium">Enable Pay-Per-View</label>
              </div>
              
              {isPPV && (
                <div>
                  <label className="block text-sm font-medium mb-2">PPV Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ppvPrice}
                    onChange={(e) => setPpvPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={sendMassMessage}
            disabled={isSending || selectedSubscribers.length === 0 || isUploading}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : `Send to ${selectedSubscribers.length} Subscriber${selectedSubscribers.length !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MassMessageForm;