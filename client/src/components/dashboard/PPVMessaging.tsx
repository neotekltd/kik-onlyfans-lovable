import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Lock, 
  Unlock,
  DollarSign,
  Eye,
  EyeOff,
  Upload,
  Image,
  Video,
  Gift,
  Clock,
  Check,
  X
} from 'lucide-react';

interface PPVMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  media_url: string | null;
  message_type: 'text' | 'media' | 'ppv';
  is_ppv: boolean;
  ppv_price: number | null;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  recipient_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface PPVMessagingProps {
  recipientId?: string;
  isCreatorMode?: boolean;
}

const PPVMessaging: React.FC<PPVMessagingProps> = ({ 
  recipientId, 
  isCreatorMode = false 
}) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<PPVMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(recipientId || null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Message composition state
  const [messageContent, setMessageContent] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Mass messaging state
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [massMessageContent, setMassMessageContent] = useState('');
  const [massMessagePPV, setMassMessagePPV] = useState(false);
  const [massMessagePrice, setMassMessagePrice] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');

  useEffect(() => {
    if (user) {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
    }
  }, [user, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:sender_id(username, display_name, avatar_url),
          recipient_profile:recipient_id(username, display_name, avatar_url)
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map();
      data?.forEach(message => {
        const partnerId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
        const partnerProfile = message.sender_id === user?.id ? message.recipient_profile : message.sender_profile;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: partnerId,
            profile: partnerProfile,
            lastMessage: message,
            unreadCount: 0
          });
        }
        
        // Count unread messages
        if (message.recipient_id === user?.id && !message.is_read) {
          conversationMap.get(partnerId).unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:sender_id(username, display_name, avatar_url),
          recipient_profile:recipient_id(username, display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to match interface
      const transformedMessages = (data || []).map((msg: any) => ({
        ...msg,
        // Note: is_purchased is not in the database schema for messages
        // PPV purchases are tracked in ppv_purchases table
      }));
      setMessages(transformedMessages);

      // Mark messages as read
      if (data && data.length > 0 && user?.id) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('recipient_id', user.id)
          .eq('sender_id', conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `messages/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error('Failed to upload media');
    }
  };

  const sendMessage = async () => {
    if (!messageContent.trim() && !mediaFile) {
      toast.error('Please enter a message or select media');
      return;
    }

    if (!selectedConversation) {
      toast.error('Please select a conversation');
      return;
    }

    if (isPPV && (!ppvPrice || parseFloat(ppvPrice) <= 0)) {
      toast.error('Please enter a valid PPV price');
      return;
    }

    setSending(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 
                   mediaFile.type.startsWith('video/') ? 'video' : 'audio';
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          content: messageContent,
          media_url: mediaUrl,
          message_type: mediaType ? (mediaType as 'text' | 'media' | 'ppv') : 'text',
          is_ppv: isPPV,
          ppv_price: isPPV ? parseFloat(ppvPrice) * 100 : null, // Store in cents
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      await fetchMessages(selectedConversation);
      
      // Clear form
      setMessageContent('');
      setIsPPV(false);
      setPpvPrice('');
      setMediaFile(null);
      setMediaPreview(null);

      toast.success(isPPV ? 'PPV message sent!' : 'Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendMassMessage = async () => {
    if (!massMessageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (massMessagePPV && (!massMessagePrice || parseFloat(massMessagePrice) <= 0)) {
      toast.error('Please enter a valid PPV price');
      return;
    }

    setSending(true);
    try {
      // Get target audience
      let targetUserIds: string[] = [];
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (targetAudience === 'all') {
        const { data: subscribers } = await supabase
          .from('user_subscriptions')
          .select('subscriber_id')
          .eq('creator_id', user.id)
          .eq('status', 'active');
        
        targetUserIds = subscribers?.map(sub => sub.subscriber_id) || [];
      } else if (targetAudience === 'new') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: subscribers } = await supabase
          .from('user_subscriptions')
          .select('subscriber_id')
          .eq('creator_id', user.id)
          .eq('status', 'active')
          .gte('created_at', thirtyDaysAgo.toISOString());
        
        targetUserIds = subscribers?.map(sub => sub.subscriber_id) || [];
      } else if (targetAudience === 'active') {
        // Get users who have interacted recently
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: activeUsers } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('recipient_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());
        
        targetUserIds = Array.from(new Set(activeUsers?.map(msg => msg.sender_id) || []));
      }

      // Send message to all targets
      const messages = targetUserIds.map(userId => ({
        sender_id: user.id,
        recipient_id: userId,
        content: massMessageContent,
        message_type: 'text' as const,
        is_ppv: massMessagePPV,
        ppv_price: massMessagePPV ? parseFloat(massMessagePrice) * 100 : null,
        is_read: false
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messages);

      if (error) throw error;

      toast.success(`Mass message sent to ${targetUserIds.length} subscribers!`);
      setShowMassMessage(false);
      setMassMessageContent('');
      setMassMessagePPV(false);
      setMassMessagePrice('');
    } catch (error) {
      console.error('Error sending mass message:', error);
      toast.error('Failed to send mass message');
    } finally {
      setSending(false);
    }
  };

  const purchasePPVMessage = async (messageId: string, price: number) => {
    try {
      // In a real app, this would integrate with Stripe or another payment processor
      // For now, we'll simulate the purchase by recording it in ppv_purchases table
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Record the PPV purchase
      const { error: purchaseError } = await supabase
        .from('ppv_purchases')
        .insert({
          buyer_id: user.id,
          seller_id: message.sender_id,
          item_id: messageId,
          item_type: 'message',
          amount: price
        });

      if (purchaseError) throw purchaseError;

      // Record the tip/purchase in the tips table
      await supabase
        .from('tips')
        .insert({
          tipper_id: user.id,
          creator_id: message.sender_id,
          amount: price,
          message: 'PPV message purchase'
        });

      toast.success('PPV message unlocked!');
      
      // Refresh messages to show updated state
      if (selectedConversation) {
        await fetchMessages(selectedConversation);
      }
    } catch (error) {
      console.error('Error purchasing PPV message:', error);
      toast.error('Failed to purchase PPV message');
    }
  };

  const renderMessage = (message: PPVMessage) => {
    const isOwn = message.sender_id === user?.id;
    // For PPV content, check if user has purchased it via ppv_purchases table
    // For now, we'll simulate this check - in real app you'd query ppv_purchases
    const canViewContent = !message.is_ppv || isOwn;

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'bg-[#00aff0]' : 'bg-[#2c2e36]'} rounded-lg p-3`}>
          {message.is_ppv && !isOwn && (
            <div className="flex items-center mb-2">
              <Lock className="h-4 w-4 mr-1" />
              <span className="text-xs font-semibold">PPV Message - ${message.ppv_price ? (message.ppv_price / 100).toFixed(2) : '0.00'}</span>
            </div>
          )}
          
          {canViewContent ? (
            <>
              {message.media_url && (
                <div className="mb-2">
                  {message.message_type === 'media' ? (
                    <img 
                      src={message.media_url} 
                      alt="Message media"
                      className="rounded-lg max-w-full h-auto"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Media file</div>
                  )}
                </div>
              )}
              
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
            </>
          ) : (
            <div className="text-center">
              <EyeOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-400 mb-2">Unlock this PPV message</p>
              <Button 
                size="sm" 
                onClick={() => purchasePPVMessage(message.id, message.ppv_price || 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                Unlock ${message.ppv_price ? (message.ppv_price / 100).toFixed(2) : '0.00'}
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-300">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
            {isOwn && message.is_ppv && (
              <Badge variant="secondary" className="text-xs">
                PPV Message
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[600px] bg-[#13151a] text-white rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-[#1e2029] border-r border-[#2c2e36]">
        <div className="p-4 border-b border-[#2c2e36]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Messages</h3>
            {isCreatorMode && (
              <Dialog open={showMassMessage} onOpenChange={setShowMassMessage}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#00aff0] hover:bg-[#0095cc]">
                    <Send className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white">
                  <DialogHeader>
                    <DialogTitle>Send Mass Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger className="bg-[#252836] border-[#2c2e36]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subscribers</SelectItem>
                        <SelectItem value="active">Active Subscribers</SelectItem>
                        <SelectItem value="new">New Subscribers</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Textarea
                      placeholder="Your message to subscribers..."
                      value={massMessageContent}
                      onChange={(e) => setMassMessageContent(e.target.value)}
                      className="bg-[#252836] border-[#2c2e36]"
                      rows={4}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={massMessagePPV}
                        onCheckedChange={setMassMessagePPV}
                      />
                      <Label>PPV Message</Label>
                    </div>
                    
                    {massMessagePPV && (
                      <Input
                        type="number"
                        placeholder="Price ($)"
                        value={massMessagePrice}
                        onChange={(e) => setMassMessagePrice(e.target.value)}
                        className="bg-[#252836] border-[#2c2e36]"
                      />
                    )}
                    
                    <Button 
                      onClick={sendMassMessage} 
                      disabled={sending}
                      className="w-full bg-[#00aff0] hover:bg-[#0095cc]"
                    >
                      {sending ? 'Sending...' : 'Send Mass Message'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 cursor-pointer hover:bg-[#252836] ${
                selectedConversation === conversation.id ? 'bg-[#252836]' : ''
              }`}
            >
              <div className="flex items-center">
                <img
                  src={conversation.profile?.avatar_url || '/placeholder.svg'}
                  alt={conversation.profile?.display_name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{conversation.profile?.display_name}</p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-[#00aff0] text-white">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {conversation.lastMessage?.content || 'Media message'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00aff0] mx-auto mb-2"></div>
                    <p className="text-gray-400">Loading messages...</p>
                  </div>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#2c2e36] bg-[#1e2029]">
              {mediaPreview && (
                <div className="mb-4 relative">
                  <img 
                    src={mediaPreview} 
                    alt="Preview"
                    className="max-h-32 rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  checked={isPPV}
                  onCheckedChange={setIsPPV}
                />
                <Label>PPV Message</Label>
                {isPPV && (
                  <Input
                    type="number"
                    placeholder="Price ($)"
                    value={ppvPrice}
                    onChange={(e) => setPpvPrice(e.target.value)}
                    className="w-24 bg-[#252836] border-[#2c2e36]"
                  />
                )}
              </div>
              
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="bg-[#252836] border-[#2c2e36] resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-[#2c2e36]"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                  <Button 
                    onClick={sendMessage}
                    disabled={sending || (!messageContent.trim() && !mediaFile)}
                    className="bg-[#00aff0] hover:bg-[#0095cc]"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PPVMessaging;