
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

const Messages = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [messageText, setMessageText] = useState('');

  const conversations = [
    {
      id: '1',
      user: {
        name: 'Autumn Ren',
        username: '@autumnren',
        avatar: '/placeholder.svg',
        isVerified: true,
        isOnline: true
      },
      lastMessage: "Better hurry up! I don't think I sho...",
      timestamp: '3:50 pm',
      unreadCount: 3,
      hasMedia: true
    },
    {
      id: '2',
      user: {
        name: 'Alli',
        username: '@itsalli777',
        avatar: '/placeholder.svg',
        isVerified: false,
        isOnline: false
      },
      lastMessage: "in the mood to play? I'm feeling r...",
      timestamp: '3:36 pm',
      unreadCount: 0,
      hasMedia: false
    },
    {
      id: '3',
      user: {
        name: 'TITA SAHARA',
        username: '@titasaharaofficial',
        avatar: '/placeholder.svg',
        isVerified: true,
        isOnline: true
      },
      lastMessage: "DON'T MISS OUT ON THAT BUND...",
      timestamp: '3:33 pm',
      unreadCount: 0,
      hasMedia: true
    },
    {
      id: '4',
      user: {
        name: 'Naughty Tiffany',
        username: '@naughty',
        avatar: '/placeholder.svg',
        isVerified: true,
        isOnline: false
      },
      lastMessage: "• Honey, what would you most...",
      timestamp: '3:27 pm',
      unreadCount: 0,
      hasMedia: true
    }
  ];

  const messages = selectedChat ? [
    {
      id: '1',
      senderId: '1',
      content: "Hey there! 💕 Thanks for subscribing to my content!",
      timestamp: '3:45 pm',
      type: 'text'
    },
    {
      id: '2',
      senderId: user?.id || '',
      content: "Thanks! Love your content so far 😍",
      timestamp: '3:46 pm',
      type: 'text'
    },
    {
      id: '3',
      senderId: '1',
      content: "I have some exclusive content just for you...",
      timestamp: '3:48 pm',
      type: 'text'
    },
    {
      id: '4',
      senderId: '1',
      content: "",
      timestamp: '3:50 pm',
      type: 'media',
      media: {
        type: 'video',
        thumbnail: '/placeholder.svg',
        price: 25.99,
        isLocked: true,
        duration: '2:34'
      }
    }
  ] : [];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Send message logic here
      setMessageText('');
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedChat);

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
                Priority
                <Badge variant="secondary" className="ml-1 bg-brand-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  5
                </Badge>
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 relative">
                Unread
                <Badge variant="secondary" className="ml-1 bg-brand-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  24
                </Badge>
              </Button>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat === conversation.id ? 'bg-brand-50 border-brand-200' : ''
                }`}
                onClick={() => setSelectedChat(conversation.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.user.avatar} />
                      <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {conversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {conversation.user.name}
                        </h4>
                        {conversation.user.isVerified && (
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {conversation.hasMedia && (
                          <Camera className="h-3 w-3 text-gray-400" />
                        )}
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
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
            ))}
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
                      <AvatarImage src={selectedConversation.user.avatar} />
                      <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedConversation.user.name}</h3>
                      <p className="text-sm text-gray-500">{selectedConversation.user.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        {message.type === 'text' ? (
                          <div className={`rounded-lg px-4 py-2 ${
                            isOwnMessage 
                              ? 'bg-brand-500 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        ) : message.type === 'media' && message.media ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative">
                              <img 
                                src={message.media.thumbnail} 
                                alt="Media preview" 
                                className={`w-full h-48 object-cover ${message.media.isLocked ? 'blur-lg' : ''}`}
                              />
                              {message.media.isLocked && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <div className="text-center text-white">
                                    <Play className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-sm font-medium">Unlock for ${message.media.price}</p>
                                    <Button size="sm" className="mt-2 gradient-creator">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Unlock
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {message.media.type === 'video' && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {message.media.duration}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    className="gradient-bg"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
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
