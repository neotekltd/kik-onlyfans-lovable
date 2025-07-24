import React from 'react';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Heart, Star, MessageCircle } from 'lucide-react';

interface UserDashboardViewProps {
  onBecomeCreator: () => void;
  isBecomingCreator: boolean;
}

const UserDashboardView: React.FC<UserDashboardViewProps> = ({ 
  onBecomeCreator, 
  isBecomingCreator 
}) => {
  const { stats, loading } = useUserDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSubscriptions}</div>
            <p className="text-xs text-gray-400">
              {stats.totalSubscriptions === 0 ? 'No subscriptions yet' : 'Active subscriptions'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${(stats.totalSpent / 100).toFixed(2)}</div>
            <p className="text-xs text-gray-400">
              {stats.totalSpent === 0 ? 'No purchases yet' : 'All time spending'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Favorite Creators</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.favoriteCreators.length}</div>
            <p className="text-xs text-gray-400">
              {stats.favoriteCreators.length === 0 ? 'No favorites yet' : 'Creators you support'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {'amount' in activity ? `Tip: $${(activity.amount / 100).toFixed(2)}` : 
                         'amount_paid' in activity ? `Subscription: $${(activity.amount_paid / 100).toFixed(2)}` : 'Activity'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {'profiles' in activity && activity.profiles && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.profiles.display_name}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
              <p className="text-gray-400 mb-4">
                Start supporting creators to see your activity here!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favorite Creators */}
      {stats.favoriteCreators.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5" />
              Your Favorite Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.favoriteCreators.map((creator, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    {creator.avatar_url ? (
                      <img 
                        src={creator.avatar_url} 
                        alt={creator.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{creator.display_name}</p>
                    <p className="text-xs text-gray-400">@{creator.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Become a Creator CTA */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Star className="h-6 w-6" />
            Ready to Become a Creator?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-purple-100 mb-4">
            Start earning money by sharing your content with fans around the world
          </p>
          <Button 
            onClick={onBecomeCreator}
            disabled={isBecomingCreator}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
          >
            {isBecomingCreator ? 'Activating...' : 'Become a Creator'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboardView;