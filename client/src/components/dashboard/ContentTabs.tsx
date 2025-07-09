
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PostCard from '@/components/PostCard';
import CreatorCard from '@/components/CreatorCard';
import { Heart, Users, TrendingUp } from 'lucide-react';

interface Post {
  id: string;
  title?: string;
  description?: string;
  content_type: string;
  is_premium: boolean;
  media_urls?: string[];
  thumbnail_url?: string;
  is_ppv: boolean;
  ppv_price?: number;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  creator_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
  bio?: string;
  total_subscribers?: number;
  subscription_price?: number;
}

interface ContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  filteredPosts: Post[];
  filteredCreators: Creator[];
  searchQuery: string;
}

const ContentTabs: React.FC<ContentTabsProps> = ({
  activeTab,
  onTabChange,
  filteredPosts,
  filteredCreators,
  searchQuery
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
        <TabsTrigger value="for-you" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-pink-600">For You</TabsTrigger>
        <TabsTrigger value="trending" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-pink-600">Trending</TabsTrigger>
        <TabsTrigger value="creators" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-pink-600">Creators</TabsTrigger>
      </TabsList>

      <TabsContent value="for-you" className="mt-6">
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No posts found</h3>
                <p className="text-gray-400">
                  {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create content!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="trending" className="mt-6">
        <div className="space-y-6">
          {filteredPosts
            .sort((a, b) => (b.like_count + b.view_count) - (a.like_count + a.view_count))
            .slice(0, 10)
            .map((post) => (
              <div key={post.id} className="relative">
                <PostCard post={post} />
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              </div>
            ))}
        </div>
      </TabsContent>

      <TabsContent value="creators" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No creators found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search terms' : 'No creators available yet'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ContentTabs;
