import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  Save,
  DollarSign,
  Type,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WelcomeMessage {
  id: string;
  creator_id: string;
  content: string;
  message_type: 'text' | 'media' | 'ppv';
  media_url?: string;
  is_ppv: boolean;
  ppv_price?: number;
  is_active: boolean;
  created_at: string;
}

const WelcomeMessageSetup: React.FC = () => {
  const { user, profile } = useAuth();
  const [welcomeMessages, setWelcomeMessages] = useState<WelcomeMessage[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newMessage, setNewMessage] = useState({
    content: '',
    message_type: 'text' as 'text' | 'media' | 'ppv',
    is_ppv: false,
    ppv_price: 0,
    media_url: '',
    is_active: true
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user && profile?.is_creator) {
      fetchWelcomeMessages();
    }
  }, [user, profile]);

  const fetchWelcomeMessages = async () => {
    if (!user?.id) return;
    
    try {
      // Using messages table with a specific pattern for welcome messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id)
        .eq('recipient_id', user.id) // Self-reference for welcome message templates
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Convert to welcome message format
      const convertedMessages: WelcomeMessage[] = (data || []).map(msg => ({
        id: msg.id,
        creator_id: msg.sender_id,
        content: msg.content || '',
        message_type: msg.message_type as 'text' | 'media' | 'ppv',
        media_url: msg.media_url || undefined,
        is_ppv: msg.is_ppv,
        ppv_price: msg.ppv_price || undefined,
        is_active: msg.is_read, // Using is_read as proxy for is_active
        created_at: msg.created_at
      }));

      setWelcomeMessages(convertedMessages);
    } catch (error) {
      console.error('Error fetching welcome messages:', error);
      toast.error('Failed to load welcome messages');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user?.id) return null;

    setIsUploading(true);
    try {
      const fileName = `welcome/${user.id}/${Date.now()}-${file.name}`;
      
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
      toast.error('Failed to upload media file');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setNewMessage(prev => ({ ...prev, message_type: 'media' }));

    const uploadedUrl = await handleFileUpload(file);
    if (uploadedUrl) {
      setNewMessage(prev => ({ ...prev, media_url: uploadedUrl }));
    }
  };

  const createWelcomeMessage = async () => {
    if (!user?.id) return;
    
    if (!newMessage.content.trim() && !newMessage.media_url) {
      toast.error('Please enter a message or upload media');
      return;
    }

    if (newMessage.is_ppv && newMessage.ppv_price <= 0) {
      toast.error('PPV price must be greater than 0');
      return;
    }

    setIsCreating(true);
    try {
      // Create a message entry (using self-reference for welcome message templates)
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: user.id, // Self-reference for templates
          content: newMessage.content.trim() || null,
          message_type: newMessage.message_type,
          media_url: newMessage.media_url || null,
          is_ppv: newMessage.is_ppv,
          ppv_price: newMessage.is_ppv ? Math.round(newMessage.ppv_price * 100) : null,
          is_read: newMessage.is_active // Using is_read as proxy for is_active
        }])
        .select()
        .single();

      if (error) throw error;

      const newWelcomeMsg: WelcomeMessage = {
        id: data.id,
        creator_id: data.sender_id,
        content: data.content || '',
        message_type: data.message_type as 'text' | 'media' | 'ppv',
        media_url: data.media_url || undefined,
        is_ppv: data.is_ppv,
        ppv_price: data.ppv_price || undefined,
        is_active: data.is_read || false,
        created_at: data.created_at
      };

      setWelcomeMessages([newWelcomeMsg, ...welcomeMessages]);
      
      // Reset form
      setNewMessage({
        content: '',
        message_type: 'text',
        is_ppv: false,
        ppv_price: 0,
        media_url: '',
        is_active: true
      });
      setUploadedFile(null);
      
      toast.success('Welcome message created successfully!');
    } catch (error) {
      console.error('Error creating welcome message:', error);
      toast.error('Failed to create welcome message');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMessageStatus = async (messageId: string, isActive: boolean) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('messages')
        .update({ is_read: isActive }) // Using is_read as proxy for is_active
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setWelcomeMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_active: isActive } : msg
        )
      );
      
      toast.success(`Welcome message ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const deleteWelcomeMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setWelcomeMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Welcome message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  if (!profile?.is_creator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Creator Account Required</h3>
          <p className="text-gray-600">You need a creator account to set up welcome messages.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Create Welcome Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Message Type</label>
            <div className="flex space-x-2">
              {(['text', 'media', 'ppv'] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={newMessage.message_type === type ? "default" : "outline"}
                  onClick={() => setNewMessage(prev => ({ ...prev, message_type: type }))}
                >
                  {type === 'text' && <Type className="h-4 w-4 mr-1" />}
                  {type === 'ppv' && <DollarSign className="h-4 w-4 mr-1" />}
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Content</label>
            <Textarea
              placeholder="Enter your welcome message..."
              value={newMessage.content}
              onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />
          </div>

          {(newMessage.message_type === 'media' || newMessage.message_type === 'ppv') && (
            <div>
              <label className="block text-sm font-medium mb-2">Media</label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                disabled={isUploading}
              />
              {isUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {uploadedFile && (
                <p className="text-sm text-green-600 mt-1">File uploaded: {uploadedFile.name}</p>
              )}
            </div>
          )}

          {newMessage.message_type === 'ppv' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newMessage.is_ppv}
                  onCheckedChange={(checked) => setNewMessage(prev => ({ ...prev, is_ppv: checked }))}
                />
                <label className="text-sm font-medium">Enable Pay-Per-View</label>
              </div>
              
              {newMessage.is_ppv && (
                <div>
                  <label className="block text-sm font-medium mb-2">PPV Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMessage.ppv_price}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, ppv_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              checked={newMessage.is_active}
              onCheckedChange={(checked) => setNewMessage(prev => ({ ...prev, is_active: checked }))}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <Button 
            onClick={createWelcomeMessage}
            disabled={isCreating || isUploading || (!newMessage.content.trim() && !newMessage.media_url)}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Welcome Message'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Welcome Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Your Welcome Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {welcomeMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No welcome messages yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {welcomeMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={message.is_active ? "default" : "secondary"}>
                          {message.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {message.message_type.toUpperCase()}
                        </Badge>
                        {message.is_ppv && message.ppv_price && (
                          <Badge variant="secondary">
                            ${(message.ppv_price / 100).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      
                      {message.content && (
                        <p className="text-sm mb-2">{message.content}</p>
                      )}
                      
                      {message.media_url && (
                        <div className="text-xs text-gray-500 mb-2">
                          Media attached
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Created: {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={message.is_active}
                        onCheckedChange={(checked) => toggleMessageStatus(message.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteWelcomeMessage(message.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeMessageSetup;
