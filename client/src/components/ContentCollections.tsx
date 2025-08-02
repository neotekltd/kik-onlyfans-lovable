import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Image,
  Folder,
  Lock,
  Unlock,
  DollarSign,
  Grid
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Collection, Post } from '@/types/database';

const ContentCollections: React.FC = () => {
  const { user, profile } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
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
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('content_collections')
        .select(`
          *,
          collection_posts(count)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsWithCount: Collection[] = (data || []).map(collection => ({
        id: collection.id,
        title: collection.title,
        description: collection.description || undefined,
        is_public: collection.is_public || true,
        price: collection.price || 0,
        thumbnail_url: collection.thumbnail_url || undefined,
        created_at: collection.created_at || new Date().toISOString(),
        updated_at: collection.updated_at || new Date().toISOString(),
        creator_id: collection.creator_id || user.id,
        post_count: collection.collection_posts?.[0]?.count || 0
      }));

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    }
  };

  const fetchAvailablePosts = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content_type, thumbnail_url, created_at')
        .eq('creator_id', user.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalizedPosts: Post[] = (data || []).map(post => ({
        id: post.id,
        title: post.title || undefined,
        content_type: post.content_type,
        thumbnail_url: post.thumbnail_url || undefined,
        created_at: post.created_at
      }));

      setPosts(normalizedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
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
          description: newCollection.description || null,
          is_public: newCollection.is_public,
          price: newCollection.price
        }])
        .select()
        .single();

      if (error) throw error;

      const normalizedCollection: Collection = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        is_public: data.is_public || true,
        price: data.price || 0,
        thumbnail_url: data.thumbnail_url || undefined,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        creator_id: data.creator_id || user?.id || '',
        post_count: 0
      };

      setCollections([normalizedCollection, ...collections]);
      setNewCollection({ title: '', description: '', is_public: true, price: 0 });
      toast.success('Collection created successfully!');
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  const addPostsToCollection = async (collectionId: string) => {
    if (selectedPosts.length === 0) {
      toast.error('Please select posts to add');
      return;
    }

    try {
      const { error } = await supabase
        .from('collection_posts')
        .insert(
          selectedPosts.map((postId, index) => ({
            collection_id: collectionId,
            post_id: postId,
            order_index: index
          }))
        );

      if (error) throw error;

      setSelectedPosts([]);
      setSelectedCollection(null);
      fetchCollections(); // Refresh to update post counts
      toast.success('Posts added to collection!');
    } catch (error) {
      console.error('Error adding posts to collection:', error);
      toast.error('Failed to add posts to collection');
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
    <div className="space-y-6">
      {/* Create New Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Collection</CardTitle>
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="public"
                name="visibility"
                checked={newCollection.is_public}
                onChange={() => setNewCollection({ ...newCollection, is_public: true })}
              />
              <label htmlFor="public" className="flex items-center text-sm">
                <Unlock className="h-4 w-4 mr-1" />
                Public
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="private"
                name="visibility"
                checked={!newCollection.is_public}
                onChange={() => setNewCollection({ ...newCollection, is_public: false })}
              />
              <label htmlFor="private" className="flex items-center text-sm">
                <Lock className="h-4 w-4 mr-1" />
                Private
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <Input
              type="number"
              placeholder="Price (0 for free)"
              value={newCollection.price}
              onChange={(e) => setNewCollection({ ...newCollection, price: parseInt(e.target.value) || 0 })}
              className="w-32"
            />
          </div>
          <Button 
            onClick={createCollection} 
            disabled={isCreating || !newCollection.title.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Collection'}
          </Button>
        </CardContent>
      </Card>

      {/* Collections Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No collections yet. Create your first collection above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg mb-1">{collection.title}</h4>
                        {collection.description && (
                          <p className="text-sm text-gray-600 mb-2">{collection.description}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Badge variant={collection.is_public ? "default" : "secondary"}>
                            {collection.is_public ? (
                              <><Unlock className="h-3 w-3 mr-1" /> Public</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" /> Private</>
                            )}
                          </Badge>
                          <span>{collection.post_count || 0} posts</span>
                          {collection.price && collection.price > 0 && (
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3" />
                              {(collection.price / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCollection(collection)}
                      className="w-full"
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Add Posts
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Posts Modal */}
      {selectedCollection && (
        <Card>
          <CardHeader>
            <CardTitle>Add Posts to "{selectedCollection.title}"</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No posts available to add.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center space-x-3 p-2 border rounded">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPosts([...selectedPosts, post.id]);
                          } else {
                            setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{post.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{post.content_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => addPostsToCollection(selectedCollection.id)}
                    disabled={selectedPosts.length === 0}
                  >
                    Add {selectedPosts.length} Posts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCollection(null);
                      setSelectedPosts([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentCollections;