
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, TrendingUp, Plus, MessageSquare } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import PostForm from '@/components/PostForm';
import CreatorFeeExpiredAlert from '@/components/CreatorFeeExpiredAlert';
import StripeConnectSetup from '@/components/StripeConnectSetup';
import VerificationStatus from '@/components/VerificationStatus';
import MassMessageForm from '@/components/MassMessageForm';
import WelcomeMessageSetup from '@/components/WelcomeMessageSetup';

const Creator: React.FC = () => {
  const { profile, creatorProfile } = useAuth();
  const { stats, loading: statsLoading } = useCreatorStats();
  const [activeTab, setActiveTab] = useState('posts');
  
  const isPlatformFeeActive = creatorProfile?.is_platform_fee_active || false;
  const isVerified = profile?.is_verified || profile?.verification_status === 'verified';

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Studio</h1>
          <p className="text-gray-600 mt-2">Manage your content and track your performance</p>
        </div>

        {/* Platform Fee Alert */}
        <CreatorFeeExpiredAlert className="mb-6" />

        {/* Verification Status */}
        {!isVerified && (
          <div className="mb-6">
            <VerificationStatus />
          </div>
        )}

        {/* Quick Actions */}
        {isPlatformFeeActive && isVerified && (
          <div className="flex flex-wrap gap-3 mb-8">
            <MassMessageForm onMessageSent={() => {}} />
          </div>
        )}

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
        {isPlatformFeeActive && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="mb-8">
              <TabsTrigger value="posts">Create Post</TabsTrigger>
              <TabsTrigger value="welcome">Welcome Messages</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts">
              <PostForm />
            </TabsContent>
            
            <TabsContent value="welcome">
              <WelcomeMessageSetup />
            </TabsContent>
            
            <TabsContent value="payments">
              <div className="grid grid-cols-1 gap-6">
                {!isVerified ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Verification Required
                      </CardTitle>
                      <CardDescription>
                        You must complete the verification process before connecting your payment account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        To ensure compliance with payment regulations and protect both creators and users,
                        we require all creators to complete the verification process before they can receive payments.
                      </p>
                      <VerificationStatus />
                    </CardContent>
                  </Card>
                ) : (
                  <StripeConnectSetup />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default Creator;
