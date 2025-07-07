
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  FolderPlus, 
  Folder, 
  Image, 
  Video, 
  DollarSign,
  Plus,
  Settings,
  Eye,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AccessRestriction from './AccessRestriction';

interface Collection {
  id: string;
  title: string;
  description?: string;
  is_public: boolean;
  price: number;
  thumbnail_url?: string;
  created_at: string;
  post_count?: number;
}

interface Post {
  id: string;
  title?: string;
  content_type: string;
  thumbnail_url?: string;
  created_at: string;
}

const ContentCollections: React.FC = () => {
  const { user, profile } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionPosts, setCollectionPosts] = useState<Post[]>([]);
  const [availablePosts, setAvailablePosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollection, setNewCollection] = useState({
    title: '',
    description: '',
    is_public: true,
    price: 0
  });

  useEffect(() => {
    if (user && profile?.is_creator) {
      fetchCollections();
      fetchAvailablePosts();
    }
  }, [user, profile]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('content_collections')
        .select(`
          *,
          collection_posts(count)
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsWithCount = data?.map(collection => ({
        ...collection,
        post_count: collection.collection_posts?.[0]?.count || 0
      })) || [];

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchAvailablePosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content_type, thumbnail_url, created_at')
        .eq('creator_id', user?.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvailablePosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchCollectionPosts = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_posts')
        .select(`
          posts(id, title, content_type, thumbnail_url, created_at)
        `)
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const posts = data?.map(item => item.posts).filter(Boolean) || [];
      setCollectionPosts(posts as Post[]);
    } catch (error) {
      console.error('Error fetching collection posts:', error);
    }
  };

  const createCollection = async () => {
    if (!newCollection.title.trim()) {
      toast.error('Please enter a collection title');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('content_collections')
        .insert([{
          creator_id: user?.id,
          title: newCollection.title,
          description: newCollection.description,
          is_public: newCollection.is_public,
          price: newCollection.price * 100 // Convert to cents
        }])
        .select()
        .single();

      if (error) throw error;

      setCollections([{ ...data, post_count: 0 }, ...collections]);
      setNewCollection({
        title: '',
        description: '',
        is_public: true,
        price: 0
      });
      toast.success('Collection created successfully!');
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  const addPostToCollection = async (collectionId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('collection_posts')
        .insert([{
          collection_id: collectionId,
          post_id: postId,
          order_index: collectionPosts.length
        }]);

      if (error) throw error;

      await fetchCollectionPosts(collectionId);
      await fetchCollections();
      toast.success('Post added to collection');
    } catch (error) {
      console.error('Error adding post to collection:', error);
      toast.error('Failed to add post to collection');
    }
  };

  const removePostFromCollection = async (collectionId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('collection_posts')
        .delete()
        .eq('collection_id', collectionId)
        .eq('post_id', postId);

      if (error) throw error;

      await fetchCollectionPosts(collectionId);
      await fetchCollections();
      toast.success('Post removed from collection');
    } catch (error) {
      console.error('Error removing post from collection:', error);
      toast.error('Failed to remove post from collection');
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'photo':
        return <Image className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  if (!profile?.is_creator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Creator Account Required</h3>
          <p className="text-gray-600">You need a creator account to manage content collections.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AccessRestriction>
      <div className="space-y-6">
      {/* Create New Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderPlus className="h-5 w-5" />
            <span>Create Collection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Collection title"
            value={newCollection.title}
            onChange={(e) => setNewCollection({ ...newCollection, title: e.target.value })}
          />
          <Textarea
            placeholder="Collection description (optional)"
            value={newCollection.description}
            onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={newCollection.is_public}
                onCheckedChange={(checked) => setNewCollection({ ...newCollection, is_public: checked })}
              />
              <span className="text-sm">Public collection</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <Input
                type="number"
                placeholder="0"
                value={newCollection.price}
                onChange={(e) => setNewCollection({ ...newCollection, price: parseFloat(e.target.value) || 0 })}
                className="w-20"
                min="0"
                step="1"
              />
              <span className="text-sm text-gray-500">USD</span>
            </div>
          </div>
          <Button 
            onClick={createCollection} 
            disabled={isCreating || !newCollection.title.trim()}
            className="w-full"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Collection'}
          </Button>
        </CardContent>
      </Card>

      {/* Collections List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Collections ({collections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {collections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No collections yet. Create your first collection above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCollection?.id === collection.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedCollection(collection);
                      fetchCollectionPosts(collection.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{collection.title}</h4>
                          {collection.is_public ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-500" />
                          )}
                          {collection.price > 0 && (
                            <Badge variant="secondary">
                              ${(collection.price / 100).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        {collection.description && (
                          <p className="text-sm text-gray-600 mb-2">{collection.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {collection.post_count} posts • Created {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Collection Posts */}
        {selectedCollection && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCollection.title} ({collectionPosts.length} posts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectionPosts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No posts in this collection yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collectionPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getContentIcon(post.content_type)}
                          <div>
                            <p className="font-medium text-sm">
                              {post.title || `${post.content_type} post`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePostFromCollection(selectedCollection.id, post.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Posts Section */}
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-3">Add Posts to Collection</h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availablePosts
                      .filter(post => !collectionPosts.some(cp => cp.id === post.id))
                      .map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center space-x-2">
                            {getContentIcon(post.content_type)}
                            <span className="text-sm">
                              {post.title || `${post.content_type} post`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addPostToCollection(selectedCollection.id, post.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </AccessRestriction>
  );
};

export default ContentCollections;
