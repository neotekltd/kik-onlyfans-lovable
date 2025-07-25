
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, TrendingUp, Plus } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import PostForm from '@/components/PostForm';
import CreatorFeeExpiredAlert from '@/components/CreatorFeeExpiredAlert';

const Creator: React.FC = () => {
  const { profile, creatorProfile } = useAuth();
  const { stats, loading: statsLoading } = useCreatorStats();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!profile?.is_creator) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only available for creators.</p>
        </div>
      </MainLayout>
    );
  }

  const isPlatformFeeActive = creatorProfile?.is_platform_fee_active;

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Studio</h1>
          <p className="text-gray-600 mt-2">Manage your content and track your performance</p>
        </div>

        {/* Platform Fee Alert */}
        <CreatorFeeExpiredAlert className="mb-6" />

        {/* Quick Stats */}
        {!statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(stats.totalEarnings / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +${(stats.monthlyEarnings / 100).toFixed(2)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.recentSubscribers} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.engagementRate.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average likes per post
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Creator Tools */}
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList>
            <TabsTrigger value="create">Create Content</TabsTrigger>
            <TabsTrigger value="manage">Manage Posts</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            {isPlatformFeeActive ? (
              <PostForm onPostCreated={handlePostCreated} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Creator Features Restricted</CardTitle>
                  <CardDescription>
                    Your creator features are restricted because your platform fee has not been paid.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Please pay the $3 monthly platform fee to continue creating content.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Posts</CardTitle>
                <CardDescription>Manage your published content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Post management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Management</CardTitle>
                <CardDescription>View and manage your subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Subscriber management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Creator;
