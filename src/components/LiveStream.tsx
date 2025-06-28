
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  Heart, 
  MessageCircle,
  DollarSign,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LiveStreamProps {
  streamId?: string;
  isCreator?: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isVip?: boolean;
  tipAmount?: number;
}

const LiveStream: React.FC<LiveStreamProps> = ({ streamId, isCreator = false }) => {
  const { user, profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(42);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      username: 'fan123',
      message: 'Amazing stream! 🔥',
      timestamp: new Date(),
      isVip: false
    },
    {
      id: '2',
      username: 'vip_user',
      message: 'Love your content!',
      timestamp: new Date(),
      isVip: true,
      tipAmount: 10
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');

  useEffect(() => {
    if (isStreaming && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error('Error accessing media devices:', err));
    }
  }, [isStreaming]);

  const startStream = () => {
    setIsStreaming(true);
  };

  const stopStream = () => {
    setIsStreaming(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioOn;
      });
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        username: profile?.username || 'Anonymous',
        message: newMessage,
        timestamp: new Date(),
        isVip: false
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  const sendTip = () => {
    if (tipAmount && parseFloat(tipAmount) > 0) {
      const tipMessage: ChatMessage = {
        id: Date.now().toString(),
        username: profile?.username || 'Anonymous',
        message: `Sent a tip! 💖`,
        timestamp: new Date(),
        isVip: true,
        tipAmount: parseFloat(tipAmount)
      };
      setChatMessages([...chatMessages, tipMessage]);
      setTipAmount('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen max-h-screen">
      {/* Video Stream */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{profile?.display_name}</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{viewerCount} viewers</span>
                    </div>
                    {isStreaming && (
                      <Badge variant="destructive" className="animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {isCreator && (
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={toggleVideo}>
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={toggleAudio}>
                    {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {isStreaming ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted={isCreator}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Stream is offline</p>
                    {isCreator && (
                      <Button onClick={startStream} className="bg-red-600 hover:bg-red-700">
                        Start Live Stream
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {isStreaming && isCreator && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button onClick={stopStream} variant="destructive">
                    End Stream
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat and Tips */}
      <div className="space-y-4">
        {/* Live Chat */}
        <Card className="h-96">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Live Chat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 p-3">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${message.isVip ? 'text-purple-600' : 'text-gray-900'}`}>
                          {message.username}
                        </span>
                        {message.isVip && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                        {message.tipAmount && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <DollarSign className="h-3 w-3" />
                            <span className="text-xs font-medium">${message.tipAmount}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={sendMessage}>
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Send Tip</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 25].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setTipAmount(amount.toString())}
                  className="text-xs"
                >
                  ${amount}
                </Button>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Custom amount"
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={sendTip} className="bg-pink-600 hover:bg-pink-700">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveStream;
