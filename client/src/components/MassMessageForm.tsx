import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Users, DollarSign, Image as ImageIcon, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateFile } from '@/lib/validations';

interface Subscriber {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  subscription_status: string;
  subscription_start_date: string;
}

interface MassMessageFormProps {
  onMessageSent?: () => void;
}

const MassMessageForm: React.FC<MassMessageFormProps> = ({ onMessageSent }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'new'>('all');
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Fetch subscribers when the dialog opens
  useEffect(() => {
    if (open && user) {
      fetchSubscribers();
    }
  }, [open, user]);

  const fetchSubscribers = async () => {
    if (!user) return;
    
    setLoadingSubscribers(true);
    try {
      // Get all subscribers
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          subscriber_id,
          status,
          start_date,
          profiles:subscriber_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('creator_id', user.id)
        .eq('status', 'active');
        
      if (error) throw error;
      
      // Transform data to subscribers array
      const subscribersData = data.map(sub => ({
        id: sub.subscriber_id,
        username: sub.profiles.username,
        display_name: sub.profiles.display_name,
        avatar_url: sub.profiles.avatar_url,
        subscription_status: sub.status,
        subscription_start_date: sub.start_date
      }));
      
      setSubscribers(subscribersData);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast({
        title: "Failed to load subscribers",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscribers(false);
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

  const getFilteredSubscribers = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (targetAudience) {
      case 'new':
        return subscribers.filter(sub => 
          new Date(sub.subscription_start_date) > oneWeekAgo
        );
      case 'active':
        return subscribers.filter(sub => 
          sub.subscription_status === 'active'
        );
      case 'all':
      default:
        return subscribers;
    }
  };

  const handleSendMassMessage = async () => {
    if (!user) return;
    
    if (isPPV && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your PPV message",
        variant: "destructive",
      });
      return;
    }
    
    const filteredSubscribers = getFilteredSubscribers();
    
    if (filteredSubscribers.length === 0) {
      toast({
        title: "No subscribers",
        description: "There are no subscribers to send messages to",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let mediaUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/mass_messages/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('messages')
          .upload(fileName, selectedFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);
          
        mediaUrl = publicUrl;
      }
      
      // Determine message type
      const messageType = selectedFile
        ? selectedFile.type.startsWith('image/') 
          ? 'image' 
          : selectedFile.type.startsWith('video/') 
            ? 'video' 
            : 'file'
        : 'text';
      
      // Send message to each subscriber
      const messages = filteredSubscribers.map(subscriber => ({
        sender_id: user.id,
        recipient_id: subscriber.id,
        content: content || null,
        message_type: messageType,
        media_url: mediaUrl,
        is_ppv: isPPV,
        ppv_price: isPPV ? Math.round(parseFloat(price) * 100) : null,
        is_read: false,
      }));
      
      // Insert all messages
      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messages);
      
      if (messagesError) throw messagesError;
      
      toast({
        title: "Mass message sent",
        description: `Successfully sent to ${filteredSubscribers.length} subscribers`,
      });
      
      // Reset form
      setContent('');
      setPrice('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setOpen(false);
      
      // Callback
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending mass message:', error);
      toast({
        title: "Failed to send messages",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Mass Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Send Mass Message to Subscribers
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience</Label>
            <Select 
              value={targetAudience} 
              onValueChange={(value) => setTargetAudience(value as 'all' | 'active' | 'new')}
            >
              <SelectTrigger id="target-audience">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscribers ({subscribers.length})</SelectItem>
                <SelectItem value="active">
                  Active Subscribers ({subscribers.filter(s => s.subscription_status === 'active').length})
                </SelectItem>
                <SelectItem value="new">
                  New Subscribers (Last 7 Days) ({
                    subscribers.filter(s => {
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return new Date(s.subscription_start_date) > oneWeekAgo;
                    }).length
                  })
                </SelectItem>
              </SelectContent>
            </Select>
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
          
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message to all subscribers..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
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
          
          {/* Subscriber Preview */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                Message Preview ({getFilteredSubscribers().length} recipients)
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {loadingSubscribers ? (
                <p className="text-sm text-muted-foreground">Loading subscribers...</p>
              ) : getFilteredSubscribers().length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscribers match the selected criteria</p>
              ) : (
                <p className="text-sm">
                  This message will be sent to {getFilteredSubscribers().length} subscribers
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMassMessage}
            disabled={loading || (!content && !selectedFile) || loadingSubscribers || getFilteredSubscribers().length === 0}
            className="flex items-center gap-2"
          >
            {loading ? 'Sending...' : (
              <>
                <Send className="h-4 w-4" />
                Send to {getFilteredSubscribers().length} Subscribers
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MassMessageForm;