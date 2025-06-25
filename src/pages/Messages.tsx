
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  Camera,
  Heart,
  DollarSign,
  Image as ImageIcon,
  Play,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content?: string;
  message_type: string;
  media_url?: string;
  is_ppv: boolean;
  ppv_price?: number;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  user: ConversationUser;
  lastMessage?: Message;
  unreadCount: number;
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        // Get all unique conversation partners
        const { data: messageData } = await supabase
          .from('messages')
          .select(`
            sender_id,
            recipient_id,
            content,
            message_type,
            media_url,
            is_ppv,
            ppv_price,
            created_at,
            is_read
          `)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!messageData) return;

        // Group messages by conversation partner
        const conversationMap = new Map<string, Message[]>();
        
        messageData.forEach(msg => {
          const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, []);
          }
          conversationMap.get(partnerId)!.push(msg as Message);
        });

        // Get profile data for conversation partners
        const partnerIds = Array.from(conversationMap.keys());
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .in('id', partnerIds);

        // Build conversations array
        const conversationsArray: Conversation[] = [];
        
        conversationMap.forEach((msgs, partnerId) => {
          const profile = profilesData?.find(p => p.id === partnerId);
          if (!profile) return;

          const lastMessage = msgs[0]; // Most recent message
          const unreadCount = msgs.filter(msg => 
            msg.recipient_id === user.id && !msg.is_read
          ).length;

          conversationsArray.push({
            user: {
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url || undefined,
              is_verified: profile.is_verified
            },
            lastMessage,
            unreadCount
          });
        });

        // Sort by most recent activity
        conversationsArray.sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
          return bTime - aTime;
        });

        setConversations(conversationsArray);
        
        // Auto-select first conversation if available
        if (conversationsArray.length > 0 && !selectedChat) {
          setSelectedChat(conversationsArray[0].user.id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !selectedChat) return;

      try {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        setMessages(messagesData as Message[] || []);

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', selectedChat)
          .eq('recipient_id', user.id)
          .eq('is_read', false);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [user, selectedChat]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !selectedChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedChat,
          content: messageText.trim(),
          message_type: 'text',
          is_ppv: false
        });

      if (error) throw error;

      setMessageText('');
      
      // Refresh messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      setMessages(messagesData as Message[] || []);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const selectedConversation = conversations.find(c => c.user.id === selectedChat);
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">MESSAGES</h2>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <Button variant="secondary" size="sm" className="flex-1 bg-white shadow-sm">
                All
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 relative">
                Unread
                {totalUnread > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-brand-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {totalUnread}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Conversations</h3>
                <p>Start messaging creators to see conversations here</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.user.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat === conversation.user.id ? 'bg-brand-50 border-brand-200' : ''
                  }`}
                  onClick={() => setSelectedChat(conversation.user.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.user.avatar_url} />
                        <AvatarFallback>{conversation.user.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {conversation.user.display_name}
                          </h4>
                          {conversation.user.is_verified && (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessage.created_at))} ago
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage?.media_url && (
                            <Camera className="h-3 w-3 text-gray-400" />
                          )}
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage?.content || 
                             (conversation.lastMessage?.media_url ? 'Media message' : 'No messages yet')}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-brand-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.user.avatar_url} />
                      <AvatarFallback>{selectedConversation.user.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedConversation.user.display_name}</h3>
                      <p className="text-sm text-gray-500">@{selectedConversation.user.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          {message.message_type === 'text' ? (
                            <div className={`rounded-lg px-4 py-2 ${
                              isOwnMessage 
                                ? 'bg-brand-500 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ) : message.message_type === 'media' && message.media_url ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="relative">
                                <img 
                                  src={message.media_url} 
                                  alt="Media message" 
                                  className={`w-full h-48 object-cover ${message.is_ppv ? 'blur-lg' : ''}`}
                                />
                                {message.is_ppv && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="text-center text-white">
                                      <Play className="h-8 w-8 mx-auto mb-2" />
                                      <p className="text-sm font-medium">Unlock for ${(message.ppv_price || 0) / 100}</p>
                                      <Button size="sm" className="mt-2 gradient-creator">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Unlock
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {formatDistanceToNow(new Date(message.created_at))} ago
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    className="gradient-bg"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
                <p>Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
