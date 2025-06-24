
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Upload } from 'lucide-react';

interface PostFormProps {
  onPostCreated?: () => void;
}

const PostForm: React.FC<PostFormProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isPpv, setIsPpv] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const uploadFiles = async (postId: string) => {
    const uploadedUrls: string[] = [];
    
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${postId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create the post first
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          creator_id: user.id,
          title: title.trim() || null,
          description: description.trim() || null,
          content_type: selectedFiles.length > 0 ? 
            (selectedFiles[0].type.startsWith('video/') ? 'video' : 'photo') : 'photo',
          is_premium: isPremium,
          is_ppv: isPpv,
          ppv_price: isPpv ? Math.round(parseFloat(ppvPrice) * 100) : null,
          is_published: true,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload files if any
      if (selectedFiles.length > 0 && post) {
        const mediaUrls = await uploadFiles(post.id);
        
        // Update post with media URLs
        const { error: updateError } = await supabase
          .from('posts')
          .update({ media_urls: mediaUrls })
          .eq('id', post.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setIsPremium(false);
      setIsPpv(false);
      setPpvPrice('');
      setSelectedFiles([]);

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Create New Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title to your post..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="media">Media Files</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload photos or videos
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {selectedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {selectedFiles.length} file(s) selected
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="premium"
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
              <Label htmlFor="premium">Premium Content</Label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="ppv"
                checked={isPpv}
                onCheckedChange={setIsPpv}
              />
              <Label htmlFor="ppv">Pay-Per-View</Label>
            </div>
            {isPpv && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="ppv-price">Price ($)</Label>
                <Input
                  id="ppv-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ppvPrice}
                  onChange={(e) => setPpvPrice(e.target.value)}
                  className="w-20"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-bg">
            {loading ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostForm;
