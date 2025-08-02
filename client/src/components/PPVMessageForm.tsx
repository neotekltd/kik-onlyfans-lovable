import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Lock, DollarSign, Image as ImageIcon, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateFile } from '@/lib/validations';

interface PPVMessageFormProps {
  recipientId: string;
  onMessageSent?: () => void;
  onCancel?: () => void;
}

const PPVMessageForm: React.FC<PPVMessageFormProps> = ({ recipientId, onMessageSent, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isPPV, setIsPPV] = useState(true);
  const [price, setPrice] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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

  const handleSend = async () => {
    if (!user) return;
    
    if (isPPV && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your PPV message",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "Media required",
        description: "Please select a file to send as PPV content",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Upload the file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${recipientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(fileName, selectedFile);
        
      if (uploadError) throw uploadError;
      
      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(fileName);
      
      // 3. Create the message
      const messageType: 'text' | 'media' | 'ppv' = isPPV ? 'ppv' : 'media';
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: content || null,
          message_type: messageType,
          media_url: publicUrl,
          is_ppv: isPPV,
          ppv_price: isPPV ? Math.round(parseFloat(price) * 100) : null,
          is_read: false,
        });
      
      if (messageError) throw messageError;
      
      toast({
        title: "Message sent",
        description: isPPV ? "PPV message sent successfully" : "Message sent successfully",
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
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
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
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>Send PPV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Send Pay-Per-View Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Media</Label>
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
                    <p className="text-xs text-gray-500">Images or videos</p>
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
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* PPV Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ppv-toggle">Pay-Per-View</Label>
              <p className="text-sm text-muted-foreground">
                Recipient must pay to view this content
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
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setOpen(false);
            onCancel?.();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={loading || !selectedFile}
            className="flex items-center gap-2"
          >
            {loading ? 'Sending...' : (
              <>
                <Send className="h-4 w-4" />
                Send {isPPV ? 'PPV' : ''} Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PPVMessageForm;