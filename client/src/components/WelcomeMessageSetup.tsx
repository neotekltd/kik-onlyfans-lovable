import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Image as ImageIcon, Send, X, Plus, Trash, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateFile } from '@/lib/validations';

interface WelcomeMessage {
  id: string;
  creator_id: string;
  content: string;
  media_url?: string;
  message_type: string;
  is_ppv: boolean;
  ppv_price?: number;
  delay_hours: number;
  is_active: boolean;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

const WelcomeMessageSetup: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<WelcomeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New message form state
  const [content, setContent] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState('');
  const [delayHours, setDelayHours] = useState('0');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('messages');

  // Fetch welcome messages on component mount
  useEffect(() => {
    if (user) {
      fetchWelcomeMessages();
    }
  }, [user]);

  const fetchWelcomeMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('welcome_messages')
        .select('*')
        .eq('creator_id', user.id)
        .order('sequence_order', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching welcome messages:', error);
      toast({
        title: 'Failed to load welcome messages',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleAddMessage = async () => {
    if (!user) return;
    
    if (!content.trim() && !selectedFile) {
      toast({
        title: 'Message required',
        description: 'Please add text or media to your welcome message',
        variant: 'destructive',
      });
      return;
    }
    
    if (isPPV && (!price || parseFloat(price) <= 0)) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price for your PPV content',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    
    try {
      let mediaUrl = null;
      let messageType = 'text';
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/welcome_messages/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('messages')
          .upload(fileName, selectedFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);
          
        mediaUrl = publicUrl;
        
        // Set message type based on file type
        messageType = selectedFile.type.startsWith('image/') 
          ? 'image' 
          : selectedFile.type.startsWith('video/') 
            ? 'video' 
            : 'file';
      }
      
      // Get the highest sequence order
      const nextOrder = messages.length > 0
        ? Math.max(...messages.map(m => m.sequence_order)) + 1
        : 0;
      
      // Create the welcome message
      const { error } = await supabase
        .from('welcome_messages')
        .insert({
          creator_id: user.id,
          content: content || null,
          media_url: mediaUrl,
          message_type: messageType,
          is_ppv: isPPV,
          ppv_price: isPPV ? Math.round(parseFloat(price) * 100) : null,
          delay_hours: parseInt(delayHours) || 0,
          is_active: true,
          sequence_order: nextOrder,
        });
        
      if (error) throw error;
      
      toast({
        title: 'Welcome message added',
        description: 'Your welcome message has been saved',
      });
      
      // Reset form
      setContent('');
      setIsPPV(false);
      setPrice('');
      setDelayHours('0');
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Refresh messages
      fetchWelcomeMessages();
      
    } catch (error) {
      console.error('Error adding welcome message:', error);
      toast({
        title: 'Failed to add welcome message',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (message: WelcomeMessage) => {
    try {
      const { error } = await supabase
        .from('welcome_messages')
        .update({ is_active: !message.is_active })
        .eq('id', message.id);
        
      if (error) throw error;
      
      // Update local state
      setMessages(messages.map(m => 
        m.id === message.id ? { ...m, is_active: !m.is_active } : m
      ));
      
      toast({
        title: message.is_active ? 'Message disabled' : 'Message enabled',
        description: message.is_active 
          ? 'Welcome message will no longer be sent to new subscribers' 
          : 'Welcome message will be sent to new subscribers',
      });
      
    } catch (error) {
      console.error('Error toggling message status:', error);
      toast({
        title: 'Failed to update message',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('welcome_messages')
        .delete()
        .eq('id', messageId);
        
      if (error) throw error;
      
      // Update local state
      setMessages(messages.filter(m => m.id !== messageId));
      
      toast({
        title: 'Message deleted',
        description: 'Welcome message has been removed',
      });
      
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Failed to delete message',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleReorderMessages = async (messageId: string, direction: 'up' | 'down') => {
    const currentIndex = messages.findIndex(m => m.id === messageId);
    if (currentIndex === -1) return;
    
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (swapIndex < 0 || swapIndex >= messages.length) return;
    
    // Swap messages
    const newMessages = [...messages];
    const temp = newMessages[currentIndex].sequence_order;
    newMessages[currentIndex].sequence_order = newMessages[swapIndex].sequence_order;
    newMessages[swapIndex].sequence_order = temp;
    
    // Sort by sequence order
    newMessages.sort((a, b) => a.sequence_order - b.sequence_order);
    
    // Update local state first for immediate feedback
    setMessages(newMessages);
    
    try {
      // Update both messages in database
      const updates = [
        {
          id: messages[currentIndex].id,
          sequence_order: newMessages.find(m => m.id === messages[currentIndex].id)?.sequence_order
        },
        {
          id: messages[swapIndex].id,
          sequence_order: newMessages.find(m => m.id === messages[swapIndex].id)?.sequence_order
        }
      ];
      
      for (const update of updates) {
        const { error } = await supabase
          .from('welcome_messages')
          .update({ sequence_order: update.sequence_order })
          .eq('id', update.id);
          
        if (error) throw error;
      }
      
    } catch (error) {
      console.error('Error reordering messages:', error);
      toast({
        title: 'Failed to reorder messages',
        description: 'Please try again',
        variant: 'destructive',
      });
      // Revert to original order on error
      fetchWelcomeMessages();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Welcome Messages
        </CardTitle>
        <CardDescription>
          Set up automatic messages that will be sent to new subscribers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="messages">Your Messages</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages">
            {loading ? (
              <div className="flex justify-center p-8">
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-2">No welcome messages yet</h3>
                <p className="text-gray-500 mb-4">
                  Create messages to automatically greet your new subscribers
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Welcome Message
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <Card key={message.id} className={!message.is_active ? "opacity-70" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 rounded-full p-2">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {message.delay_hours === 0 
                                ? "Immediate" 
                                : `After ${message.delay_hours} hour${message.delay_hours > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Sequence #{message.sequence_order + 1}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={message.is_active}
                            onCheckedChange={() => handleToggleActive(message)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        {message.content && (
                          <p className="text-sm mb-3">{message.content}</p>
                        )}
                        
                        {message.media_url && (
                          <div className="rounded-md overflow-hidden border bg-muted/20 mt-2">
                            {message.message_type === 'image' ? (
                              <img 
                                src={message.media_url} 
                                alt="Welcome message media" 
                                className="max-h-40 object-cover w-full"
                              />
                            ) : message.message_type === 'video' ? (
                              <div className="aspect-video bg-black flex items-center justify-center">
                                <video 
                                  src={message.media_url} 
                                  controls 
                                  className="max-h-40 max-w-full"
                                />
                              </div>
                            ) : (
                              <div className="p-4 flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">Media attachment</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {message.is_ppv && (
                          <div className="flex items-center gap-2 mt-3 text-amber-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Pay-per-view: ${(message.ppv_price! / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between mt-4 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorderMessages(message.id, 'up')}
                          disabled={index === 0}
                        >
                          Move Up
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorderMessages(message.id, 'down')}
                          disabled={index === messages.length - 1}
                        >
                          Move Down
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <div className="space-y-4">
              {/* Message Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Message Text</Label>
                <Textarea
                  id="content"
                  placeholder="Welcome to my exclusive content! Thanks for subscribing..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Media (Optional)</Label>
                {previewUrl ? (
                  <div className="relative">
                    <div className="relative rounded-md overflow-hidden bg-black/5 border aspect-video flex items-center justify-center">
                      {selectedFile?.type.startsWith('image/') ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-full max-w-full object-contain" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">{selectedFile?.name}</p>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={clearFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Images or videos (optional)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Delay Setting */}
              <div className="space-y-2">
                <Label htmlFor="delay">Send After (hours)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  step="1"
                  value={delayHours}
                  onChange={(e) => setDelayHours(e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  0 = send immediately when someone subscribes
                </p>
              </div>
              
              {/* PPV Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ppv-toggle">Pay-Per-View</Label>
                  <p className="text-sm text-muted-foreground">
                    Subscribers must pay to view this content
                  </p>
                </div>
                <Switch
                  id="ppv-toggle"
                  checked={isPPV}
                  onCheckedChange={setIsPPV}
                />
              </div>
              
              {/* Price Input */}
              {isPPV && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="5.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-8"
                      min="0.50"
                      step="0.01"
                    />
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveTab('messages')}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddMessage}
                  disabled={saving || (!content && !selectedFile)}
                >
                  {saving ? 'Saving...' : 'Add Welcome Message'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WelcomeMessageSetup;