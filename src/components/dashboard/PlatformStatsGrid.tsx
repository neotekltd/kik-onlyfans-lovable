
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Star, Heart, DollarSign } from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  totalCreators: number;
  totalPosts: number;
  totalRevenue: number;
  activeSubscriptions: number;
  topCategories: string[];
}

interface PlatformStatsGridProps {
  stats: PlatformStats | null;
  loading: boolean;
}

const PlatformStatsGrid: React.FC<PlatformStatsGridProps> = ({ stats, loading }) => {
  if (!stats || loading) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-pink-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Content Creators</p>
              <p className="text-2xl font-bold text-white">{stats.totalCreators.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Premium Posts</p>
              <p className="text-2xl font-bold text-white">{stats.totalPosts.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Active Subscriptions</p>
              <p className="text-2xl font-bold text-white">{stats.activeSubscriptions.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformStatsGrid;
