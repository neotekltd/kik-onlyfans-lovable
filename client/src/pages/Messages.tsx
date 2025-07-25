
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Video, 
  DollarSign, 
  Lock, 
  Star,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Plus
} from 'lucide-react';

interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
    is_creator: boolean;
  };
  last_message: {
    content: string;
    created_at: string;
    is_ppv: boolean;
    ppv_price?: number;
    sender_id: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio';
  media_url?: string;
  is_ppv: boolean;
  ppv_price?: number;
  is_read: boolean;
  created_at: string;
}

const Messages: React.FC = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [ppvMessage, setPPVMessage] = useState({
    content: '',
    price: 0,
    media_type: 'text' as 'text' | 'image' | 'video'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversationData = conversations.find(c => c.id === activeConversation);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - would fetch from API
      const mockConversations: Conversation[] = [
        {
          id: 'conv_1',
          participant: {
            id: 'user_1',
            username: 'sarah_model',
            display_name: 'Sarah ✨',
            avatar_url: '/placeholder.svg',
            is_verified: true,
            is_creator: true
          },
          last_message: {
            content: 'Hey! Check out my new photo set 📸',
            created_at: new Date().toISOString(),
            is_ppv: false,
            sender_id: 'user_1'
          },
          unread_count: 2
        },
        {
          id: 'conv_2',
          participant: {
            id: 'user_2',
            username: 'alex_creator',
            display_name: 'Alex',
            avatar_url: '/placeholder.svg',
            is_verified: false,
            is_creator: true
          },
          last_message: {
            content: 'Exclusive video just for you! 💕',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_ppv: true,
            ppv_price: 1500,
            sender_id: 'user_2'
          },
          unread_count: 0
        }
      ];
      
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setActiveConversation(mockConversations[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock messages - would fetch from API
      const mockMessages: Message[] = [
        {
          id: 'msg_1',
          sender_id: 'user_1',
          recipient_id: user?.id || '',
          content: 'Hey there! Welcome to my page 💕',
          message_type: 'text',
          is_ppv: false,
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'msg_2',
          sender_id: user?.id || '',
          recipient_id: 'user_1',
          content: 'Thanks! Love your content',
          message_type: 'text',
          is_ppv: false,
          is_read: true,
          created_at: new Date(Date.now() - 82800000).toISOString()
        },
        {
          id: 'msg_3',
          sender_id: 'user_1',
          recipient_id: user?.id || '',
          content: 'I have something special just for you! 😘',
          message_type: 'image',
          media_url: '/placeholder-content.jpg',
          is_ppv: true,
          ppv_price: 1000,
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg_4',
          sender_id: 'user_1',
          recipient_id: user?.id || '',
          content: 'Hey! Check out my new photo set 📸',
          message_type: 'text',
          is_ppv: false,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        sender_id: user.id,
        recipient_id: activeConversationData?.participant.id,
        content: newMessage,
        message_type: 'text' as const,
        is_ppv: false
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        toast.success('Message sent!');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const sendPPVMessage = async () => {
    if (!ppvMessage.content.trim() || !activeConversation || !user) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        sender_id: user.id,
        recipient_id: activeConversationData?.participant.id,
        content: ppvMessage.content,
        message_type: ppvMessage.media_type,
        is_ppv: true,
        ppv_price: ppvMessage.price * 100 // Convert to cents
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setPPVMessage({ content: '', price: 0, media_type: 'text' });
        setShowPPVModal(false);
        toast.success('PPV message sent!');
      } else {
        toast.error('Failed to send PPV message');
      }
    } catch (error) {
      console.error('Error sending PPV message:', error);
      toast.error('Failed to send PPV message');
    } finally {
      setSendingMessage(false);
    }
  };

  const purchasePPVMessage = async (messageId: string, price: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/messages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          buyer_id: user.id,
          amount: price
        })
      });

      if (response.ok) {
        // Update message to show as purchased
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, is_read: true }
              : msg
          )
        );
        toast.success('Content unlocked!');
      } else {
        toast.error('Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing PPV message:', error);
      toast.error('Purchase failed');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13151a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
          <p className="text-white">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13151a] text-white">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Conversations Sidebar */}
        <div className="w-1/3 bg-[#1e2029] border-r border-[#2c2e36] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#2c2e36]">
            <h1 className="text-xl font-bold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                className="pl-10 bg-[#252836] border-[#2c2e36] text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No conversations</h3>
                <p className="text-gray-400">Start a conversation with a creator!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-[#2c2e36] cursor-pointer hover:bg-[#252836] ${
                    activeConversation === conversation.id ? 'bg-[#252836]' : ''
                  }`}
                  onClick={() => setActiveConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img 
                          src={conversation.participant.avatar_url || '/placeholder.svg'} 
                          alt={conversation.participant.display_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {conversation.participant.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-[#00aff0] rounded-full p-1">
                          <Star className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {conversation.participant.display_name}
                          </span>
                          {conversation.participant.is_creator && (
                            <Badge variant="secondary" className="text-xs">Creator</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.last_message.is_ppv && (
                            <Lock className="w-3 h-3 inline mr-1" />
                          )}
                          {conversation.last_message.content}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-[#00aff0] text-white text-xs">
                            {conversation.unread_count}
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
        <div className="flex-1 flex flex-col">
          {activeConversationData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#2c2e36] bg-[#1e2029]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src={activeConversationData.participant.avatar_url || '/placeholder.svg'} 
                        alt={activeConversationData.participant.display_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {activeConversationData.participant.display_name}
                        </span>
                        {activeConversationData.participant.is_verified && (
                          <Star className="w-4 h-4 text-[#00aff0]" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        @{activeConversationData.participant.username}
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  const isUnlocked = message.is_read || isOwn || !message.is_ppv;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
                        {message.is_ppv && !isUnlocked ? (
                          // PPV Message (Locked)
                          <div className="bg-[#2c2e36] rounded-lg p-4 border border-[#3a3b44]">
                            <div className="text-center">
                              <Lock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                              <p className="text-sm text-gray-300 mb-2">Locked Content</p>
                              <p className="text-lg font-bold text-yellow-500 mb-3">
                                ${(message.ppv_price! / 100).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                                onClick={() => purchasePPVMessage(message.id, message.ppv_price!)}
                              >
                                Unlock
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Regular Message
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-[#00aff0] text-white'
                                : 'bg-[#2c2e36] text-white'
                            }`}
                          >
                            {message.media_url && (
                              <div className="mb-2">
                                {message.message_type === 'image' ? (
                                  <img
                                    src={message.media_url}
                                    alt="Shared content"
                                    className="max-w-full rounded"
                                  />
                                ) : message.message_type === 'video' ? (
                                  <video
                                    src={message.media_url}
                                    controls
                                    className="max-w-full rounded"
                                  />
                                ) : null}
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            {message.is_ppv && isUnlocked && (
                              <Badge className="mt-2 bg-yellow-500 text-black text-xs">
                                PPV Content
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-[#2c2e36] bg-[#1e2029]">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  
                  {profile?.is_creator && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-500 hover:text-yellow-400"
                      onClick={() => setShowPPVModal(true)}
                    >
                      <DollarSign className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      className="bg-[#252836] border-[#2c2e36] text-white pr-12"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <Button
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#00aff0] hover:bg-[#0095cc] h-8 w-8 p-0"
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PPV Message Modal */}
      {showPPVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1e2029] border-0 w-full max-w-lg">
            <CardHeader>
              <CardTitle>Send PPV Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ppv-content">Message</Label>
                <Textarea
                  id="ppv-content"
                  value={ppvMessage.content}
                  onChange={(e) => setPPVMessage(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-[#252836] border-[#2c2e36]"
                  placeholder="Enter your message..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="ppv-price">Price ($)</Label>
                <Input
                  id="ppv-price"
                  type="number"
                  value={ppvMessage.price}
                  onChange={(e) => setPPVMessage(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#252836] border-[#2c2e36]"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={sendPPVMessage}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={sendingMessage || !ppvMessage.content.trim()}
                >
                  Send PPV Message
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPPVModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Messages;
