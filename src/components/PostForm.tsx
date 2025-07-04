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
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postSchema, type PostFormData, sanitizeInput, validateFile } from '@/lib/validations';

interface PostFormProps {
  onPostCreated?: () => void;
}

const PostForm: React.FC<PostFormProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      description: '',
      isPremium: false,
      isPpv: false,
      ppvPrice: '',
    },
  });

  const watchIsPpv = watch('isPpv');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    setSelectedFiles(validFiles);
    setFileErrors(errors);

    if (errors.length > 0) {
      toast({
        title: "File validation errors",
        description: errors.join(', '),
        variant: "destructive",
      });
    }
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

  const onSubmit = async (data: PostFormData) => {
    if (!user) return;

    try {
      // Sanitize inputs
      const sanitizedTitle = data.title ? sanitizeInput(data.title) : null;
      const sanitizedDescription = data.description ? sanitizeInput(data.description) : null;

      // Create the post first
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          creator_id: user.id,
          title: sanitizedTitle,
          description: sanitizedDescription,
          content_type: selectedFiles.length > 0 ? 
            (selectedFiles[0].type.startsWith('video/') ? 'video' as const : 'photo' as const) : 'photo' as const,
          is_premium: data.isPremium,
          is_ppv: data.isPpv,
          ppv_price: data.isPpv && data.ppvPrice ? Math.round(parseFloat(data.ppvPrice) * 100) : null,
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
      reset();
      setSelectedFiles([]);
      setFileErrors([]);

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Add a title to your post..."
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.title.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="What's on your mind?"
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.description.message}
              </div>
            )}
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
              {fileErrors.length > 0 && (
                <div className="mt-2">
                  {fileErrors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="premium"
                {...register('isPremium')}
              />
              <Label htmlFor="premium">Premium Content</Label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="ppv"
                {...register('isPpv')}
              />
              <Label htmlFor="ppv">Pay-Per-View</Label>
            </div>
            {watchIsPpv && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="ppv-price">Price ($)</Label>
                <div className="space-y-1">
                  <Input
                    id="ppv-price"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999.99"
                    {...register('ppvPrice')}
                    className={`w-20 ${errors.ppvPrice ? 'border-destructive' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.ppvPrice && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.ppvPrice.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full gradient-bg">
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostForm;